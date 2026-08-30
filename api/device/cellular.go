package device

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"sdwan-app/utils"

	"github.com/gorilla/mux"
)

// ─── Cellular Connection ────────────────────────────────────────────────────
// Primary connection status - fetch first to determine if cellular is active

type CellularConnection struct {
	Interface      string `json:"if-name"`
	IPAddress      string `json:"ip-address"`
	IPv6Address    string `json:"ipv6-address"`
	Profile        string `json:"profile"`
	PrimaryDNS     string `json:"primary-dns"`
	SecondaryDNS   string `json:"secondary-dns"`
	RxPackets      int64  `json:"rx-packets"`
	TxPackets      int64  `json:"tx-packets"`
	RxBytes        int64  `json:"rx-bytes"`
	TxBytes        int64  `json:"tx-bytes"`
	PacketState    string `json:"pkt-session-status"`
	SessionState   string `json:"session-state"`
	RadioMode      string `json:"radio-mode"`
	SignalStrength string `json:"signal-strength"`
	RSSI           int    `json:"rssi"`
	RSRP           int    `json:"rsrp"`
	RSRQ           int    `json:"rsrq"`
	SNR            int    `json:"snr"`
	Band           string `json:"band"`
	Channel        int    `json:"channel"`
}

// ─── EIOLTE Session ─────────────────────────────────────────────────────────
// Detailed session/operational state

type CellularSession struct {
	Interface    string `json:"if-name"`
	AttachState  string `json:"attach-state"`
	DataState    string `json:"data-state"`
	ConnectState string `json:"connect-state"`
	APN          string `json:"apn"`
	Gateway      string `json:"gateway"`
	RxErrors     int64  `json:"rx-errors"`
	TxErrors     int64  `json:"tx-errors"`
	RxDrops      int64  `json:"rx-drops"`
	TxDrops      int64  `json:"tx-drops"`
	RxBytes      int64  `json:"rx-bytes"`
	TxBytes      int64  `json:"tx-bytes"`
	Uptime       string `json:"uptime"`
	LastError    string `json:"last-error"`
}

// ─── Cellular Hardware ──────────────────────────────────────────────────────
// Modem hardware details

type CellularHardware struct {
	Interface   string `json:"if-name"`
	IMEI        string `json:"imei"`
	ICCID       string `json:"iccid"`
	IMSI        string `json:"imsi"`
	Carrier     string `json:"carrier"`
	ModemModel  string `json:"modem-model"`
	Firmware    string `json:"firmware-version"`
	Temperature int    `json:"temperature"`
	ModemState  string `json:"modem-state"`
	SIMStatus   string `json:"sim-status"`
	PhoneNumber string `json:"phone-number"`
	ESN         string `json:"esn"`
	PRI         string `json:"pri-version"`
}

// ─── Cellular Status (Aggregated) ───────────────────────────────────────────
// Combined view for quick status check

type CellularStatus struct {
	HasCellular bool                `json:"hasCellular"`
	IsConnected bool                `json:"isConnected"`
	Interfaces  []CellularInterface `json:"interfaces"`
	Connection  []json.RawMessage   `json:"connection,omitempty"`
	Session     []json.RawMessage   `json:"session,omitempty"`
	Hardware    []json.RawMessage   `json:"hardware,omitempty"`
	Radio       []json.RawMessage   `json:"radio,omitempty"`
	Transport   []json.RawMessage   `json:"transport,omitempty"`
	Error       string              `json:"error,omitempty"`
}

type CellularInterface struct {
	Name        string `json:"name"`
	IPAddress   string `json:"ipAddress"`
	IsConnected bool   `json:"isConnected"`
	SignalBars  int    `json:"signalBars"`
	RadioMode   string `json:"radioMode"`
	RadioStatus string `json:"radioStatus"`
	Carrier     string `json:"carrier"`
	Band        string `json:"band"`
	RSSI        string `json:"rssi"`
	RSRP        string `json:"rsrp"`
	RSRQ        string `json:"rsrq"`
	SNR         string `json:"snr"`
}

// FetchCellularConnection returns basic cellular connection info
func FetchCellularConnection(apiClient *utils.APIClient) http.HandlerFunc {
	return FetchWithUUID(apiClient, "dataservice/device/cellular/connection")
}

// FetchCellularSession returns EIOLTE session/operational state
func FetchCellularSession(apiClient *utils.APIClient) http.HandlerFunc {
	return FetchWithUUID(apiClient, "dataservice/device/cellularEiolte/connections")
}

// FetchCellularHardware returns modem hardware details
func FetchCellularHardware(apiClient *utils.APIClient) http.HandlerFunc {
	return FetchWithUUID(apiClient, "dataservice/device/cellularEiolte/hardware")
}

