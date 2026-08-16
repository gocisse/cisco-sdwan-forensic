// omp.go - OMP routing topology aggregation
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

// OmpRoute represents a single OMP route entry
type OmpRoute struct {
	Prefix     string `json:"prefix"`
	VpnID      string `json:"vpnId"`
	Originator string `json:"originator"`
	FromPeer   string `json:"fromPeer"`
	SiteID     string `json:"siteId"`
	Color      string `json:"color"`
	Protocol   string `json:"protocol"`
	Metric     string `json:"metric"`
	Status     string `json:"status"`
	Label      string `json:"label"`
}

// OmpPeer represents an OMP peer with aggregated route info
type OmpPeer struct {
	PeerIP       string     `json:"peerIp"`
	PeerHostname string     `json:"peerHostname"`
	PeerType     string     `json:"peerType"`
	SiteID       string     `json:"siteId"`
	RouteCount   int        `json:"routeCount"`
	VpnIDs       []string   `json:"vpnIds"`
	Prefixes     []string   `json:"prefixes"`
	Routes       []OmpRoute `json:"routes"`
}

// OmpTopologyResponse is the OMP routing topology for a device
type OmpTopologyResponse struct {
	SelectedDevice   string    `json:"selectedDevice"`
	SelectedHostname string    `json:"selectedHostname"`
	Peers            []OmpPeer `json:"peers"`
	TotalRoutes      int       `json:"totalRoutes"`
	TotalPeers       int       `json:"totalPeers"`
	UniqueVpns       []string  `json:"uniqueVpns"`
	UniquePrefixes   int       `json:"uniquePrefixes"`
}

// rawOmpRoute represents raw OMP route data from vManage
type rawOmpRoute struct {
	Prefix     string `json:"prefix"`
	VpnID      string `json:"vpn-id"`
	Originator string `json:"originator"`
	FromPeer   string `json:"from-peer"`
	SiteID     string `json:"site-id"`
	Color      string `json:"color"`
	Protocol   string `json:"protocol"`
	Metric     string `json:"metric"`
	Status     string `json:"status"`
	Label      string `json:"label"`
	IP         string `json:"ip"`
}

// FetchOmpTopology aggregates OMP routes into peer-based topology
// GET /api/topology/omp/{system-ip}
func FetchOmpTopology(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		// Get device map for hostname lookups
		deviceMap := buildDeviceMap(apiClient)

		// Get selected device info
		selectedHostname := systemIP
		if dev, ok := deviceMap[systemIP]; ok {
			selectedHostname = dev.HostName
		}

		// Fetch received OMP routes
		endpoint := "dataservice/device/omp/routes/received?deviceId=" + systemIP
		rawData, err := apiClient.Get(endpoint)
		if err != nil {
			log.Printf("OMP routes fetch error for %s: %v", systemIP, err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch OMP routes")
			return
		}

		var envelope struct {
			Data []rawOmpRoute `json:"data"`
		}
		if err := json.Unmarshal(rawData, &envelope); err != nil {
			log.Printf("OMP routes parse error: %v", err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse OMP response")
			return
		}

		// Aggregate routes by originator (peer)
		peerMap := make(map[string]*OmpPeer)
		vpnSet := make(map[string]bool)
		prefixSet := make(map[string]bool)

		for _, route := range envelope.Data {
			peerIP := route.Originator
			if peerIP == "" || peerIP == systemIP {
				continue
			}

			// Track unique VPNs and prefixes
			if route.VpnID != "" {
				vpnSet[route.VpnID] = true
			}
			if route.Prefix != "" {
				prefixSet[route.Prefix] = true
			}

			// Get or create peer entry
			peer, exists := peerMap[peerIP]
			if !exists {
				peerHostname := peerIP
				peerType := "edge"
				siteID := route.SiteID

				if dev, ok := deviceMap[peerIP]; ok {
					if dev.HostName != "" {
						peerHostname = dev.HostName
					}
					peerType = classifyDeviceType(dev)
					if siteID == "" {
						if sid, ok := dev.SiteID.(string); ok {
							siteID = sid
						}
					}
				}

				peer = &OmpPeer{
					PeerIP:       peerIP,
					PeerHostname: peerHostname,
					PeerType:     peerType,
					SiteID:       siteID,
					VpnIDs:       []string{},
					Prefixes:     []string{},
					Routes:       []OmpRoute{},
				}
				peerMap[peerIP] = peer
			}

			// Add route to peer
			ompRoute := OmpRoute{
				Prefix:     route.Prefix,
				VpnID:      route.VpnID,
				Originator: route.Originator,
				FromPeer:   route.FromPeer,
				SiteID:     route.SiteID,
				Color:      route.Color,
				Protocol:   route.Protocol,
				Metric:     route.Metric,
				Status:     route.Status,
				Label:      route.Label,
			}
			peer.Routes = append(peer.Routes, ompRoute)
			peer.RouteCount++

			// Track unique VPNs and prefixes per peer
			if route.VpnID != "" && !containsString(peer.VpnIDs, route.VpnID) {
				peer.VpnIDs = append(peer.VpnIDs, route.VpnID)
			}
			if route.Prefix != "" && !containsString(peer.Prefixes, route.Prefix) {
				peer.Prefixes = append(peer.Prefixes, route.Prefix)
			}
		}

		// Convert map to slice and sort by route count
		peers := make([]OmpPeer, 0, len(peerMap))
		for _, peer := range peerMap {
			peers = append(peers, *peer)
		}
		sort.Slice(peers, func(i, j int) bool {
			return peers[i].RouteCount > peers[j].RouteCount
		})

		// Build unique VPNs list
		uniqueVpns := make([]string, 0, len(vpnSet))
		for vpn := range vpnSet {
			uniqueVpns = append(uniqueVpns, vpn)
		}
		sort.Strings(uniqueVpns)

		response := OmpTopologyResponse{
			SelectedDevice:   systemIP,
			SelectedHostname: selectedHostname,
			Peers:            peers,
			TotalRoutes:      len(envelope.Data),
			TotalPeers:       len(peers),
			UniqueVpns:       uniqueVpns,
			UniquePrefixes:   len(prefixSet),
		}

		log.Printf("🛣️ OMP topology for %s: %d routes from %d peers, %d VPNs",
			systemIP, len(envelope.Data), len(peers), len(uniqueVpns))

		payload, _ := json.Marshal(response)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}
}

// containsString checks if a string slice contains a value
func containsString(slice []string, val string) bool {
	for _, s := range slice {
		if strings.EqualFold(s, val) {
			return true
		}
	}
	return false
}
