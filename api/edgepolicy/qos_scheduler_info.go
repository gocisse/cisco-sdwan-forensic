package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"
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
		// Extract system-ip from URL path parameters.
		vars := mux.Vars(r)
		deviceID := vars["system-ip"]
		if deviceID == "" {
			http.Error(w, "Missing 'system-ip' URL parameter", http.StatusBadRequest)
			return
		}

		// Build the vManage endpoint.
		endpoint := fmt.Sprintf("dataservice/device/policy/qosschedulerinfo?deviceId=%s", deviceID)

		// Fetch data via APIClient.
		data, err := apiClient.Get(endpoint)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Unmarshal into a "data" wrapper.
		var response struct {
			Data []QosSchedulerInfo `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse QoS Scheduler info from vManage", http.StatusInternalServerError)
			return
		}

		// Return JSON array.
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
