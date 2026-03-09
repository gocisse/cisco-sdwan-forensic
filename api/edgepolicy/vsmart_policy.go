package edgepolicy

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"
)

// VsmartPolicy corresponds to /dataservice/template/policy/vsmart
type VsmartPolicy struct {
	PolicyVersion     string `json:"policyVersion"`
	LastUpdatedBy     string `json:"lastUpdatedBy"`
	PolicyName        string `json:"policyName"`
	PolicyDefinition  string `json:"policyDefinition"`
	CreatedOn         int64  `json:"createdOn"`
	IsPolicyActivated bool   `json:"isPolicyActivated"`
	PolicyDescription string `json:"policyDescription"`
	Rid               int    `json:"@rid"`
	PolicyID          string `json:"policyId"`
	CreatedBy         string `json:"createdBy"`
	PolicyType        string `json:"policyType"`
	LastUpdatedOn     int64  `json:"lastUpdatedOn"`
}

// FetchVsmartPolicy fetches data from /dataservice/template/policy/vsmart
func FetchVsmartPolicy(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// No system-ip parameter is required for this endpoint.
		endpoint := "dataservice/template/policy/vsmart"

		// Fetch raw JSON data from API.
		data, err := apiClient.Get(endpoint)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Unmarshal into a wrapper struct.
		var resp struct {
			Data []VsmartPolicy `json:"data"`
		}
		if err := json.Unmarshal(data, &resp); err != nil {
			http.Error(w, "Failed to parse vSmart policy response", http.StatusInternalServerError)
			return
		}

		// Return the JSON array.
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp.Data)
	}
}

// package edgepolicy

// import (
// 	"encoding/json"
// 	"net/http"
// 	"sdwan-app/utils"
// )

// // VsmartPolicy corresponds to /dataservice/template/policy/vsmart
// type VsmartPolicy struct {
// 	PolicyVersion     string `json:"policyVersion"`
// 	LastUpdatedBy     string `json:"lastUpdatedBy"`
// 	PolicyName        string `json:"policyName"`
// 	PolicyDefinition  string `json:"policyDefinition"`
// 	CreatedOn         int64  `json:"createdOn"`
// 	IsPolicyActivated bool   `json:"isPolicyActivated"`
// 	PolicyDescription string `json:"policyDescription"`
// 	Rid               int    `json:"@rid"`
// 	PolicyID          string `json:"policyId"`
// 	CreatedBy         string `json:"createdBy"`
// 	PolicyType        string `json:"policyType"`
// 	LastUpdatedOn     int64  `json:"lastUpdatedOn"`
// }

// // FetchVsmartPolicy fetches data from /dataservice/template/policy/vsmart
// func FetchVsmartPolicy(apiClient *utils.APIClient) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		// No system-ip parameter is required for this endpoint.
// 		endpoint := "dataservice/template/policy/vsmart"

// 		// Fetch raw JSON data from API.
// 		data, err := apiClient.Get(endpoint)
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}

// 		// Parse the JSON response directly into an array of VsmartPolicy.
// 		var policies []VsmartPolicy
// 		if err := json.Unmarshal(data, &policies); err != nil {
// 			http.Error(w, "Failed to parse vSmart policy response", http.StatusInternalServerError)
// 			return
// 		}

// 		// Return the JSON array.
// 		w.Header().Set("Content-Type", "application/json")
// 		json.NewEncoder(w).Encode(policies)
// 	}
// }

// package edgepolicy

// import (
// 	"encoding/json"
// 	"fmt"
// 	"net/http"
// 	"sdwan-app/utils"

// 	"github.com/gorilla/mux"
// )

// // VsmartPolicy corresponds to /dataservice/device/policy/vsmart?deviceId=system-ip
// type VsmartPolicy struct {
// 	VpnList         string `json:"vpn-list"`
// 	VdeviceDataKey  string `json:"vdevice-dataKey"`
// 	VdeviceName     string `json:"vdevice-name"`
// 	Name            string `json:"name"`
// 	Lastupdated     int64  `json:"lastupdated"`
// 	VpnID           string `json:"vpn-id"`
// 	AppList         string `json:"app-list"`
// 	VdeviceHostName string `json:"vdevice-host-name"`
// }

// // FetchVsmartPolicy fetches data from /dataservice/device/policy/vsmart?deviceId=...
// func FetchVsmartPolicy(apiClient *utils.APIClient) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		// Extract system-ip from route parameters.
// 		params := mux.Vars(r)
// 		deviceID := params["system-ip"]

// 		// Validate system-ip.
// 		if deviceID == "" {
// 			http.Error(w, "Missing 'system-ip' in the URL", http.StatusBadRequest)
// 			return
// 		}

// 		// Construct API endpoint.
// 		endpoint := fmt.Sprintf("dataservice/device/policy/vsmart?deviceId=%s", deviceID)

// 		// Fetch raw JSON data from API.
// 		data, err := apiClient.Get(endpoint)
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}

// 		// Parse raw JSON response into VsmartPolicy struct.
// 		var response []VsmartPolicy // Adjusted for direct array response.
// 		if err := json.Unmarshal(data, &response); err != nil {
// 			http.Error(w, "Failed to parse vSmart policy response", http.StatusInternalServerError)
// 			return
// 		}

// 		// Return JSON response.
// 		w.Header().Set("Content-Type", "application/json")
// 		json.NewEncoder(w).Encode(response)
// 	}
// }
