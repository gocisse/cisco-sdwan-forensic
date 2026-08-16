// logical.go - Unified topology aggregation layer
// Merges BFD sessions, control connections, and site topology into device-to-device relationships
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

// RelationshipType indicates the source/type of a relationship
type RelationshipType string

const (
	RelTypeDataPlane RelationshipType = "data-plane" // From BFD sessions
	RelTypeControl   RelationshipType = "control"    // From control connections
	RelTypeSite      RelationshipType = "site"       // From site topology
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

// ControlConnection represents a control plane connection detail
type ControlConnection struct {
	State      string `json:"state"`
	PeerType   string `json:"peerType"`
	Protocol   string `json:"protocol"`
	LocalColor string `json:"localColor"`
	Uptime     string `json:"uptime"`
}

// SiteLink represents a site topology link detail
type SiteLink struct {
	LinkType string `json:"linkType"`
	Status   string `json:"status"`
	LinkKey  string `json:"linkKey"`
}

// Relationship represents a logical connection between the selected device and a peer
type Relationship struct {
	PeerIP            string              `json:"peerIp"`
	PeerHostname      string              `json:"peerHostname"`
	PeerType          string              `json:"peerType"`
	SiteID            interface{}         `json:"siteId"`
	Importance        int                 `json:"importance"`
	HealthStatus      string              `json:"healthStatus"`
	HealthRatio       float64             `json:"healthRatio"`            // 0.0 to 1.0 ratio of active/total
	RelationshipTypes []RelationshipType  `json:"relationshipTypes"`      // Which sources this relationship comes from
	Transports        []TransportSession  `json:"transports"`             // BFD/data-plane details
	ControlConns      []ControlConnection `json:"controlConns,omitempty"` // Control plane details
	SiteLinks         []SiteLink          `json:"siteLinks,omitempty"`    // Site topology details
	ActiveCount       int                 `json:"activeCount"`
	TotalCount        int                 `json:"totalCount"`
	UniqueColors      []string            `json:"uniqueColors,omitempty"` // Unique transport colors (diversity)
}

// HealthSummary provides aggregate health statistics
type HealthSummary struct {
	Healthy  int `json:"healthy"`
	Degraded int `json:"degraded"`
	Down     int `json:"down"`
	Unknown  int `json:"unknown"`
}

// LogicalTopologyResponse is the aggregated topology for a selected device
type LogicalTopologyResponse struct {
	SelectedDevice   string         `json:"selectedDevice"`
	SelectedHostname string         `json:"selectedHostname"`
	Relationships    []Relationship `json:"relationships"`
	TotalPeers       int            `json:"totalPeers"`
	HiddenCount      int            `json:"hiddenCount"`
	HealthSummary    HealthSummary  `json:"healthSummary"`
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

// rawControlConnection represents control connection data from vManage
type rawControlConnection struct {
	SystemIP   string      `json:"system-ip"`
	State      string      `json:"state"`
	PeerType   string      `json:"peer-type"`
	Protocol   string      `json:"protocol"`
	LocalColor string      `json:"local-color"`
	Uptime     string      `json:"uptime"`
	SiteID     interface{} `json:"site-id"`
}

// rawSiteLink represents a site topology link from vManage
type rawSiteLink struct {
	LinkKey        string `json:"linkKey"`
	Source         string `json:"source"`
	Target         string `json:"target"`
	LinkType       string `json:"linkType"`
	Status         string `json:"status"`
	LinkKeyDisplay string `json:"linkKeyDisplay"`
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

// FetchLogicalTopology aggregates BFD, control, and site topology into unified relationships
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

		// Unified peer map: peerIP -> Relationship
		unifiedPeers := make(map[string]*Relationship)

		// 1. Fetch and process BFD sessions (data-plane)
		fetchBFDRelationships(apiClient, systemIP, deviceMap, unifiedPeers)

		// 2. Fetch and process control connections
		fetchControlRelationships(apiClient, systemIP, deviceMap, unifiedPeers)

		// 3. Fetch and process site topology
		fetchSiteRelationships(apiClient, systemIP, deviceMap, unifiedPeers)

		// Convert map to slice and calculate final metrics
		relationships := make([]Relationship, 0, len(unifiedPeers))
		healthSummary := HealthSummary{}

		for _, rel := range unifiedPeers {
			// Calculate health ratio
			if rel.TotalCount > 0 {
				rel.HealthRatio = float64(rel.ActiveCount) / float64(rel.TotalCount)
			}

			// Extract unique transport colors for diversity tracking
			rel.UniqueColors = extractUniqueColors(rel.Transports)

			// Recalculate importance with all factors
			rel.Importance = calculateUnifiedImportance(rel)

			// Update health summary
			switch rel.HealthStatus {
			case "healthy":
				healthSummary.Healthy++
			case "degraded":
				healthSummary.Degraded++
			case "down":
				healthSummary.Down++
			default:
				healthSummary.Unknown++
			}

			relationships = append(relationships, *rel)
		}

		// Sort by importance (descending)
		sort.Slice(relationships, func(i, j int) bool {
			return relationships[i].Importance > relationships[j].Importance
		})

		totalPeers := len(relationships)

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
			TotalPeers:       totalPeers,
			HiddenCount:      hiddenCount,
			HealthSummary:    healthSummary,
		}

		log.Printf("🔗 Unified topology for %s: %d peers (%d visible, %d hidden)",
			systemIP, totalPeers, len(relationships), hiddenCount)

		payload, _ := json.Marshal(response)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}
}

