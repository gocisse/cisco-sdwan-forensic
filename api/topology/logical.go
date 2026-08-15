// logical.go - Logical topology aggregation layer
// Transforms raw BFD sessions into device-to-device relationships
package topology

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"strings"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// TransportSession represents a single BFD/IPsec tunnel within a relationship
type TransportSession struct {
	Color       string `json:"color"`
	State       string `json:"state"`
	SrcIP       string `json:"srcIp"`
	DstIP       string `json:"dstIp"`
	Proto       string `json:"proto"`
	Uptime      string `json:"uptime"`
	UptimeDate  int64  `json:"uptimeDate,omitempty"`
	TxInterval  int    `json:"txInterval,omitempty"`
	Transitions int    `json:"transitions,omitempty"`
	LastUpdated int64  `json:"lastUpdated,omitempty"`
}

// Relationship represents a logical connection between the selected device and a peer
type Relationship struct {
	PeerIP       string             `json:"peerIp"`
	PeerHostname string             `json:"peerHostname"`
	PeerType     string             `json:"peerType"`
	SiteID       interface{}        `json:"siteId"`
	Importance   int                `json:"importance"`
	HealthStatus string             `json:"healthStatus"`
	Transports   []TransportSession `json:"transports"`
	ActiveCount  int                `json:"activeCount"`
	TotalCount   int                `json:"totalCount"`
}

// LogicalTopologyResponse is the aggregated topology for a selected device
type LogicalTopologyResponse struct {
	SelectedDevice   string         `json:"selectedDevice"`
	SelectedHostname string         `json:"selectedHostname"`
	Relationships    []Relationship `json:"relationships"`
	TotalPeers       int            `json:"totalPeers"`
	HiddenCount      int            `json:"hiddenCount"`
}

// rawBFDSession represents the raw BFD data from vManage
type rawBFDSession struct {
	SystemIP        string      `json:"system-ip"`
	SrcIP           string      `json:"src-ip"`
	DstIP           string      `json:"dst-ip"`
	Color           string      `json:"color"`
	LocalColor      string      `json:"local-color"`
	State           string      `json:"state"`
	Proto           string      `json:"proto"`
	Uptime          string      `json:"uptime"`
	UptimeDate      int64       `json:"uptime-date"`
	TxInterval      int         `json:"tx-interval"`
	Transitions     int         `json:"transitions"`
	SiteID          interface{} `json:"site-id"`
	VdeviceHostName string      `json:"vdevice-host-name"`
	VdeviceName     string      `json:"vdevice-name"`
	LastUpdated     int64       `json:"lastupdated"`
}

// deviceRecord for looking up device info
type deviceRecord struct {
	SystemIP    string      `json:"system-ip"`
	HostName    string      `json:"host-name"`
	DeviceType  string      `json:"device-type"`
	Personality string      `json:"personality"`
	SiteID      interface{} `json:"site-id"`
	Model       string      `json:"device-model"`
}

