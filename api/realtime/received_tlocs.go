package realtime

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)
// Tlocs represents the filtered advertised and received TLOCs data.
type Tlocs struct {
	Color           string `json:"color"`
	VdeviceName     string `json:"vdevice-name"`
	IP              string `json:"ip"`
	TlocAuthType    string `json:"tloc-auth-type"`
	Preference      string `json:"preference"`
	FromPeer        string `json:"from-peer"`
	Weight          string `json:"weight"`
	Encap           string `json:"encap"`
	SiteID          string `json:"site-id"`
	Originator      string `json:"originator"`
	VdeviceHostName string `json:"vdevice-host-name"`
	TlocPublicIP    string `json:"tloc-public-ip"`
	TlocPublicPort  string `json:"tloc-public-port"`
	TlocPrivateIP   string `json:"tloc-private-ip"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	TlocPrivatePort string `json:"tloc-private-port"`
	TlocSpi         string `json:"tloc-spi"`
	Lastupdated     int64  `json:"lastupdated"`
	TlocEncryptType string `json:"tloc-encrypt-type"`
	TlocProto       string `json:"tloc-proto"`
	AddressFamily   string `json:"address-family"`
}

// FetchReceivedTlocs retrieves and filters received TLOCs for a device
func FetchReceivedTlocs(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]

		// Fetch raw JSON data from API
		rawData, err := apiClient.Get("dataservice/device/omp/tlocs/received?deviceId=" + systemIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Assume API response is wrapped inside a "data" field:
		// { "data": [ {...}, {...} ] }
		var response struct {
			Data []Tlocs `json:"data"`
		}

		// Parse raw JSON response into Tlocs struct
		if err := json.Unmarshal(rawData, &response); err != nil {
			http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
			return
		}

		// Convert filtered data back to JSON and send response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response.Data)
	}
}
