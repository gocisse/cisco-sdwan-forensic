package realtime

import (
	"encoding/json"
	"net/http"

	"sdwan-app/middleware"
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
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		rawData, err := apiClient.Get("dataservice/device/omp/routes/advertised?deviceId=" + systemIP)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch advertised routes from vManage")
			return
		}

		var response struct {
			Data []Routes `json:"data"`
		}

		if err := json.Unmarshal(rawData, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse routes response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
