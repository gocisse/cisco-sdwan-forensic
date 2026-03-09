package realtime

import (
	"encoding/json"
	"net/http"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// AdvTlocs represents the structure for advertised TLOCs data.
type AdvTlocs struct {
	Color           string `json:"color"`
	VdeviceName     string `json:"vdevice-name"`
	IP              string `json:"ip"`
	TlocAuthType    string `json:"tloc-auth-type"`
	Preference      string `json:"preference"`
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
	ToPeer          string `json:"to-peer"`
}

// FetchAdvertisedTlocs retrieves and filters advertised TLOCs for a device.
func FetchAdvertisedTlocs(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		systemIP := params["system-ip"]

		// Fetch raw JSON data from the API.
		rawData, err := apiClient.Get("dataservice/device/omp/tlocs/advertised?deviceId=" + systemIP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Assume the API response is wrapped inside a "data" field:
		// { "data": [ {...}, {...} ] }
		var response struct {
			Data []AdvTlocs `json:"data"`
		}

		// Unmarshal the raw JSON response into the AdvTlocs struct.
		if err := json.Unmarshal(rawData, &response); err != nil {
			http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
			return
		}

		// Re-marshal the filtered data (only the AdvTlocs slice) into JSON.
		filteredData, err := json.Marshal(response.Data)
		if err != nil {
			http.Error(w, "Failed to convert filtered data to JSON", http.StatusInternalServerError)
			return
		}

		// Set the Content-Type header and write the JSON response.
		w.Header().Set("Content-Type", "application/json")
		w.Write(filteredData)
	}
}
