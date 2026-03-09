// Topology.go 
package topology

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// BFD represents the filtered BFD session data.
type BFD struct {
	SrcIP            string `json:"src-ip"`
	DstIP            string `json:"dst-ip"`
	Color            string `json:"color"`
	VdeviceName      string `json:"vdevice-name"`
	SrcPort          int    `json:"src-port"`
	SystemIP         string `json:"system-ip"`
	DstPort          int    `json:"dst-port"`
	SiteID           int    `json:"site-id"`
	Transitions      int    `json:"transitions"`
	VdeviceHostName  string `json:"vdevice-host-name"`
	LocalColor       string `json:"local-color"`
	Uptime           string `json:"uptime"`
	DetectMultiplier string `json:"detect-multiplier"`
	VdeviceDataKey   string `json:"vdevice-dataKey"`
	Proto            string `json:"proto"`
	Lastupdated      int64  `json:"lastupdated"`
	State            string `json:"state"`
	TxInterval       int    `json:"tx-interval"`
	UptimeDate       int64  `json:"uptime-date"`
}

// FetchTopology retrieves and filters BFD session data
func FetchTopology(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]

		// Fetch raw JSON data from API
		rawData, err := apiClient.Get("dataservice/device/bfd/sessions?deviceId=" + systemIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Assume API response is wrapped inside a "data" field:
		// { "data": [ {...}, {...} ] }
		var response struct {
			Data []BFD `json:"data"`
		}

		// Parse raw JSON response into BFD struct
		if err := json.Unmarshal(rawData, &response); err != nil {
			http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
			return
		}

		// Convert filtered data back to JSON and send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
