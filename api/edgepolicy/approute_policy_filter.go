// approutepolicyfilter.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// AccessListPolicyFilter represents the data from
// /dataservice/device/policy/approutepolicyfilter?deviceId=system-ip
type AccessListPolicyFilter struct {
	VpnName         string `json:"vpn-name"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	CounterName     string `json:"counter-name"`
	VdeviceName     string `json:"vdevice-name"`
	Bytes           string `json:"bytes"`
	PolicyName      string `json:"policy-name"`
	Lastupdated     int64  `json:"lastupdated"`
	VdeviceHostName string `json:"vdevice-host-name"`
	Packets         string `json:"packets"`
}

// FetchAppRoutePolicyFilter fetches app route policy filter data for the given device ID (system IP).
func FetchAppRoutePolicyFilter(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract the system-ip from the URL path parameters.
		vars := mux.Vars(r)
		deviceID := vars["system-ip"]
		if deviceID == "" {
			http.Error(w, "Missing 'system-ip' URL parameter", http.StatusBadRequest)
			return
		}

		// Build the vManage endpoint.
		endpoint := fmt.Sprintf("dataservice/device/policy/approutepolicyfilter?deviceId=%s", deviceID)

		// Fetch data from vManage.
		data, err := apiClient.Get(endpoint)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Unmarshal into a "data" wrapper.
		var response struct {
			Data []AccessListPolicyFilter `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse AppRoute Policy Filter response", http.StatusInternalServerError)
			return
		}

		// Return the array in JSON format.
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

// // AccessListPolicyFilter represents the data from
// // /dataservice/device/policy/approutepolicyfilter?deviceId=system-ip
// type AccessListPolicyFilter struct {
// 	VpnName         string `json:"vpn-name"`
// 	VdeviceDataKey  string `json:"vdevice-dataKey"`
// 	CounterName     string `json:"counter-name"`
// 	VdeviceName     string `json:"vdevice-name"`
// 	Bytes           string `json:"bytes"`
// 	PolicyName      string `json:"policy-name"`
// 	Lastupdated     int64  `json:"lastupdated"`
// 	VdeviceHostName string `json:"vdevice-host-name"`
// 	Packets         string `json:"packets"`
// }

// // FetchAppRoutePolicyFilter fetches app route policy filter data for the given device ID (system IP).
// func FetchAppRoutePolicyFilter(apiClient *utils.APIClient) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		// 1) Grab the system-ip query param
// 		deviceID := r.URL.Query().Get("system-ip")
// 		if deviceID == "" {
// 			http.Error(w, "Missing 'system-ip' query parameter", http.StatusBadRequest)
// 			return
// 		}

// 		// 2) Build the vManage endpoint
// 		endpoint := fmt.Sprintf("dataservice/device/policy/approutepolicyfilter?deviceId=%s", deviceID)

// 		// 3) Fetch data from vManage
// 		data, err := apiClient.Get(endpoint)
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}

// 		// 4) Unmarshal into a "data" wrapper
// 		var response struct {
// 			Data []AccessListPolicyFilter `json:"data"`
// 		}
// 		if err := json.Unmarshal(data, &response); err != nil {
// 			http.Error(w, "Failed to parse AppRoute Policy Filter response", http.StatusInternalServerError)
// 			return
// 		}

// 		// 5) Return the array in JSON format
// 		w.Header().Set("Content-Type", "application/json")
// 		json.NewEncoder(w).Encode(response.Data)
// 	}
// }
