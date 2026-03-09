// access_list_counters.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// AccessListCounters represents the structure returned by
// /dataservice/device/policy/accesslistcounters?deviceId=system-ip
type AccessListCounters struct {
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	CounterName     string `json:"counter-name"`
	VdeviceName     string `json:"vdevice-name"`
	Bytes           string `json:"bytes"`
	Name            string `json:"name"`
	Lastupdated     int64  `json:"lastupdated"`
	VdeviceHostName string `json:"vdevice-host-name"`
	Packets         string `json:"packets"`
}

// FetchAccessListCounters retrieves the access-list counters for a given system IP.
func FetchAccessListCounters(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract the system-ip from the URL path parameters
		vars := mux.Vars(r)
		deviceID := vars["system-ip"]
		if deviceID == "" {
			http.Error(w, "Missing 'system-ip' URL parameter", http.StatusBadRequest)
			return
		}

		// Build the endpoint
		endpoint := fmt.Sprintf("dataservice/device/policy/accesslistcounters?deviceId=%s", deviceID)

		// Fetch data from vManage
		data, err := apiClient.Get(endpoint)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Unmarshal into a struct with a "data" field
		var response struct {
			Data []AccessListCounters `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			http.Error(w, "Failed to parse Access List Counters response", http.StatusInternalServerError)
			return
		}

		// Return the array in JSON format
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
