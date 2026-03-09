// access_list_policers.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// AccessListPolicers represents the structure returned by
// /dataservice/device/policy/accesslistpolicers?deviceId=system-ip
type AccessListPolicers struct {
	Name            string `json:"name"`
	Lastupdated     int64  `json:"lastupdated"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	VdeviceName     string `json:"vdevice-name"`
	VdeviceHostName string `json:"vdevice-host-name"`
}

// FetchAccessListPolicers retrieves the Access List Policers for a given system IP.
func FetchAccessListPolicers(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract the system-ip from the URL path parameters
		vars := mux.Vars(r)
		deviceID := vars["system-ip"]
		if deviceID == "" {
			http.Error(w, "Missing 'system-ip' URL parameter", http.StatusBadRequest)
			return
		}

		// Build the vManage endpoint
		endpoint := fmt.Sprintf("dataservice/device/policy/accesslistpolicers?deviceId=%s", deviceID)

		// Fetch data from vManage
		data, err := apiClient.Get(endpoint)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Unmarshal into a struct that has a "data" field
		var response struct {
			Data []AccessListPolicers `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse Access List Policers response", http.StatusInternalServerError)
			return
		}

		// Return the array in JSON format
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

// // AccessListPolicers represents the structure returned by
// // /dataservice/device/policy/accesslistpolicers?deviceId=system-ip
// type AccessListPolicers struct {
// 	Name            string `json:"name"`
// 	Lastupdated     int64  `json:"lastupdated"`
// 	VdeviceDataKey  string `json:"vdevice-dataKey"`
// 	VdeviceName     string `json:"vdevice-name"`
// 	VdeviceHostName string `json:"vdevice-host-name"`
// }

// // FetchAccessListPolicers retrieves the Access List Policers for a given system IP.
// func FetchAccessListPolicers(apiClient *utils.APIClient) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		// 1) Grab the system-ip query param
// 		deviceID := r.URL.Query().Get("system-ip")
// 		if deviceID == "" {
// 			http.Error(w, "Missing 'system-ip' query parameter", http.StatusBadRequest)
// 			return
// 		}

// 		// 2) Build the vManage endpoint
// 		endpoint := fmt.Sprintf("dataservice/device/policy/accesslistpolicers?deviceId=%s", deviceID)

// 		// 3) Fetch data from vManage
// 		data, err := apiClient.Get(endpoint)
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}

// 		// 4) Unmarshal into a struct that has a "data" field
// 		var response struct {
// 			Data []AccessListPolicers `json:"data"`
// 		}
// 		if err := json.Unmarshal(data, &response); err != nil {
// 			http.Error(w, "Failed to parse Access List Policers response", http.StatusInternalServerError)
// 			return
// 		}

// 		// 5) Return the array in JSON format
// 		w.Header().Set("Content-Type", "application/json")
// 		json.NewEncoder(w).Encode(response.Data)
// 	}
// }
