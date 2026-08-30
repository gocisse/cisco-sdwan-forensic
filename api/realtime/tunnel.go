package realtime

import (
	"encoding/json"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// Tunnel represents the filtered tunnel statistics data.
type Tunnel struct {
	DestIP          string `json:"dest-ip"`
	SourcePort      int    `json:"source-port"`
	VdeviceName     string `json:"vdevice-name"`
	RxPkts          int    `json:"rx_pkts"`
	SystemIP        string `json:"system-ip"`
	TCPMssAdjust    int    `json:"tcp-mss-adjust"`
	RemoteColor     string `json:"remote-color"`
	TxOctets        int    `json:"tx_octets"`
	VdeviceHostName string `json:"vdevice-host-name"`
	TunnelProtocol  string `json:"tunnel-protocol"`
	LocalColor      string `json:"local-color"`
	TxPkts          int    `json:"tx_pkts"`
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
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		rawData, err := apiClient.Get("dataservice/device/tunnel/statistics?deviceId=" + systemIP)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch tunnel statistics from vManage")
			return
		}

		var response struct {
			Data []Tunnel `json:"data"`
		}

		if err := json.Unmarshal(rawData, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse tunnel response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
