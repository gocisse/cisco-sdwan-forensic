// qos_scheduler_info.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// QosSchedulerInfo corresponds to /dataservice/device/policy/qosschedulerinfo?deviceId={system-ip}
type QosSchedulerInfo struct {
	VdeviceDataKey   string `json:"vdevice-dataKey"`
	VdeviceName      string `json:"vdevice-name"`
	QosMapName       string `json:"qos-map-name"`
	BufferPercent    string `json:"buffer-percent"`
	Lastupdated      int64  `json:"lastupdated"`
	BandwidthPercent string `json:"bandwidth-percent"`
	QosSchedulerName string `json:"qos-scheduler-name"`
	VdeviceHostName  string `json:"vdevice-host-name"`
}

// FetchQosSchedulerInfo fetches from /dataservice/device/policy/qosschedulerinfo?deviceId={system-ip}
func FetchQosSchedulerInfo(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		endpoint := fmt.Sprintf("dataservice/device/policy/qosschedulerinfo?deviceId=%s", systemIP)

		data, err := apiClient.Get(endpoint)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch QoS scheduler info from vManage")
			return
		}

		var response struct {
			Data []QosSchedulerInfo `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse QoS scheduler info response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
