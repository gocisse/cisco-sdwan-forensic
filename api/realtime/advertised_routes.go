package realtime

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// Routes represents the filtered OMP advertised and received routes data.
type Routes struct {
	OverlayID       string `json:"overlay-id"`
	Color           string `json:"color"`
	VdeviceName     string `json:"vdevice-name"`
	Prefix          string `json:"prefix"`
	IP              string `json:"ip"`
	FromPeer        string `json:"from-peer"`
	Label           string `json:"label"`
	Encap           string `json:"encap"`
	SiteID          string `json:"site-id"`
	Originator      string `json:"originator"`
	VpnID           string `json:"vpn-id"`
	VdeviceHostName string `json:"vdevice-host-name"`
	PathID          string `json:"path-id"`
	Protocol        string `json:"protocol"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	Metric          string `json:"metric"`
	Lastupdated     int64  `json:"lastupdated"`
	AttributeType   string `json:"attribute-type"`
	Status          string `json:"status"`
}



// FetchAdvertisedRoutes retrieves and filters advertised OMP routes for a device
func FetchAdvertisedRoutes(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]

		// Fetch raw JSON data from API
		rawData, err := apiClient.Get("dataservice/device/omp/routes/advertised?deviceId=" + systemIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Assume API response is wrapped inside a "data" field:
		// { "data": [ {...}, {...} ] }
		var response struct {
			Data []Routes `json:"data"`
		}

		// Parse raw JSON response into Routes struct
		if err := json.Unmarshal(rawData, &response); err != nil {
			http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
			return
		}

		// Convert filtered data back to JSON and send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