// FetchCellularRadio returns radio/signal information (key endpoint for LTE status)
func FetchCellularRadio(apiClient *utils.APIClient) http.HandlerFunc {
	return FetchWithUUID(apiClient, "dataservice/device/cellularEiolte/radio")
}

// FetchCellularTransport returns transport connection info
func FetchCellularTransport(apiClient *utils.APIClient) http.HandlerFunc {
	return FetchWithUUID(apiClient, "dataservice/device/transport/connection")
}

// FetchCellularStatus returns aggregated cellular status with hierarchical loading
// This is the primary endpoint - checks multiple sources to detect cellular interfaces
func FetchCellularStatus(apiClient *utils.APIClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		systemIP := mux.Vars(r)["system-ip"]
		dev := requireDevice(apiClient, w, systemIP)
		if dev == nil {
			return // Error already written
		}

		status := CellularStatus{
			HasCellular: false,
			IsConnected: false,
			Interfaces:  []CellularInterface{},
		}

		var wg sync.WaitGroup
		var mu sync.Mutex

		// Track which sources found cellular data
		var foundRadio, foundConnection, foundInterface bool

		// Source 1: Check cellularEiolte/radio (most reliable for Catalyst SD-WAN)
		wg.Add(1)
		go func() {
			defer wg.Done()
			endpoint := fmt.Sprintf("dataservice/device/cellularEiolte/radio?deviceId=%s", systemIP)
			data, err := apiClient.Get(endpoint)
			if err != nil {
				log.Printf("📱 Radio fetch error: %v", err)
				return
			}

			var env struct {
				Data []json.RawMessage `json:"data"`
			}
			if err := json.Unmarshal(data, &env); err != nil || len(env.Data) == 0 {
				return
			}

			mu.Lock()
			defer mu.Unlock()
			foundRadio = true
			status.HasCellular = true
			status.Radio = env.Data

			// Parse radio data for interface info
			for _, raw := range env.Data {
				log.Printf("📱 Raw radio data: %s", string(raw))

				var radio struct {
					Interface    string `json:"cellular-interface-name"`
					IfName       string `json:"if-name"`
					RadioStatus  string `json:"Radio-Status"`
					RATSelected  string `json:"RAT-Selected"`
					LTEBand      int    `json:"LTE-Band"`
					LTEBandwidth string `json:"LTE-Bandwidth"`
					RSSI         string `json:"RSSI"`
					RSRP         string `json:"RSRP"`
					RSRQ         string `json:"RSRQ"`
					SNR          string `json:"SNR"`
					ModemIndex   string `json:"modem-index"`
				}
				if json.Unmarshal(raw, &radio) == nil {
					ifName := radio.Interface
					if ifName == "" {
						ifName = radio.IfName
					}

					// Radio is up if status indicates active
					radioUp := strings.EqualFold(radio.RadioStatus, "up") ||
						strings.EqualFold(radio.RadioStatus, "online") ||
						strings.EqualFold(radio.RadioStatus, "active") ||
						strings.Contains(strings.ToLower(radio.RadioStatus), "connected")

					// Also consider it up if we have signal data
					hasSignal := radio.RSSI != "" || radio.RSRP != "" || radio.SNR != ""

					isConnected := radioUp || hasSignal

					log.Printf("📱 Radio %s: status=%s, RAT=%s, band=%d, RSSI=%s, RSRP=%s → connected=%v",
						ifName, radio.RadioStatus, radio.RATSelected, radio.LTEBand, radio.RSSI, radio.RSRP, isConnected)

					if isConnected {
						status.IsConnected = true
					}

					// Calculate signal bars from RSRP (preferred) or RSSI
					signalBars := calculateSignalBars(radio.RSRP, radio.RSSI)

					// Build band string
					band := ""
					if radio.LTEBand > 0 {
						band = fmt.Sprintf("B%d", radio.LTEBand)
						if radio.LTEBandwidth != "" {
							band += " " + radio.LTEBandwidth
						}
					}

					// Check if we already have this interface
					found := false
					for i := range status.Interfaces {
						if status.Interfaces[i].Name == ifName {
							// Update existing
							status.Interfaces[i].RadioStatus = radio.RadioStatus
							status.Interfaces[i].RadioMode = radio.RATSelected
							status.Interfaces[i].Band = band
							status.Interfaces[i].RSSI = radio.RSSI
							status.Interfaces[i].RSRP = radio.RSRP
							status.Interfaces[i].RSRQ = radio.RSRQ
							status.Interfaces[i].SNR = radio.SNR
							status.Interfaces[i].SignalBars = signalBars
							if isConnected {
								status.Interfaces[i].IsConnected = true
							}
							found = true
							break
						}
					}
					if !found && ifName != "" {
						status.Interfaces = append(status.Interfaces, CellularInterface{
							Name:        ifName,
							IsConnected: isConnected,
							SignalBars:  signalBars,
							RadioMode:   radio.RATSelected,
							RadioStatus: radio.RadioStatus,
							Band:        band,
							RSSI:        radio.RSSI,
							RSRP:        radio.RSRP,
							RSRQ:        radio.RSRQ,
							SNR:         radio.SNR,
						})
					}
				}
			}
		}()

		// Source 2: Check cellular/connection (traditional endpoint)
		wg.Add(1)
		go func() {
			defer wg.Done()
			endpoint := fmt.Sprintf("dataservice/device/cellular/connection?deviceId=%s", systemIP)
			data, err := apiClient.Get(endpoint)
			if err != nil {
				log.Printf("📱 Connection fetch error: %v", err)
				return
			}

			var env struct {
				Data []json.RawMessage `json:"data"`
			}
			if err := json.Unmarshal(data, &env); err != nil || len(env.Data) == 0 {
				return
			}

			mu.Lock()
			defer mu.Unlock()
			foundConnection = true
			status.HasCellular = true
			status.Connection = env.Data

			for _, raw := range env.Data {
				log.Printf("📱 Raw connection data: %s", string(raw))

				var conn struct {
					Interface       string `json:"if-name"`
					IPAddress       string `json:"ip-address"`
					IPv4Address     string `json:"ipv4-address"`
					SessionState    string `json:"session-state"`
					PacketState     string `json:"pkt-session-status"`
					ConnectionState string `json:"connection-state"`
					DataState       string `json:"data-state"`
					RadioMode       string `json:"radio-mode"`
					RSSI            int    `json:"rssi"`
				}
				if json.Unmarshal(raw, &conn) == nil {
					ipAddr := conn.IPAddress
					if ipAddr == "" {
						ipAddr = conn.IPv4Address
					}

					sessionUp := conn.SessionState == "active" || conn.SessionState == "up" || conn.SessionState == "connected"
					packetUp := conn.PacketState == "active" || conn.PacketState == "up"
					connUp := conn.ConnectionState == "active" || conn.ConnectionState == "up" || conn.ConnectionState == "connected"
					dataUp := conn.DataState == "active" || conn.DataState == "up" || conn.DataState == "connected"
					hasIP := ipAddr != "" && ipAddr != "0.0.0.0"

					isConn := sessionUp || packetUp || connUp || dataUp || hasIP

					if isConn {
						status.IsConnected = true
					}

					signalBars := 0
					if conn.RSSI >= -65 {
						signalBars = 5
					} else if conn.RSSI >= -75 {
						signalBars = 4
					} else if conn.RSSI >= -85 {
						signalBars = 3
					} else if conn.RSSI >= -95 {
						signalBars = 2
					} else if conn.RSSI >= -105 {
						signalBars = 1
					}

					// Check if we already have this interface
					found := false
					for i := range status.Interfaces {
						if status.Interfaces[i].Name == conn.Interface {
							status.Interfaces[i].IPAddress = ipAddr
							if isConn {
								status.Interfaces[i].IsConnected = true
							}
							if status.Interfaces[i].SignalBars == 0 {
								status.Interfaces[i].SignalBars = signalBars
							}
							if status.Interfaces[i].RadioMode == "" {
								status.Interfaces[i].RadioMode = conn.RadioMode
							}
							found = true
							break
						}
					}
					if !found && conn.Interface != "" {
						status.Interfaces = append(status.Interfaces, CellularInterface{
							Name:        conn.Interface,
							IPAddress:   ipAddr,
							IsConnected: isConn,
							SignalBars:  signalBars,
							RadioMode:   conn.RadioMode,
						})
					}
				}
			}
		}()

		// Source 3: Check device interfaces for Cellular* interfaces
		wg.Add(1)
		go func() {
			defer wg.Done()
			endpoint := fmt.Sprintf("dataservice/device/interface?deviceId=%s", systemIP)
			data, err := apiClient.Get(endpoint)
			if err != nil {
				log.Printf("📱 Interface fetch error: %v", err)
				return
			}

			var env struct {
				Data []json.RawMessage `json:"data"`
			}
			if err := json.Unmarshal(data, &env); err != nil {
				return
			}

			mu.Lock()
			defer mu.Unlock()

			for _, raw := range env.Data {
				var iface struct {
					IfName        string `json:"ifname"`
					IfOperStatus  string `json:"if-oper-status"`
					IfAdminStatus string `json:"if-admin-status"`
					IPAddress     string `json:"ip-address"`
					VpnID         string `json:"vpn-id"`
				}
				if json.Unmarshal(raw, &iface) == nil {
					// Check if this is a Cellular interface
					if strings.HasPrefix(iface.IfName, "Cellular") ||
						strings.HasPrefix(iface.IfName, "cellular") ||
						strings.Contains(iface.IfName, "LTE") ||
						strings.Contains(iface.IfName, "lte") {

						log.Printf("📱 Found cellular interface: %s, status=%s, IP=%s",
							iface.IfName, iface.IfOperStatus, iface.IPAddress)

						foundInterface = true
						status.HasCellular = true

						isUp := strings.Contains(strings.ToLower(iface.IfOperStatus), "up") ||
							strings.Contains(strings.ToLower(iface.IfOperStatus), "ready")

						if isUp {
							status.IsConnected = true
						}

						// Check if we already have this interface
						found := false
						for i := range status.Interfaces {
							if status.Interfaces[i].Name == iface.IfName {
								if iface.IPAddress != "" {
									status.Interfaces[i].IPAddress = iface.IPAddress
								}
								if isUp {
									status.Interfaces[i].IsConnected = true
								}
								found = true
								break
							}
						}
						if !found {
							status.Interfaces = append(status.Interfaces, CellularInterface{
								Name:        iface.IfName,
								IPAddress:   iface.IPAddress,
								IsConnected: isUp,
							})
						}
					}
				}
			}
		}()

		wg.Wait()

		// If we found cellular, fetch additional details
		if status.HasCellular && status.IsConnected {
			var wg2 sync.WaitGroup

			// Fetch hardware info
			wg2.Add(1)
			go func() {
				defer wg2.Done()
				endpoint := fmt.Sprintf("dataservice/device/cellularEiolte/hardware?deviceId=%s", systemIP)
				data, err := apiClient.Get(endpoint)
				if err != nil {
					return
				}
				var env struct {
					Data []json.RawMessage `json:"data"`
				}
				if json.Unmarshal(data, &env) == nil && len(env.Data) > 0 {
					mu.Lock()
					status.Hardware = env.Data

					// Extract carrier info
					for _, raw := range env.Data {
						var hw struct {
							Interface string `json:"if-name"`
							Carrier   string `json:"carrier"`
						}
						if json.Unmarshal(raw, &hw) == nil {
							for i := range status.Interfaces {
								if status.Interfaces[i].Name == hw.Interface || status.Interfaces[i].Carrier == "" {
									status.Interfaces[i].Carrier = hw.Carrier
								}
							}
						}
					}
					mu.Unlock()
				}
			}()

			// Fetch session info
			wg2.Add(1)
			go func() {
				defer wg2.Done()
				endpoint := fmt.Sprintf("dataservice/device/cellularEiolte/connections?deviceId=%s", systemIP)
				data, err := apiClient.Get(endpoint)
				if err != nil {
					return
				}
				var env struct {
					Data []json.RawMessage `json:"data"`
				}
				if json.Unmarshal(data, &env) == nil && len(env.Data) > 0 {
					mu.Lock()
					status.Session = env.Data
					mu.Unlock()
				}
			}()

			wg2.Wait()
		}

		log.Printf("📱 Cellular status for %s: hasCellular=%v, isConnected=%v, interfaces=%d (sources: radio=%v, conn=%v, iface=%v)",
			systemIP, status.HasCellular, status.IsConnected, len(status.Interfaces), foundRadio, foundConnection, foundInterface)

		writeJSON(w, status)
	}
}

// calculateSignalBars converts RSRP or RSSI string to signal bars (0-5)
func calculateSignalBars(rsrp, rssi string) int {
	// Try RSRP first (preferred for LTE)
	if rsrp != "" {
		var val int
		if _, err := fmt.Sscanf(rsrp, "%d", &val); err == nil {
			if val >= -80 {
				return 5
			} else if val >= -90 {
				return 4
			} else if val >= -100 {
				return 3
			} else if val >= -110 {
				return 2
			} else if val >= -120 {
				return 1
			}
			return 0
		}
	}

	// Fall back to RSSI
	if rssi != "" {
		var val int
		if _, err := fmt.Sscanf(rssi, "%d", &val); err == nil {
			if val >= -65 {
				return 5
			} else if val >= -75 {
				return 4
			} else if val >= -85 {
				return 3
			} else if val >= -95 {
				return 2
			} else if val >= -105 {
				return 1
			}
			return 0
		}
	}

	return 0
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
