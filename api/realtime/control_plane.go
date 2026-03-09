package realtime

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// ControlPlane represents the filtered control plane data for a device.
type ControlPlane struct {
	DomainID        int    `json:"domain-id"`
	VdeviceName     string `json:"vdevice-name"`
	Refresh         string `json:"refresh"`
	SiteID          int    `json:"site-id"`
	Type            string `json:"type"`
	VdeviceHostName string `json:"vdevice-host-name"`
	UpTimeDate      int64  `json:"up-time-date"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	Peer            string `json:"peer"`
	UpTime          string `json:"up-time"`
	Legit           string `json:"legit"`
	Lastupdated     int64  `json:"lastupdated"`
	State           string `json:"state"`
}

// FetchControlPlane retrieves and filters control plane data for a device
func FetchControlPlane(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]

		// Fetch raw JSON data from API
		rawData, err := apiClient.Get("dataservice/device/omp/peers?deviceId=" + systemIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Assume API response is wrapped inside a "data" field:
		// { "data": [ {...}, {...} ] }
		var response struct {
			Data []ControlPlane `json:"data"`
		}

		// Parse raw JSON response into ControlPlane struct
		if err := json.Unmarshal(rawData, &response); err != nil {
			http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
			return
		}

		// Convert filtered data back to JSON and send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
