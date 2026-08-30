package realtime

import (
	"encoding/json"
	"net/http"

	"sdwan-app/middleware"
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
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		rawData, err := apiClient.Get("dataservice/device/omp/peers?deviceId=" + systemIP)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch OMP peers from vManage")
			return
		}

		var response struct {
			Data []ControlPlane `json:"data"`
		}

		if err := json.Unmarshal(rawData, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse control plane response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