// fetchBFDRelationships fetches BFD sessions and adds them to the unified peer map
func fetchBFDRelationships(apiClient *utils.APIClient, systemIP string, deviceMap map[string]deviceRecord, unifiedPeers map[string]*Relationship) {
	endpoint := "dataservice/device/bfd/sessions?deviceId=" + systemIP
	rawData, err := apiClient.Get(endpoint)
	if err != nil {
		log.Printf("BFD fetch error for %s: %v", systemIP, err)
		return
	}

	var envelope struct {
		Data []rawBFDSession `json:"data"`
	}
	if err := json.Unmarshal(rawData, &envelope); err != nil {
		log.Printf("BFD parse error: %v", err)
		return
	}

	// Group BFD sessions by peer
	peerSessions := make(map[string][]rawBFDSession)
	for _, session := range envelope.Data {
		peerIP := session.SystemIP
		if peerIP == "" || peerIP == systemIP {
			continue
		}
		peerSessions[peerIP] = append(peerSessions[peerIP], session)
	}

	// Add to unified map
	for peerIP, sessions := range peerSessions {
		rel := getOrCreateRelationship(unifiedPeers, peerIP, deviceMap)
		rel.RelationshipTypes = appendUniqueType(rel.RelationshipTypes, RelTypeDataPlane)

		// Build transport sessions
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
			rel.Transports = append(rel.Transports, transport)
			rel.TotalCount++
			if strings.ToLower(s.State) == "up" {
				rel.ActiveCount++
			}
		}

		// Update health status
		rel.HealthStatus = calculateHealthStatus(rel.ActiveCount, rel.TotalCount)
	}

	log.Printf("🔗 BFD: found %d peers for %s", len(peerSessions), systemIP)
}

// fetchControlRelationships fetches control connections and adds them to the unified peer map
func fetchControlRelationships(apiClient *utils.APIClient, systemIP string, deviceMap map[string]deviceRecord, unifiedPeers map[string]*Relationship) {
	endpoint := "dataservice/device/control/connections?deviceId=" + systemIP
	rawData, err := apiClient.Get(endpoint)
	if err != nil {
		log.Printf("Control connections fetch error for %s: %v", systemIP, err)
		return
	}

	var envelope struct {
		Data []rawControlConnection `json:"data"`
	}
	if err := json.Unmarshal(rawData, &envelope); err != nil {
		log.Printf("Control connections parse error: %v", err)
		return
	}

	controlPeers := 0
	for _, conn := range envelope.Data {
		peerIP := conn.SystemIP
		if peerIP == "" || peerIP == systemIP {
			continue
		}

		rel := getOrCreateRelationship(unifiedPeers, peerIP, deviceMap)
		rel.RelationshipTypes = appendUniqueType(rel.RelationshipTypes, RelTypeControl)

		// Add control connection detail
		ctrlConn := ControlConnection{
			State:      conn.State,
			PeerType:   conn.PeerType,
			Protocol:   conn.Protocol,
			LocalColor: conn.LocalColor,
			Uptime:     conn.Uptime,
		}
		rel.ControlConns = append(rel.ControlConns, ctrlConn)
		controlPeers++
	}

	log.Printf("🔗 Control: found %d connections for %s", controlPeers, systemIP)
}

// fetchSiteRelationships fetches site topology and adds links to the unified peer map
func fetchSiteRelationships(apiClient *utils.APIClient, systemIP string, deviceMap map[string]deviceRecord, unifiedPeers map[string]*Relationship) {
	endpoint := "dataservice/topology/device?deviceId=" + systemIP
	rawData, err := apiClient.Get(endpoint)
	if err != nil {
		log.Printf("Site topology fetch error for %s: %v", systemIP, err)
		return
	}

	var topology struct {
		Links []rawSiteLink `json:"links"`
	}
	if err := json.Unmarshal(rawData, &topology); err != nil {
		log.Printf("Site topology parse error: %v", err)
		return
	}

	siteLinks := 0
	for _, link := range topology.Links {
		// Determine peer IP (the one that's not our systemIP)
		var peerIP string
		if link.Source == systemIP {
			peerIP = link.Target
		} else if link.Target == systemIP {
			peerIP = link.Source
		} else {
			continue // Link doesn't involve our device
		}

		if peerIP == "" {
			continue
		}

		rel := getOrCreateRelationship(unifiedPeers, peerIP, deviceMap)
		rel.RelationshipTypes = appendUniqueType(rel.RelationshipTypes, RelTypeSite)

		// Add site link detail
		siteLink := SiteLink{
			LinkType: link.LinkType,
			Status:   link.Status,
			LinkKey:  link.LinkKeyDisplay,
		}
		rel.SiteLinks = append(rel.SiteLinks, siteLink)
		siteLinks++
	}

	log.Printf("🔗 Site: found %d links for %s", siteLinks, systemIP)
}

