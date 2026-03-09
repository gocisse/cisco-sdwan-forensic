package device

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// ──────────────────────────────────────────────────────────────────────────────
// SLA Thresholds
// ──────────────────────────────────────────────────────────────────────────────

const (
	latencyWarningMs  = 100.0
	latencyCriticalMs = 150.0
	lossWarningPct    = 1.0
	lossCriticalPct   = 5.0
	jitterWarningMs   = 30.0
	jitterCriticalMs  = 50.0
)

// ──────────────────────────────────────────────────────────────────────────────
// App-Route Structs
// ──────────────────────────────────────────────────────────────────────────────

// AppRouteEntry is a single enriched app-route flow.
type AppRouteEntry struct {
	SrcIP       string  `json:"srcIp"`
	DstIP       string  `json:"dstIp"`
	LocalColor  string  `json:"localColor"`
	RemoteColor string  `json:"remoteColor"`
	Proto       string  `json:"proto"`
	AppName     string  `json:"application"`
	Latency     float64 `json:"latency"`
	Loss        float64 `json:"loss"`
	Jitter      float64 `json:"jitter"`
	TxOctets    int64   `json:"txOctets"`
	RxOctets    int64   `json:"rxOctets"`
	TxPackets   int64   `json:"txPackets"`
	RxPackets   int64   `json:"rxPackets"`
	SLAStatus   string  `json:"slaStatus"` // OK, WARNING, CRITICAL
	VdeviceName string  `json:"vdeviceName"`
	SiteID      string  `json:"siteId"`
}

// AppRouteResponse is the response for GET /api/device/{system-ip}/app-route.
type AppRouteResponse struct {
	SystemIP     string          `json:"systemIp"`
	HostName     string          `json:"hostName"`
	Flows        []AppRouteEntry `json:"flows"`
	TotalFlows   int             `json:"totalFlows"`
	CriticalCnt  int             `json:"criticalCount"`
	WarningCnt   int             `json:"warningCount"`
	OkCnt        int             `json:"okCount"`
}

// ──────────────────────────────────────────────────────────────────────────────
// Tunnel Health Structs
// ──────────────────────────────────────────────────────────────────────────────

// TunnelHealthEntry is a single tunnel with computed health metrics.
type TunnelHealthEntry struct {
	SrcIP          string  `json:"srcIp"`
	DstIP          string  `json:"dstIp"`
	LocalColor     string  `json:"localColor"`
	RemoteColor    string  `json:"remoteColor"`
	State          string  `json:"state"`
	TxPackets      int64   `json:"txPackets"`
	RxPackets      int64   `json:"rxPackets"`
	TxOctets       int64   `json:"txOctets"`
	RxOctets       int64   `json:"rxOctets"`
	LossPercentage float64 `json:"lossPercentage"`
	SLAStatus      string  `json:"slaStatus"`
	VdeviceName    string  `json:"vdeviceName"`
}

// TunnelHealthResponse is the response for GET /api/device/{system-ip}/tunnel-health.
type TunnelHealthResponse struct {
	SystemIP     string              `json:"systemIp"`
	HostName     string              `json:"hostName"`
	Tunnels      []TunnelHealthEntry `json:"tunnels"`
	TotalTunnels int                 `json:"totalTunnels"`
	CriticalCnt  int                 `json:"criticalCount"`
	WarningCnt   int                 `json:"warningCount"`
	OkCnt        int                 `json:"okCount"`
}

// ──────────────────────────────────────────────────────────────────────────────
// Handler: App-Route Statistics with SLA Enrichment
// ──────────────────────────────────────────────────────────────────────────────

