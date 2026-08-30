package realtime

import (
	"encoding/json"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// IpSec represents the filtered IPSEC statistics data.
type IpSec struct {
	DestIP               string `json:"dest-ip"`
	SourcePort           int    `json:"source-port"`
	VdeviceName          string `json:"vdevice-name"`
	IpsecRxFailures      int    `json:"ipsec-rx-failures"`
	IpsecRxAuthFailures  int    `json:"ipsec-rx-auth-failures"`
	IpsecTxAuthFailures  int    `json:"ipsec-tx-auth-failures"`
	VdeviceHostName      string `json:"vdevice-host-name"`
	TunnelProtocol       string `json:"tunnel-protocol"`
	DestPort             int    `json:"dest-port"`
	VdeviceDataKey       string `json:"vdevice-dataKey"`
	IpsecDecryptInbound  int    `json:"ipsec-decrypt-inbound"`
	Lastupdated          int64  `json:"lastupdated"`
	SourceIP             string `json:"source-ip"`
	IpsecTxFailures      int    `json:"ipsec-tx-failures"`
	IpsecEncryptOutbound int    `json:"ipsec-encrypt-outbound"`
}

// FetchIpsecStatistics retrieves and filters IPSEC statistics for a device
func FetchIpsecStatistics(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		rawData, err := apiClient.Get("dataservice/device/tunnel/ipsec_statistics?deviceId=" + systemIP)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch IPsec statistics from vManage")
			return
		}

		var response struct {
			Data []IpSec `json:"data"`
		}

		if err := json.Unmarshal(rawData, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse IPsec response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
