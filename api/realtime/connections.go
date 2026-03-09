package realtime

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// ConnecTions represents the filtered control connections data.
type ConnecTions struct {
	DomainID          int    `json:"domain-id"`
	Instance          int    `json:"instance"`
	VdeviceName       string `json:"vdevice-name"`
	BehindProxy       string `json:"behind-proxy"`
	SystemIP          string `json:"system-ip"`
	RemoteColor       string `json:"remote-color"`
	SiteID            int    `json:"site-id"`
	PrivatePort       int    `json:"private-port"`
	ControllerGroupID int    `json:"controller-group-id"`
	VdeviceHostName   string `json:"vdevice-host-name"`
	LocalColor        string `json:"local-color"`
	Uptime            string `json:"uptime"`
	PeerType          string `json:"peer-type"`
	Protocol          string `json:"protocol"`
	VdeviceDataKey    string `json:"vdevice-dataKey"`
	PublicIP          string `json:"public-ip"`
	PublicPort        int    `json:"public-port"`
	Lastupdated       int64  `json:"lastupdated"`
	State             string `json:"state"`
	PrivateIP         string `json:"private-ip"`
	UptimeDate        int64  `json:"uptime-date"`
}

// FetchControlConnections retrieves and filters control connections for a given system IP
func FetchControlConnections(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]

		// Fetch raw JSON data from API
		rawData, err := apiClient.Get("dataservice/device/control/connections?deviceId=" + systemIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Assume API response is wrapped inside a "data" field:
		// { "data": [ {...}, {...} ] }
		var response struct {
			Data []ConnecTions `json:"data"`
		}

		// Parse raw JSON response into ConnecTions struct
		if err := json.Unmarshal(rawData, &response); err != nil {
			http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
			return
		}

		// Convert filtered data back to JSON and send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
