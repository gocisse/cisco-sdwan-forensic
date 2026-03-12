// broadcast.go
// SSE broadcast functions for BFD, Usage, and Stats data

package sse

import (
	"encoding/json"
	"log"
	"strconv"
	"sync"
	"time"

	"sdwan-app/utils"
)

// ======================
//  Struct Definitions
// ======================

// BfdState represents the BFD state data.
// Uses json.Number for numeric fields because vManage returns them as
// either JSON strings or JSON numbers depending on the device/version.
type BfdState struct {
	SrcIP             string      `json:"src-ip"`
	DstIP             string      `json:"dst-ip"`
	VdeviceName       string      `json:"vdevice-name"`
	Color             string      `json:"color"`
	SrcPort           json.Number `json:"src-port"`
	SystemIP          string      `json:"system-ip"`
	DstPort           json.Number `json:"dst-port"`
	SiteID            json.Number `json:"site-id"`
	VdeviceHostName   string      `json:"vdevice-host-name"`
	LocalColor        string      `json:"local-color"`
	LocalIfDesc       string      `json:"local-if-desc"`
	VmanageSystemIP   string      `json:"vmanage-system-ip"`
	LocalRemoteIfname string      `json:"local-remote-ifname"`
	Proto             string      `json:"proto"`
	Lastupdated       json.Number `json:"lastupdated"`
	RemoteIfDesc      string      `json:"remote-if-desc"`
	State             string      `json:"state"`
	TxInterval        json.Number `json:"tx-interval"`
	UptimeDate        json.Number `json:"uptime-date"`
}

// PortsInUse represents the interface ports in use data.
// Uses json.Number for numeric fields because vManage returns them as
// either JSON strings or JSON numbers depending on the device/version.
type PortsInUse struct {
	VdeviceName     string      `json:"vdevice-name"`
	RxErrors        json.Number `json:"rx-errors"`
	TxKbps          json.Number `json:"tx-kbps"`
	IfAdminStatus   string      `json:"if-admin-status"`
	TCPMssAdjust    string      `json:"tcp-mss-adjust"`
	TxErrors        json.Number `json:"tx-errors"`
	TxPps           json.Number `json:"tx-pps"`
	Ifname          string      `json:"ifname"`
	RxPps           json.Number `json:"rx-pps"`
	AfType          string      `json:"af-type"`
	ShapingRate     json.Number `json:"shaping-rate"`
	IfOperStatus    string      `json:"if-oper-status"`
	Ifindex         json.Number `json:"ifindex"`
	IfTrackerStatus string      `json:"if-tracker-status"`
	NumFlaps        json.Number `json:"num-flaps"`
	RxPackets       json.Number `json:"rx-packets"`
	VpnID           string      `json:"vpn-id"`
	VdeviceHostName string      `json:"vdevice-host-name"`
	Mtu             json.Number `json:"mtu"`
	RxDrops         json.Number `json:"rx-drops"`
	TxDrops         json.Number `json:"tx-drops"`
	Ipv6Address     string      `json:"ipv6-address"`
	Hwaddr          string      `json:"hwaddr"`
	IPAddress       string      `json:"ip-address"`
	VdeviceDataKey  string      `json:"vdevice-dataKey"`
	TxOctets        json.Number `json:"tx-octets"`
	TxPackets       json.Number `json:"tx-packets"`
	RxOctets        json.Number `json:"rx-octets"`
	RxKbps          json.Number `json:"rx-kbps"`
	Lastupdated     json.Number `json:"lastupdated"`
	PortType        string      `json:"port-type"`
	EncapType       string      `json:"encap-type"`
}

