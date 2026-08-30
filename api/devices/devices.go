package devices

import (
	"encoding/json"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"
)

type Device struct {
	DeviceID            string   `json:"deviceId"`
	SystemIP            string   `json:"system-ip"`
	HostName            string   `json:"host-name"`
	Reachability        string   `json:"reachability"`
	Status              string   `json:"status"`
	Timezone            string   `json:"timezone"`
	BoardSerial         string   `json:"board-serial"`
	CertificateValidity string   `json:"certificate-validity"`
	ControlConnections  string   `json:"controlConnections"`
	DeviceModel         string   `json:"device-model"`
	ConnectedVManages   []string `json:"connectedVManages"`
	SiteID              string   `json:"site-id"`
	Latitude            string   `json:"latitude"`
	Longitude           string   `json:"longitude"`
	IsDeviceGeoData     bool     `json:"isDeviceGeoData"`
	UptimeDate          int64    `json:"uptime-date"`
	DeviceOs            string   `json:"device-os"`
	State               string   `json:"state"`
	LocalSystemIP       string   `json:"local-system-ip"`
}

// FetchDevices retrieves and filters SD-WAN device data from vManage
func FetchDevices(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := apiClient.Get("dataservice/device")
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch devices from vManage")
			return
		}

		var response struct {
			Data []Device `json:"data"`
		}

		if err := json.Unmarshal(data, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse device response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
