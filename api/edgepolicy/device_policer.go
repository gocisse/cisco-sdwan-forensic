// device_policer.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// PolicyFilter corresponds to the data from /dataservice/device/policer?deviceId=system-ip
type PolicyFilter struct {
	OosBytes        string `json:"oos-bytes"`
	OosAction       string `json:"oos-action"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	VdeviceName     string `json:"vdevice-name"`
	Rate            int    `json:"rate"`
	OosPkts         string `json:"oos-pkts"`
	Name            string `json:"name"`
	Index           int    `json:"index"`
	Lastupdated     int64  `json:"lastupdated"`
	Burst           int    `json:"burst"`
	VdeviceHostName string `json:"vdevice-host-name"`
	Direction       string `json:"direction"`
}

// FetchDevicePolicer fetches policer info from /dataservice/device/policer?deviceId=system-ip
func FetchDevicePolicer(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		endpoint := fmt.Sprintf("dataservice/device/policer?deviceId=%s", systemIP)

		data, err := apiClient.Get(endpoint)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch device policer from vManage")
			return
		}

		var response struct {
			Data []PolicyFilter `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse device policer response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
