// qos_map_info.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// QosMapInfo corresponds to /dataservice/device/policy/qosmapinfo?deviceId=system-ip
type QosMapInfo struct {
	Lastupdated     int64  `json:"lastupdated"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	VdeviceName     string `json:"vdevice-name"`
	QosMapName      string `json:"qos-map-name"`
	VdeviceHostName string `json:"vdevice-host-name"`
}

// FetchQosMapInfo fetches from /dataservice/device/policy/qosmapinfo?deviceId=...
func FetchQosMapInfo(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		endpoint := fmt.Sprintf("dataservice/device/policy/qosmapinfo?deviceId=%s", systemIP)

		data, err := apiClient.Get(endpoint)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch QoS map info from vManage")
			return
		}

		var response struct {
			Data []QosMapInfo `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse QoS map info response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
