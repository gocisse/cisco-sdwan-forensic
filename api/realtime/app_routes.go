package realtime

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// AppRoutes represents the filtered application-aware routes data.
type AppRoutes struct {
	SrcIP           string `json:"src-ip"`
	DstIP           string `json:"dst-ip"`
	AverageLatency  string `json:"average-latency"`
	TxDataPkts      string `json:"tx-data-pkts"`
	VdeviceName     string `json:"vdevice-name"`
	SrcPort         int    `json:"src-port"`
	Index           string `json:"index"`
	DstPort         string `json:"dst-port"`
	RemoteColor     string `json:"remote-color"`
	RemoteSystemIP  string `json:"remote-system-ip"`
	SLAClassIndex   string `json:"sla-class-index"`
	VdeviceHostName string `json:"vdevice-host-name"`
	LocalColor      string `json:"local-color"`
	MeanLatency     int    `json:"mean-latency"`
	TotalPackets    string `json:"total-packets"`
	Loss            string `json:"loss"`
	MeanLoss        int    `json:"mean-loss"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	MeanJitter      int    `json:"mean-jitter"`
	Proto           string `json:"proto"`
	Lastupdated     int64  `json:"lastupdated"`
	AverageJitter   string `json:"average-jitter"`
	RxDataPkts      string `json:"rx-data-pkts"`
}

// FetchAppRoutes retrieves and filters application-aware routes for a device
func FetchAppRoutes(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]

		// Fetch raw JSON data from API
		rawData, err := apiClient.Get("dataservice/device/app-route/statistics?deviceId=" + systemIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Assume API response is wrapped inside a "data" field:
		// { "data": [ {...}, {...} ] }
		var response struct {
			Data []AppRoutes `json:"data"`
		}

		// Parse raw JSON response into AppRoutes struct
		if err := json.Unmarshal(rawData, &response); err != nil {
			http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
			return
		}

		// Convert filtered data back to JSON and send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
