package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// DataPolicyFilter corresponds to the structure returned by
// /dataservice/device/policy/datapolicyfilter?deviceId=system-ip
type DataPolicyFilter struct {
	VpnName         string `json:"vpn-name"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	CounterName     string `json:"counter-name"`
	VdeviceName     string `json:"vdevice-name"`
	Bytes           string `json:"bytes"`
	PolicyName      string `json:"policy-name"`
	Lastupdated     int64  `json:"lastupdated"`
	VdeviceHostName string `json:"vdevice-host-name"`
	Packets         int    `json:"packets"`
}

// FetchDataPolicyFilter fetches data policy filter information for a given system IP.
func FetchDataPolicyFilter(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract system-ip from the URL path parameters.
		vars := mux.Vars(r)
		deviceID := vars["system-ip"]
		if deviceID == "" {
			http.Error(w, "Missing 'system-ip' URL parameter", http.StatusBadRequest)
			return
		}

		// Build the vManage endpoint.
		endpoint := fmt.Sprintf("dataservice/device/policy/datapolicyfilter?deviceId=%s", deviceID)

		// Fetch data via APIClient.
		data, err := apiClient.Get(endpoint)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Unmarshal into a "data" wrapper.
		var response struct {
			Data []DataPolicyFilter `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse Data Policy Filter response", http.StatusInternalServerError)
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

// // DataPolicyFilter corresponds to the structure returned by
// // /dataservice/device/policy/datapolicyfilter?deviceId=system-ip
// type DataPolicyFilter struct {
// 	VpnName         string `json:"vpn-name"`
// 	VdeviceDataKey  string `json:"vdevice-dataKey"`
// 	CounterName     string `json:"counter-name"`
// 	VdeviceName     string `json:"vdevice-name"`
// 	Bytes           string `json:"bytes"`
// 	PolicyName      string `json:"policy-name"`
// 	Lastupdated     int64  `json:"lastupdated"`
// 	VdeviceHostName string `json:"vdevice-host-name"`
// 	Packets         int    `json:"packets"`
// }

// // FetchDataPolicyFilter fetches data policy filter information for a given system IP.
// func FetchDataPolicyFilter(apiClient *utils.APIClient) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		// 1) Extract system-ip from query params
// 		deviceID := r.URL.Query().Get("system-ip")
// 		if deviceID == "" {
// 			http.Error(w, "Missing 'system-ip' query parameter", http.StatusBadRequest)
// 			return
// 		}

// 		// 2) Build the vManage endpoint
// 		endpoint := fmt.Sprintf("dataservice/device/policy/datapolicyfilter?deviceId=%s", deviceID)

// 		// 3) Fetch data via APIClient
// 		data, err := apiClient.Get(endpoint)
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}

// 		// 4) Unmarshal into a "data" wrapper
// 		var response struct {
// 			Data []DataPolicyFilter `json:"data"`
// 		}
// 		if err := json.Unmarshal(data, &response); err != nil {
// 			http.Error(w, "Failed to parse Data Policy Filter response", http.StatusInternalServerError)
// 			return
// 		}

// 		// 5) Return JSON array
// 		w.Header().Set("Content-Type", "application/json")
// 		json.NewEncoder(w).Encode(response.Data)
// 	}
// }

