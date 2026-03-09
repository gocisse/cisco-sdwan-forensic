// access_list_associations.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// AccessListAssociations represents the structure returned by
// /dataservice/device/policy/accesslistassociations?deviceId=system-ip
type AccessListAssociations struct {
	VdeviceDataKey     string `json:"vdevice-dataKey"`
	VdeviceName        string `json:"vdevice-name"`
	InterfaceName      string `json:"interface-name"`
	Name               string `json:"name"`
	Lastupdated        string `json:"lastupdated"`
	VdeviceHostName    string `json:"vdevice-host-name"`
	InterfaceDirection string `json:"interface-direction"`
}

// FetchAccessListAssociations retrieves the access-list associations for a given system IP.
func FetchAccessListAssociations(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract the system-ip from the URL path parameters using mux.Vars
		vars := mux.Vars(r)
		deviceID := vars["system-ip"]
		if deviceID == "" {
			http.Error(w, "Missing 'system-ip' in URL parameter", http.StatusBadRequest)
			return
		}

		// Build the endpoint with the extracted deviceID
		endpoint := fmt.Sprintf("dataservice/device/policy/accesslistassociations?deviceId=%s", deviceID)

		// Fetch data from the API client
		data, err := apiClient.Get(endpoint)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Unmarshal into a struct with a "data" field
		var response struct {
			Data []AccessListAssociations `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse Access List Associations response", http.StatusInternalServerError)
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

// // AccessListAssociations represents the structure returned by
// // /dataservice/device/policy/accesslistassociations?deviceId=system-ip
// type AccessListAssociations struct {
// 	VdeviceDataKey     string `json:"vdevice-dataKey"`
// 	VdeviceName        string `json:"vdevice-name"`
// 	InterfaceName      string `json:"interface-name"`
// 	Name               string `json:"name"`
// 	Lastupdated        string `json:"lastupdated"`
// 	VdeviceHostName    string `json:"vdevice-host-name"`
// 	InterfaceDirection string `json:"interface-direction"`
// }

// // FetchAccessListAssociations retrieves the access-list associations for a given system IP.
// func FetchAccessListAssociations(apiClient *utils.APIClient) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		// 1) Grab the system-ip query param
// 		deviceID := r.URL.Query().Get("system-ip")
// 		if deviceID == "" {
// 			http.Error(w, "Missing 'system-ip' query parameter", http.StatusBadRequest)
// 			return
// 		}

// 		// 2) Build the endpoint
// 		endpoint := fmt.Sprintf("dataservice/device/policy/accesslistassociations?deviceId=%s", deviceID)

// 		// 3) Fetch data from vManage
// 		data, err := apiClient.Get(endpoint)
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}

// 		// 4) Unmarshal into a struct with a "data" field
// 		var response struct {
// 			Data []AccessListAssociations `json:"data"`
// 		}
// 		if err := json.Unmarshal(data, &response); err != nil {
// 			http.Error(w, "Failed to parse Access List Associations response", http.StatusInternalServerError)
// 			return
// 		}

// 		// 5) Return the array in JSON format
// 		w.Header().Set("Content-Type", "application/json")
// 		json.NewEncoder(w).Encode(response.Data)
// 	}
// }