// PortStats represents the interface port statistics data.
// Uses json.Number for numeric fields because vManage returns them as
// either JSON strings or JSON numbers depending on the device/version.
type PortStats struct {
	VdeviceName     string      `json:"vdevice-name"`
	RxPackets       json.Number `json:"rx-packets"`
	RxErrors        json.Number `json:"rx-errors"`
	TxKbps          json.Number `json:"tx-kbps"`
	TxErrors        json.Number `json:"tx-errors"`
	TxPps           json.Number `json:"tx-pps"`
	VpnID           string      `json:"vpn-id"`
	Dot1XRxPkts     json.Number `json:"dot1x-rx-pkts"`
	VdeviceHostName string      `json:"vdevice-host-name"`
	TxDrops         json.Number `json:"tx-drops"`
	Ipv6Address     string      `json:"ipv6-address"`
	Dot1XTxPkts     json.Number `json:"dot1x-tx-pks"`
	IPAddress       string      `json:"ip-address"`
	VdeviceDataKey  string      `json:"vdevice-dataKey"`
	Ifname          string      `json:"ifname"`
	RxPps           json.Number `json:"rx-pps"`
	TxOctets        json.Number `json:"tx-octets"`
	TxPackets       json.Number `json:"tx-packets"`
	AfType          string      `json:"af-type"`
	RxOctets        json.Number `json:"rx-octets"`
	RxKbps          json.Number `json:"rx-kbps"`
	Lastupdated     json.Number `json:"lastupdated"`
}

// ======================
//  Global Brokers
// ======================

var (
	BfdBroker      *Broker
	UsageBroker    *Broker
	StatsBroker    *Broker
	AppRouteBroker *Broker
)

// InitBrokers initializes all SSE brokers
func InitBrokers() {
	BfdBroker = NewBroker()
	UsageBroker = NewBroker()
	StatsBroker = NewBroker()
	AppRouteBroker = NewBroker()

	go BfdBroker.Run()
	go UsageBroker.Run()
	go StatsBroker.Run()
	go AppRouteBroker.Run()

	log.Println("✅ SSE Brokers initialized")
}

// ======================
//  fetchData Helper
// ======================

// fetchData makes a GET request to vManage API and correctly handles both array and object responses.
func fetchData(apiClient *utils.APIClient, endpoint string, target interface{}) error {
	data, err := apiClient.Get(endpoint)
	if err != nil {
		log.Println("❌ API Request Failed:", endpoint, "Error:", err)
		return err
	}

	// Try unmarshaling into a map first to check structure
	var rawResponse map[string]interface{}
	if err := json.Unmarshal(data, &rawResponse); err != nil {
		log.Println("❌ JSON Unmarshal Error:", err)
		return err
	}

	// Check if "data" field is an array or object
	if rawData, ok := rawResponse["data"]; ok {
		switch v := rawData.(type) {
		case []interface{}:
			// It's an array
			remarshaled, _ := json.Marshal(v)
			if err := json.Unmarshal(remarshaled, target); err != nil {
				log.Println("❌ JSON Unmarshal Error (Array Expected):", err)
				return err
			}
		case map[string]interface{}:
			// It's a single object -> wrap in array
			remarshaled, _ := json.Marshal([]map[string]interface{}{v})
			if err := json.Unmarshal(remarshaled, target); err != nil {
				log.Println("❌ JSON Unmarshal Error (Object Converted to Array):", err)
				return err
			}
		default:
			log.Println("❌ Unexpected data format from API:", endpoint)
			return err
		}
	} else {
		log.Println("❌ 'data' field missing in API response:", endpoint)
		return err
	}

	return nil
}

// ======================
//  BFD Broadcast
// ======================

// BroadcastBFD periodically fetches BFD data for each connected client
func BroadcastBFD(apiClient *utils.APIClient) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		<-ticker.C
		systemIPs := BfdBroker.GetClientSystemIPs()
		if len(systemIPs) == 0 {
			continue
		}

		log.Printf("🔄 Fetching BFD Data for SSE clients...")

		var wg sync.WaitGroup
		for _, systemIP := range systemIPs {
			wg.Add(1)
			go func(ip string) {
				defer wg.Done()

				var bfdData []BfdState
				err := fetchData(apiClient, "dataservice/device/bfd/state/device?deviceId="+ip, &bfdData)
				if err != nil {
					log.Printf("❌ Error fetching BFD state for %s: %v", ip, err)
					return
				}

				dataBytes, err := json.Marshal(bfdData)
				if err != nil {
					log.Printf("❌ Error marshalling BFD data: %v", err)
					return
				}

				BfdBroker.Broadcast(ip, dataBytes)
			}(systemIP)
		}
		wg.Wait()
	}
}

// ======================
//  Usage Broadcast
// ======================