// FetchLogicalTopology aggregates BFD sessions into logical device relationships
// GET /api/topology/logical/{system-ip}?showAll=true
// Query params:
//   - showAll: if "true", returns all peers without limit (default: false, limited to 15)
func FetchLogicalTopology(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		// Check if user wants all peers
		showAll := r.URL.Query().Get("showAll") == "true"

		// Get device list for hostname/type lookups
		deviceMap := buildDeviceMap(apiClient)

		// Get selected device info
		selectedHostname := systemIP
		if dev, ok := deviceMap[systemIP]; ok {
			selectedHostname = dev.HostName
		}

		// Fetch raw BFD sessions
		endpoint := "dataservice/device/bfd/sessions?deviceId=" + systemIP
		rawData, err := apiClient.Get(endpoint)
		if err != nil {
			log.Printf("BFD fetch error for %s: %v", systemIP, err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch BFD sessions")
			return
		}

		var envelope struct {
			Data []rawBFDSession `json:"data"`
		}
		if err := json.Unmarshal(rawData, &envelope); err != nil {
			log.Printf("BFD parse error: %v", err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse BFD response")
			return
		}

		// Aggregate BFD sessions by peer system-ip
		peerMap := make(map[string][]rawBFDSession)
		for _, session := range envelope.Data {
			peerIP := session.SystemIP
			if peerIP == "" || peerIP == systemIP {
				continue
			}
			peerMap[peerIP] = append(peerMap[peerIP], session)
		}

		// Build relationships
		relationships := make([]Relationship, 0, len(peerMap))
		for peerIP, sessions := range peerMap {
			rel := buildRelationship(peerIP, sessions, deviceMap)
			relationships = append(relationships, rel)
		}

		// Sort by importance (descending)
		sort.Slice(relationships, func(i, j int) bool {
			return relationships[i].Importance > relationships[j].Importance
		})

		// Apply limit (show top 15, hide rest) unless showAll is requested
		const maxVisible = 15
		hiddenCount := 0
		if !showAll && len(relationships) > maxVisible {
			hiddenCount = len(relationships) - maxVisible
			relationships = relationships[:maxVisible]
		}

		response := LogicalTopologyResponse{
			SelectedDevice:   systemIP,
			SelectedHostname: selectedHostname,
			Relationships:    relationships,
			TotalPeers:       len(peerMap),
			HiddenCount:      hiddenCount,
		}

		log.Printf("🔗 Logical topology for %s: %d peers (%d visible, %d hidden)",
			systemIP, len(peerMap), len(relationships), hiddenCount)

		payload, _ := json.Marshal(response)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}
}

// buildDeviceMap fetches all devices and creates a lookup map
func buildDeviceMap(apiClient *utils.APIClient) map[string]deviceRecord {
	deviceMap := make(map[string]deviceRecord)

	rawData, err := apiClient.Get("dataservice/device")
	if err != nil {
		log.Printf("Device list fetch error: %v", err)
		return deviceMap
	}

	var envelope struct {
		Data []deviceRecord `json:"data"`
	}
	if err := json.Unmarshal(rawData, &envelope); err != nil {
		log.Printf("Device list parse error: %v", err)
		return deviceMap
	}

	for _, dev := range envelope.Data {
		if dev.SystemIP != "" {
			deviceMap[dev.SystemIP] = dev
		}
	}

	return deviceMap
}

// buildRelationship creates a Relationship from grouped BFD sessions
func buildRelationship(peerIP string, sessions []rawBFDSession, deviceMap map[string]deviceRecord) Relationship {
	// Get peer device info
	peerHostname := peerIP
	peerType := "edge"
	var siteID interface{} = "N/A"

	if dev, ok := deviceMap[peerIP]; ok {
		if dev.HostName != "" {
			peerHostname = dev.HostName
		}
		peerType = classifyDeviceType(dev)
		siteID = dev.SiteID
	}

	// Build transport sessions
	transports := make([]TransportSession, 0, len(sessions))
	activeCount := 0

	for _, s := range sessions {
		transport := TransportSession{
			Color:       s.Color,
			State:       s.State,
			SrcIP:       s.SrcIP,
			DstIP:       s.DstIP,
			Proto:       s.Proto,
			Uptime:      s.Uptime,
			UptimeDate:  s.UptimeDate,
			TxInterval:  s.TxInterval,
			Transitions: s.Transitions,
			LastUpdated: s.LastUpdated,
		}
		transports = append(transports, transport)

		if strings.ToLower(s.State) == "up" {
			activeCount++
		}
	}

	// Determine health status
	healthStatus := "down"
	if activeCount == len(sessions) {
		healthStatus = "healthy"
	} else if activeCount > 0 {
		healthStatus = "degraded"
	}

	// Calculate importance score
	importance := calculateImportance(peerType, activeCount, len(sessions))

	return Relationship{
		PeerIP:       peerIP,
		PeerHostname: peerHostname,
		PeerType:     peerType,
		SiteID:       siteID,
		Importance:   importance,
		HealthStatus: healthStatus,
		Transports:   transports,
		ActiveCount:  activeCount,
		TotalCount:   len(sessions),
	}
}

// classifyDeviceType determines the device role
func classifyDeviceType(dev deviceRecord) string {
	dt := strings.ToLower(dev.DeviceType + " " + dev.Personality)

	if strings.Contains(dt, "vmanage") {
		return "vmanage"
	}
	if strings.Contains(dt, "vsmart") {
		return "vsmart"
	}
	if strings.Contains(dt, "vbond") {
		return "vbond"
	}

	// Check model for hub/DC indicators
	model := strings.ToLower(dev.Model)
	if strings.Contains(model, "hub") {
		return "hub"
	}
	if strings.Contains(model, "dc") || strings.Contains(model, "datacenter") {
		return "datacenter"
	}

	// Check for cEdge vs vEdge
	if strings.Contains(dt, "cedge") || strings.Contains(model, "c8") ||
		strings.Contains(model, "isr") || strings.Contains(model, "asr") {
		return "cedge"
	}
	if strings.Contains(dt, "vedge") {
		return "vedge"
	}

	return "edge"
}

// calculateImportance assigns a score for ranking relationships
// Higher scores = more important peers shown first
// Scoring factors:
//   - Device type: controllers > hubs/DCs > edges
//   - Multiple transports: bonus for redundancy
//   - Health: bonus for active transports, penalty for all-down
//   - Diversity: bonus for having different transport types
func calculateImportance(peerType string, activeCount, totalCount int) int {
	// Base score by device type (0-100)
	baseScore := 0
	switch peerType {
	case "vmanage":
		baseScore = 100
	case "vsmart":
		baseScore = 95
	case "vbond":
		baseScore = 90
	case "hub":
		baseScore = 85
	case "datacenter":
		baseScore = 80
	case "cedge":
		baseScore = 55 // cEdge slightly higher than vEdge (typically newer/more capable)
	case "vedge":
		baseScore = 50
	case "edge":
		baseScore = 45
	default:
		baseScore = 30
	}

	// Bonus for multiple transports (redundancy is valuable)
	// 2 transports: +8, 3 transports: +16, 4+: +20 (capped)
	transportBonus := 0
	if totalCount >= 2 {
		transportBonus = (totalCount - 1) * 8
		if transportBonus > 20 {
			transportBonus = 20
		}
	}

	// Health bonus/penalty
	// All up: +15, partial: proportional, all down: -10
	healthBonus := 0
	if totalCount > 0 {
		if activeCount == totalCount {
			healthBonus = 15 // All transports healthy
		} else if activeCount == 0 {
			healthBonus = -10 // All transports down (deprioritize)
		} else {
			// Partial health: proportional bonus (0-10)
			healthRatio := float64(activeCount) / float64(totalCount)
			healthBonus = int(healthRatio * 10)
		}
	}

	return baseScore + transportBonus + healthBonus
}
