package realtime

import (
	"encoding/json"
	"net/http"

	"sdwan-app/middleware"
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
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		rawData, err := apiClient.Get("dataservice/device/omp/tlocs/advertised?deviceId=" + systemIP)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch advertised TLOCs from vManage")
			return
		}

		var response struct {
			Data []AdvTlocs `json:"data"`
		}

		if err := json.Unmarshal(rawData, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse TLOCs response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
