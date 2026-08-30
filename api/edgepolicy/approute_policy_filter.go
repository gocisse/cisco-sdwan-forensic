// approute_policy_filter.go
package edgepolicy

import (
	"encoding/json"
	"fmt"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// AccessListPolicyFilter represents the data from
// /dataservice/device/policy/approutepolicyfilter?deviceId=system-ip
type AccessListPolicyFilter struct {
	VpnName         string `json:"vpn-name"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	CounterName     string `json:"counter-name"`
	VdeviceName     string `json:"vdevice-name"`
	Bytes           string `json:"bytes"`
	PolicyName      string `json:"policy-name"`
	Lastupdated     int64  `json:"lastupdated"`
	VdeviceHostName string `json:"vdevice-host-name"`
	Packets         string `json:"packets"`
}

// FetchAppRoutePolicyFilter fetches app route policy filter data for the given device ID (system IP).
func FetchAppRoutePolicyFilter(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		endpoint := fmt.Sprintf("dataservice/device/policy/approutepolicyfilter?deviceId=%s", systemIP)

		data, err := apiClient.Get(endpoint)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch app route policy filter from vManage")
			return
		}

		var response struct {
			Data []AccessListPolicyFilter `json:"data"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse app route policy filter response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
