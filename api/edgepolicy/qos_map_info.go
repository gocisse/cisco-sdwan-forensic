package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"
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
		// Extract system-ip from URL path parameters.
		vars := mux.Vars(r)
		deviceID := vars["system-ip"]
		if deviceID == "" {
			http.Error(w, "Missing 'system-ip' URL parameter", http.StatusBadRequest)
			return
		}

		// Build the vManage endpoint.
		endpoint := fmt.Sprintf("dataservice/device/policy/qosmapinfo?deviceId=%s", deviceID)

		// Fetch data via APIClient.
		data, err := apiClient.Get(endpoint)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Unmarshal into a "data" wrapper.
		var response struct {
			Data []QosMapInfo `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse QoS map info response", http.StatusInternalServerError)
			return
		}

		// Return JSON array.
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}

// package edgepolicy

// import (
// 	"encoding/json"
// 	"fmt"
// 	"net/http"
// 	"sdwan-app/utils"
// )

// // QosMapInfo corresponds to /dataservice/device/policy/qosmapinfo?deviceId=system-ip
// type QosMapInfo struct {
// 	Lastupdated     int64  `json:"lastupdated"`
// 	VdeviceDataKey  string `json:"vdevice-dataKey"`
// 	VdeviceName     string `json:"vdevice-name"`
// 	QosMapName      string `json:"qos-map-name"`
// 	VdeviceHostName string `json:"vdevice-host-name"`
// }

// // FetchQosMapInfo fetches from /dataservice/device/policy/qosmapinfo?deviceId=...
// func FetchQosMapInfo(apiClient *utils.APIClient) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		deviceID := r.URL.Query().Get("system-ip")
// 		if deviceID == "" {
// 			http.Error(w, "Missing 'system-ip' query param", http.StatusBadRequest)
// 			return
// 		}

// 		endpoint := fmt.Sprintf("dataservice/device/policy/qosmapinfo?deviceId=%s", deviceID)

// 		data, err := apiClient.Get(endpoint)
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}

// 		var response struct {
// 			Data []QosMapInfo `json:"data"`
// 		}
// 		if err := json.Unmarshal(data, &response); err != nil {
// 			http.Error(w, "Failed to parse QoS map info response", http.StatusInternalServerError)
// 			return
// 		}

// 		w.Header().Set("Content-Type", "application/json")
// 		json.NewEncoder(w).Encode(response.Data)
// 	}
// }
