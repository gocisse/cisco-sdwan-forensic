// device_policer.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// PolicyFilter corresponds to the data from /dataservice/device/policer?deviceId=system-ip
type PolicyFilter struct {
	OosBytes        string `json:"oos-bytes"`
	OosAction       string `json:"oos-action"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	VdeviceName     string `json:"vdevice-name"`
	Rate            int    `json:"rate"`
	OosPkts         string `json:"oos-pkts"`
	Name            string `json:"name"`
	Index           int    `json:"index"`
	Lastupdated     int64  `json:"lastupdated"`
	Burst           int    `json:"burst"`
	VdeviceHostName string `json:"vdevice-host-name"`
	Direction       string `json:"direction"`
}

// FetchDevicePolicer fetches policer info from /dataservice/device/policer?deviceId=system-ip
func FetchDevicePolicer(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract the system-ip from the URL path parameters.
		vars := mux.Vars(r)
		deviceID := vars["system-ip"]
		if deviceID == "" {
			http.Error(w, "Missing 'system-ip' URL parameter", http.StatusBadRequest)
			return
		}

		// Build the vManage endpoint.
		endpoint := fmt.Sprintf("dataservice/device/policer?deviceId=%s", deviceID)

		// Fetch data via APIClient.
		data, err := apiClient.Get(endpoint)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Unmarshal into a "data" wrapper.
		var response struct {
			Data []PolicyFilter `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse device policer response", http.StatusInternalServerError)
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

// // PolicyFilter corresponds to the data from /dataservice/device/policer?deviceId=system-ip
// type PolicyFilter struct {
// 	OosBytes        string `json:"oos-bytes"`
// 	OosAction       string `json:"oos-action"`
// 	VdeviceDataKey  string `json:"vdevice-dataKey"`
// 	VdeviceName     string `json:"vdevice-name"`
// 	Rate            int    `json:"rate"`
// 	OosPkts         string `json:"oos-pkts"`
// 	Name            string `json:"name"`
// 	Index           int    `json:"index"`
// 	Lastupdated     int64  `json:"lastupdated"`
// 	Burst           int    `json:"burst"`
// 	VdeviceHostName string `json:"vdevice-host-name"`
// 	Direction       string `json:"direction"`
// }

// // FetchDevicePolicer fetches policer info from /dataservice/device/policer?deviceId=system-ip
// func FetchDevicePolicer(apiClient *utils.APIClient) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		deviceID := r.URL.Query().Get("system-ip")
// 		if deviceID == "" {
// 			http.Error(w, "Missing 'system-ip' query param", http.StatusBadRequest)
// 			return
// 		}

// 		endpoint := fmt.Sprintf("dataservice/device/policer?deviceId=%s", deviceID)

// 		data, err := apiClient.Get(endpoint)
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}

// 		var response struct {
// 			Data []PolicyFilter `json:"data"`
// 		}
// 		if err := json.Unmarshal(data, &response); err != nil {
// 			http.Error(w, "Failed to parse device policer response", http.StatusInternalServerError)
// 			return
// 		}

// 		w.Header().Set("Content-Type", "application/json")
// 		json.NewEncoder(w).Encode(response.Data)
// 	}
// }