// FetchAppRoute returns enriched app-route statistics with SLA status.
// GET /api/device/{system-ip}/app-route
func FetchAppRoute(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		dev, err := findDevice(apiClient, systemIP)
		if err != nil {
			log.Printf("Device lookup error: %v", err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to look up device")
			return
		}
		if dev == nil {
			middleware.WriteError(w, http.StatusNotFound, "NOT_FOUND",
				fmt.Sprintf("No device found with system-ip %s", systemIP))
			return
		}

		rawData, err := apiClient.Get(fmt.Sprintf("dataservice/device/app-route/statistics?deviceId=%s", systemIP))
		if err != nil {
			log.Printf("App-route fetch error for %s: %v", systemIP, err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch app-route stats from vManage")
			return
		}

		var envelope struct {
			Data []json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(rawData, &envelope); err != nil {
			log.Printf("App-route parse error: %v", err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse app-route response")
			return
		}

		flows := make([]AppRouteEntry, 0, len(envelope.Data))
		criticalCnt, warningCnt, okCnt := 0, 0, 0

		for _, raw := range envelope.Data {
			var item struct {
				SrcIP       string      `json:"src-ip"`
				DstIP       string      `json:"dst-ip"`
				LocalColor  string      `json:"local-color"`
				RemoteColor string      `json:"remote-color"`
				Proto       string      `json:"proto"`
				AppName     string      `json:"app-probe-class-name"`
				Latency     json.Number `json:"latency"`
				Loss        json.Number `json:"loss"`
				Jitter      json.Number `json:"jitter"`
				TxOctets    json.Number `json:"tx-octets"`
				RxOctets    json.Number `json:"rx-octets"`
				TxPackets   json.Number `json:"tx-pkts"`
				RxPackets   json.Number `json:"rx-pkts"`
				VdeviceName string      `json:"vdevice-name"`
				SiteID      string      `json:"site-id"`
			}
			if err := json.Unmarshal(raw, &item); err != nil {
				continue
			}

			latency := parseFloat(item.Latency)
			loss := parseFloat(item.Loss)
			jitter := parseFloat(item.Jitter)

			status := classifySLA(latency, loss, jitter)

			entry := AppRouteEntry{
				SrcIP:       item.SrcIP,
				DstIP:       item.DstIP,
				LocalColor:  item.LocalColor,
				RemoteColor: item.RemoteColor,
				Proto:       item.Proto,
				AppName:     item.AppName,
				Latency:     roundTo2(latency),
				Loss:        roundTo2(loss),
				Jitter:      roundTo2(jitter),
				TxOctets:    parseInt64(item.TxOctets),
				RxOctets:    parseInt64(item.RxOctets),
				TxPackets:   parseInt64(item.TxPackets),
				RxPackets:   parseInt64(item.RxPackets),
				SLAStatus:   status,
				VdeviceName: item.VdeviceName,
				SiteID:      item.SiteID,
			}
			flows = append(flows, entry)

			switch status {
			case "CRITICAL":
				criticalCnt++
			case "WARNING":
				warningCnt++
			default:
				okCnt++
			}
		}

		resp := AppRouteResponse{
			SystemIP:    dev.SystemIP,
			HostName:    dev.HostName,
			Flows:       flows,
			TotalFlows:  len(flows),
			CriticalCnt: criticalCnt,
			WarningCnt:  warningCnt,
			OkCnt:       okCnt,
		}

		middleware.RespondJSON(w, http.StatusOK, resp)
	}
}

// ──────────────────────────────────────────────────────────────────────────────
// Handler: Tunnel Health
// ──────────────────────────────────────────────────────────────────────────────

// FetchTunnelHealth returns tunnel statistics with computed loss percentage.
// GET /api/device/{system-ip}/tunnel-health
func FetchTunnelHealth(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		dev, err := findDevice(apiClient, systemIP)
		if err != nil {
			log.Printf("Device lookup error: %v", err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to look up device")
			return
		}
		if dev == nil {
			middleware.WriteError(w, http.StatusNotFound, "NOT_FOUND",
				fmt.Sprintf("No device found with system-ip %s", systemIP))
			return
		}

		rawData, err := apiClient.Get(fmt.Sprintf("dataservice/device/tunnel/statistics?deviceId=%s", systemIP))
		if err != nil {
			log.Printf("Tunnel stats fetch error for %s: %v", systemIP, err)
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch tunnel stats from vManage")
			return
		}

		var envelope struct {
			Data []json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(rawData, &envelope); err != nil {
			log.Printf("Tunnel stats parse error: %v", err)
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse tunnel stats response")
			return
		}

		tunnels := make([]TunnelHealthEntry, 0, len(envelope.Data))
		criticalCnt, warningCnt, okCnt := 0, 0, 0

		for _, raw := range envelope.Data {
			var item struct {
				SrcIP       string      `json:"src-ip"`
				DstIP       string      `json:"dst-ip"`
				LocalColor  string      `json:"local-color"`
				RemoteColor string      `json:"remote-color"`
				State       string      `json:"state"`
				TxPkts      json.Number `json:"tx-pkts"`
				RxPkts      json.Number `json:"rx-pkts"`
				TxOctets    json.Number `json:"tx-octets"`
				RxOctets    json.Number `json:"rx-octets"`
				VdeviceName string      `json:"vdevice-name"`
			}
			if err := json.Unmarshal(raw, &item); err != nil {
				continue
			}

			txPkts := parseInt64(item.TxPkts)
			rxPkts := parseInt64(item.RxPkts)

			// Calculate loss percentage: if tx > 0, loss = (tx - rx) / tx * 100
			var lossPct float64
			if txPkts > 0 {
				lossPct = float64(txPkts-rxPkts) / float64(txPkts) * 100.0
				if lossPct < 0 {
					lossPct = 0 // rx > tx can happen in bidirectional tunnels
				}
			}

			status := "OK"
			if lossPct >= lossCriticalPct {
				status = "CRITICAL"
			} else if lossPct >= lossWarningPct {
				status = "WARNING"
			}

			entry := TunnelHealthEntry{
				SrcIP:          item.SrcIP,
				DstIP:          item.DstIP,
				LocalColor:     item.LocalColor,
				RemoteColor:    item.RemoteColor,
				State:          item.State,
				TxPackets:      txPkts,
				RxPackets:      rxPkts,
				TxOctets:       parseInt64(item.TxOctets),
				RxOctets:       parseInt64(item.RxOctets),
				LossPercentage: roundTo2(lossPct),
				SLAStatus:      status,
				VdeviceName:    item.VdeviceName,
			}
			tunnels = append(tunnels, entry)

			switch status {
			case "CRITICAL":
				criticalCnt++
			case "WARNING":
				warningCnt++
			default:
				okCnt++
			}
		}

		resp := TunnelHealthResponse{
			SystemIP:     dev.SystemIP,
			HostName:     dev.HostName,
			Tunnels:      tunnels,
			TotalTunnels: len(tunnels),
			CriticalCnt:  criticalCnt,
			WarningCnt:   warningCnt,
			OkCnt:        okCnt,
		}

		middleware.RespondJSON(w, http.StatusOK, resp)
	}
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

// classifySLA returns OK, WARNING, or CRITICAL based on SLA thresholds.
func classifySLA(latency, loss, jitter float64) string {
	if loss >= lossCriticalPct || latency >= latencyCriticalMs || jitter >= jitterCriticalMs {
		return "CRITICAL"
	}
	if loss >= lossWarningPct || latency >= latencyWarningMs || jitter >= jitterWarningMs {
		return "WARNING"
	}
	return "OK"
}

func parseFloat(n json.Number) float64 {
	f, err := n.Float64()
	if err != nil {
		s := n.String()
		f, _ = strconv.ParseFloat(s, 64)
	}
	return f
}

func parseInt64(n json.Number) int64 {
	i, err := n.Int64()
	if err != nil {
		s := n.String()
		f, _ := strconv.ParseFloat(s, 64)
		i = int64(f)
	}
	return i
}

func roundTo2(v float64) float64 {
	return math.Round(v*100) / 100
}