// BroadcastUsage periodically fetches interface usage data for each connected client
func BroadcastUsage(apiClient *utils.APIClient) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		<-ticker.C
		systemIPs := UsageBroker.GetClientSystemIPs()
		if len(systemIPs) == 0 {
			continue
		}

		log.Printf("🔄 Fetching Usage Data for SSE clients...")

		var wg sync.WaitGroup
		for _, systemIP := range systemIPs {
			wg.Add(1)
			go func(ip string) {
				defer wg.Done()

				var usageData []PortsInUse
				err := fetchData(apiClient, "dataservice/device/interface?deviceId="+ip, &usageData)
				if err != nil {
					log.Printf("❌ Error fetching Interface Usage for %s: %v", ip, err)
					return
				}

				dataBytes, err := json.Marshal(usageData)
				if err != nil {
					log.Printf("❌ Error marshalling Usage data: %v", err)
					return
				}

				UsageBroker.Broadcast(ip, dataBytes)
			}(systemIP)
		}
		wg.Wait()
	}
}

// ======================
//  Stats Broadcast
// ======================

// BroadcastAppRoute periodically fetches app-route statistics with SLA enrichment for each connected client
func BroadcastAppRoute(apiClient *utils.APIClient) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		<-ticker.C
		systemIPs := AppRouteBroker.GetClientSystemIPs()
		if len(systemIPs) == 0 {
			continue
		}

		log.Printf("🔄 Fetching App-Route Data for SSE clients...")

		var wg sync.WaitGroup
		for _, systemIP := range systemIPs {
			wg.Add(1)
			go func(ip string) {
				defer wg.Done()

				var appRouteData []map[string]interface{}
				err := fetchData(apiClient, "dataservice/device/app-route/statistics?deviceId="+ip, &appRouteData)
				if err != nil {
					log.Printf("❌ Error fetching App-Route for %s: %v", ip, err)
					return
				}

				// Enrich each flow with SLA status
				for i := range appRouteData {
					latency := toFloat64(appRouteData[i]["latency"])
					loss := toFloat64(appRouteData[i]["loss"])
					jitter := toFloat64(appRouteData[i]["jitter"])
					appRouteData[i]["slaStatus"] = classifySSESLA(latency, loss, jitter)
				}

				dataBytes, err := json.Marshal(appRouteData)
				if err != nil {
					log.Printf("❌ Error marshalling App-Route data: %v", err)
					return
				}

				AppRouteBroker.Broadcast(ip, dataBytes)
			}(systemIP)
		}
		wg.Wait()
	}
}

// classifySSESLA returns OK, WARNING, or CRITICAL for SSE broadcast enrichment.
func classifySSESLA(latency, loss, jitter float64) string {
	if loss >= 5.0 || latency >= 150.0 || jitter >= 50.0 {
		return "CRITICAL"
	}
	if loss >= 1.0 || latency >= 100.0 || jitter >= 30.0 {
		return "WARNING"
	}
	return "OK"
}

// toFloat64 converts an interface{} value (float64 or string) to float64.
func toFloat64(v interface{}) float64 {
	switch val := v.(type) {
	case float64:
		return val
	case string:
		f, _ := strconv.ParseFloat(val, 64)
		return f
	case json.Number:
		f, _ := val.Float64()
		return f
	default:
		return 0
	}
}

// BroadcastStats periodically fetches interface stats data for each connected client
func BroadcastStats(apiClient *utils.APIClient) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		<-ticker.C
		systemIPs := StatsBroker.GetClientSystemIPs()
		if len(systemIPs) == 0 {
			continue
		}

		log.Printf("🔄 Fetching Stats Data for SSE clients...")

		var wg sync.WaitGroup
		for _, systemIP := range systemIPs {
			wg.Add(1)
			go func(ip string) {
				defer wg.Done()

				var statsData []PortStats
				err := fetchData(apiClient, "dataservice/device/interface/stats?deviceId="+ip, &statsData)
				if err != nil {
					log.Printf("❌ Error fetching Interface Stats for %s: %v", ip, err)
					return
				}

				dataBytes, err := json.Marshal(statsData)
				if err != nil {
					log.Printf("❌ Error marshalling Stats data: %v", err)
					return
				}

				StatsBroker.Broadcast(ip, dataBytes)
			}(systemIP)
		}
		wg.Wait()
	}
}
