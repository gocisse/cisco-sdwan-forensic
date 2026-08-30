package realtime

import (
	"encoding/json"
	"net/http"

	"sdwan-app/middleware"
	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// BFD represents the filtered BFD session data.
type BFD struct {
	DestIP          string `json:"dest-ip"`
	SourcePort      int    `json:"source-port"`
	BfdEchoRxPkts   int    `json:"bfd-echo-rx-pkts"`
	VdeviceName     string `json:"vdevice-name"`
	BfdPmtuTxOctets int    `json:"bfd-pmtu-tx-octets"`
	BfdEchoTxOctets int    `json:"bfd-echo-tx-octets"`
	BfdPmtuRxOctets int    `json:"bfd-pmtu-rx-octets"`
	VdeviceHostName string `json:"vdevice-host-name"`
	TunnelProtocol  string `json:"tunnel-protocol"`
	BfdPmtuTxPkts   int    `json:"bfd-pmtu-tx-pkts"`
	DestPort        int    `json:"dest-port"`
	VdeviceDataKey  string `json:"vdevice-dataKey"`
	Lastupdated     int64  `json:"lastupdated"`
	SourceIP        string `json:"source-ip"`
	BfdEchoTxPkts   int    `json:"bfd-echo-tx-pkts"`
	BfdPmtuRxPkts   int    `json:"bfd-pmtu-rx-pkts"`
	BfdEchoRxOctets int    `json:"bfd-echo-rx-octets"`
}

// FetchBfdSessions retrieves and filters BFD sessions for a device
func FetchBfdSessions(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		if systemIP == "" {
			middleware.WriteError(w, http.StatusBadRequest, "MISSING_PARAM", "Missing 'system-ip' path parameter")
			return
		}

		rawData, err := apiClient.Get("dataservice/device/tunnel/bfd_statistics?deviceId=" + systemIP)
		if err != nil {
			middleware.WriteError(w, http.StatusBadGateway, "VMANAGE_ERROR", "Failed to fetch BFD sessions from vManage")
			return
		}

		var response struct {
			Data []BFD `json:"data"`
		}

		if err := json.Unmarshal(rawData, &response); err != nil {
			middleware.WriteError(w, http.StatusInternalServerError, "PARSE_ERROR", "Failed to parse BFD response")
			return
		}

		middleware.RespondJSON(w, http.StatusOK, response.Data)
	}
}
