package realtime

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// Tunnel represents the filtered tunnel statistics data.
type Tunnel struct {
	DestIP          string `json:"dest-ip"`
	SourcePort      int    `json:"source-port"`
	VdeviceName     string `json:"vdevice-name"`
	RxPkts         int    `json:"rx_pkts"`
	SystemIP        string `json:"system-ip"`
	TCPMssAdjust    int    `json:"tcp-mss-adjust"`
	RemoteColor     string `json:"remote-color"`
	TxOctets        int    `json:"tx_octets"`
	VdeviceHostName string `json:"vdevice-host-name"`
	TunnelProtocol  string `json:"tunnel-protocol"`
	LocalColor      string `json:"local-color"`
	TxPkts         int    `json:"tx_pkts"`
	DestPort        int    `json:"dest-port"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	RxOctets        int    `json:"rx_octets"`
	TunnelMtu       int    `json:"tunnel-mtu"`
	Lastupdated     int64  `json:"lastupdated"`
	SourceIP        string `json:"source-ip"`
}

// FetchTunnelStatistics retrieves and filters tunnel statistics for a device
func FetchTunnelStatistics(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]

		// Fetch raw JSON data from API
		rawData, err := apiClient.Get("dataservice/device/tunnel/statistics?deviceId=" + systemIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Assume API response is wrapped inside a "data" field:
		// { "data": [ {...}, {...} ] }
		var response struct {
			Data []Tunnel `json:"data"`
		}

		// Parse raw JSON response into Tunnel struct
		if err := json.Unmarshal(rawData, &response); err != nil {
			http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
			return
		}

		// Convert filtered data back to JSON and send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