// getOrCreateRelationship gets existing or creates new relationship in the unified map
func getOrCreateRelationship(unifiedPeers map[string]*Relationship, peerIP string, deviceMap map[string]deviceRecord) *Relationship {
	if rel, exists := unifiedPeers[peerIP]; exists {
		return rel
	}

	// Create new relationship
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

	rel := &Relationship{
		PeerIP:            peerIP,
		PeerHostname:      peerHostname,
		PeerType:          peerType,
		SiteID:            siteID,
		RelationshipTypes: []RelationshipType{},
		Transports:        []TransportSession{},
		ControlConns:      []ControlConnection{},
		SiteLinks:         []SiteLink{},
		HealthStatus:      "unknown",
	}
	unifiedPeers[peerIP] = rel
	return rel
}

// appendUniqueType adds a relationship type if not already present
func appendUniqueType(types []RelationshipType, newType RelationshipType) []RelationshipType {
	for _, t := range types {
		if t == newType {
			return types
		}
	}
	return append(types, newType)
}

// calculateHealthStatus determines health based on active/total counts
func calculateHealthStatus(activeCount, totalCount int) string {
	if totalCount == 0 {
		return "unknown"
	}
	if activeCount == totalCount {
		return "healthy"
	}
	if activeCount == 0 {
		return "down"
	}
	return "degraded"
}

// extractUniqueColors extracts unique transport colors from sessions
func extractUniqueColors(transports []TransportSession) []string {
	colorSet := make(map[string]bool)
	for _, t := range transports {
		if t.Color != "" {
			colorSet[strings.ToLower(t.Color)] = true
		}
	}
	colors := make([]string, 0, len(colorSet))
	for c := range colorSet {
		colors = append(colors, c)
	}
	return colors
}

// calculateUnifiedImportance calculates importance considering all relationship types
// Scoring factors:
//   - Device type: controllers > hubs/DCs > edges (0-100)
//   - Relationship types: bonus for multiple types (+10 each)
//   - Control plane: bonus for controller connections (+15)
//   - Transport count: bonus for redundancy (+8 per extra, max +20)
//   - Transport diversity: bonus for multiple colors/WAN links (+5 per extra, max +15)
//   - Health: bonus for healthy, penalty for down
func calculateUnifiedImportance(rel *Relationship) int {
	// Base score by device type (0-100)
	baseScore := getDeviceTypeScore(rel.PeerType)

	// Bonus for multiple relationship types (more connected = more important)
	typeBonus := (len(rel.RelationshipTypes) - 1) * 10

	// Bonus for control plane connections (indicates controller relationship)
	controlBonus := 0
	if hasRelType(rel.RelationshipTypes, RelTypeControl) {
		controlBonus = 15
	}

	// Transport count bonus (redundancy)
	transportBonus := 0
	if rel.TotalCount >= 2 {
		transportBonus = (rel.TotalCount - 1) * 8
		if transportBonus > 20 {
			transportBonus = 20
		}
	}

	// Transport diversity bonus (multiple WAN links = more resilient)
	diversityBonus := 0
	if len(rel.UniqueColors) >= 2 {
		diversityBonus = (len(rel.UniqueColors) - 1) * 5
		if diversityBonus > 15 {
			diversityBonus = 15
		}
	}

	// Health bonus/penalty
	healthBonus := 0
	if rel.TotalCount > 0 {
		if rel.ActiveCount == rel.TotalCount {
			healthBonus = 15 // All healthy
		} else if rel.ActiveCount == 0 {
			healthBonus = -10 // All down
		} else {
			// Proportional bonus for partial health
			healthBonus = int(rel.HealthRatio * 10)
		}
	}

	return baseScore + typeBonus + controlBonus + transportBonus + diversityBonus + healthBonus
}

// getDeviceTypeScore returns base importance score for device type
func getDeviceTypeScore(peerType string) int {
	switch peerType {
	case "vmanage":
		return 100
	case "vsmart":
		return 95
	case "vbond":
		return 90
	case "hub":
		return 85
	case "datacenter":
		return 80
	case "cedge":
		return 55
	case "vedge":
		return 50
	case "edge":
		return 45
	default:
		return 30
	}
}

// hasRelType checks if a relationship type is present
func hasRelType(types []RelationshipType, target RelationshipType) bool {
	for _, t := range types {
		if t == target {
			return true
		}
	}
	return false
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
