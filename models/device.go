// Package models contains shared data structures used across the application.
// These types represent vManage API responses and internal data models.
package models

// Device represents a device record from vManage /dataservice/device API.
// This is the canonical representation used throughout the application.
type Device struct {
	SystemIP           string `json:"system-ip"`
	HostName           string `json:"host-name"`
	UUID               string `json:"uuid"`
	DeviceID           string `json:"deviceId"`
	DeviceType         string `json:"device-type"`
	Personality        string `json:"personality"`
	Model              string `json:"device-model"`
	SiteID             string `json:"site-id"`
	Reachability       string `json:"reachability"`
	Status             string `json:"status"`
	DeviceOS           string `json:"device-os"`
	Version            string `json:"version"`
	Template           string `json:"template"`
	TemplateID         string `json:"templateId"`
	CertificateValidity string `json:"certificate-validity"`
	ControlConnections string `json:"controlConnections"`
	UptimeDate         int64  `json:"uptime-date"`
	BoardSerial        string `json:"board-serial"`
	PlatformFamily     string `json:"platform-family"`
}

// IsReachable returns true if the device is currently reachable.
func (d *Device) IsReachable() bool {
	return d.Reachability == "reachable"
}

// IsController returns true if the device is a controller (vManage, vSmart, vBond).
func (d *Device) IsController() bool {
	return d.IsVManage() || d.IsVSmart() || d.IsVBond()
}

// IsVManage returns true if the device is a vManage controller.
func (d *Device) IsVManage() bool {
	return containsIgnoreCase(d.DeviceType, "vmanage") || containsIgnoreCase(d.Personality, "vmanage")
}

// IsVSmart returns true if the device is a vSmart controller.
func (d *Device) IsVSmart() bool {
	return containsIgnoreCase(d.DeviceType, "vsmart") || containsIgnoreCase(d.Personality, "vsmart")
}

// IsVBond returns true if the device is a vBond orchestrator.
func (d *Device) IsVBond() bool {
	return containsIgnoreCase(d.DeviceType, "vbond") || containsIgnoreCase(d.Personality, "vbond")
}

// IsCEdge returns true if the device is a Cisco IOS-XE SD-WAN router.
func (d *Device) IsCEdge() bool {
	return containsIgnoreCase(d.DeviceType, "cedge") ||
		containsIgnoreCase(d.Model, "c8") ||
		containsIgnoreCase(d.Model, "isr") ||
		containsIgnoreCase(d.Model, "asr")
}

// IsVEdge returns true if the device is a Viptela vEdge router.
func (d *Device) IsVEdge() bool {
	return containsIgnoreCase(d.DeviceType, "vedge") || containsIgnoreCase(d.Personality, "vedge")
}

// RoleType returns a normalized role string for the device.
func (d *Device) RoleType() string {
	if d.IsVManage() {
		return "vmanage"
	}
	if d.IsVSmart() {
		return "vsmart"
	}
	if d.IsVBond() {
		return "vbond"
	}
	if d.IsCEdge() {
		return "cedge"
	}
	if d.IsVEdge() {
		return "vedge"
	}
	return "edge"
}

// DeviceDetails is the enriched device information returned by the API.
type DeviceDetails struct {
	SystemIP           string `json:"systemIp"`
	HostName           string `json:"hostName"`
	DeviceID           string `json:"deviceId"`
	DeviceModel        string `json:"deviceModel"`
	SiteID             string `json:"siteId"`
	Reachability       string `json:"reachability"`
	Status             string `json:"status"`
	DeviceOS           string `json:"deviceOs"`
	Template           string `json:"template"`
	TemplateID         string `json:"templateId"`
	CertValidity       string `json:"certValidity"`
	ControlConnections string `json:"controlConnections"`
	UptimeDate         int64  `json:"uptimeDate"`
}

// FromDevice creates DeviceDetails from a Device record.
func (d *Device) ToDetails() DeviceDetails {
	return DeviceDetails{
		SystemIP:           d.SystemIP,
		HostName:           d.HostName,
		DeviceID:           d.DeviceID,
		DeviceModel:        d.Model,
		SiteID:             d.SiteID,
		Reachability:       d.Reachability,
		Status:             d.Status,
		DeviceOS:           d.DeviceOS,
		Template:           d.Template,
		TemplateID:         d.TemplateID,
		CertValidity:       d.CertificateValidity,
		ControlConnections: d.ControlConnections,
		UptimeDate:         d.UptimeDate,
	}
}

// containsIgnoreCase checks if s contains substr (case-insensitive).
func containsIgnoreCase(s, substr string) bool {
	if s == "" || substr == "" {
		return false
	}
	// Simple lowercase comparison
	sLower := toLower(s)
	substrLower := toLower(substr)
	for i := 0; i <= len(sLower)-len(substrLower); i++ {
		if sLower[i:i+len(substrLower)] == substrLower {
			return true
		}
	}
	return false
}

// toLower converts ASCII characters to lowercase.
func toLower(s string) string {
	b := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		b[i] = c
	}
	return string(b)
}
