package realtime

import (
	"encoding/json"
	"net/http"

	"sdwan-app/middleware"
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
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		rawData, err := apiClient.Get("dataservice/device/app-route/statistics?deviceId=" + systemIP)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch app routes from vManage")
			return
		}

		var response struct {
			Data []AppRoutes `json:"data"`
		}

		if err := json.Unmarshal(rawData, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse app routes response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
