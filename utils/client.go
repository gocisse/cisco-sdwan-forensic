package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"sdwan-app/models"
)

// VManageClient defines the interface for interacting with vManage API.
// This interface enables mocking for unit tests.
type VManageClient interface {
	// Get fetches raw JSON data from a vManage endpoint.
	Get(endpoint string) ([]byte, error)

	// GetDevices returns all devices from vManage (cached).
	GetDevices() ([]models.Device, error)

	// GetDevice returns a single device by system-ip (cached).
	GetDevice(systemIP string) (*models.Device, error)

	// GetDeviceUUID returns the UUID for a device by system-ip.
	GetDeviceUUID(systemIP string) (string, error)

	// InvalidateDeviceCache clears the device cache.
	InvalidateDeviceCache()
}

// Ensure APIClient implements VManageClient
var _ VManageClient = (*APIClient)(nil)

// deviceCache holds cached device data with TTL.
// Default TTL is 30 seconds - long enough to avoid hammering vManage
// on page loads, short enough to reflect changes reasonably quickly.
var deviceCache = NewTTLCache[[]models.Device](30 * time.Second)

// deviceMapCache holds a map of system-ip -> Device for fast lookups.
var deviceMapCache = NewTTLCache[map[string]*models.Device](30 * time.Second)

// GetDevices returns all devices from vManage, using cache when available.
func (c *APIClient) GetDevices() ([]models.Device, error) {
	// Check cache first
	if cached, ok := deviceCache.Get(); ok {
		log.Printf("📦 Device cache hit (%d devices)", len(cached))
		return cached, nil
	}

	// Fetch from vManage
	log.Printf("🔄 Fetching devices from vManage (cache miss)...")
	rawData, err := c.Get(EndpointDevices)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch devices: %w", err)
	}

	var envelope struct {
		Data []models.Device `json:"data"`
	}
	if err := json.Unmarshal(rawData, &envelope); err != nil {
		return nil, fmt.Errorf("failed to parse device list: %w", err)
	}

	// Update both caches
	deviceCache.Set(envelope.Data)
	c.updateDeviceMapCache(envelope.Data)

	log.Printf("📦 Device cache populated (%d devices)", len(envelope.Data))
	return envelope.Data, nil
}

// GetDevice returns a single device by system-ip, using cache when available.
func (c *APIClient) GetDevice(systemIP string) (*models.Device, error) {
	// Check map cache first
	if deviceMap, ok := deviceMapCache.Get(); ok {
		if dev, exists := deviceMap[systemIP]; exists {
			return dev, nil
		}
		// Device not in cache - it might not exist
		return nil, nil
	}

	// Cache miss - fetch all devices and rebuild cache
	devices, err := c.GetDevices()
	if err != nil {
		return nil, err
	}

	// Look up the device
	for i := range devices {
		if devices[i].SystemIP == systemIP {
			return &devices[i], nil
		}
	}

	return nil, nil // Device not found
}

// GetDeviceUUID returns the UUID for a device by system-ip.
func (c *APIClient) GetDeviceUUID(systemIP string) (string, error) {
	dev, err := c.GetDevice(systemIP)
	if err != nil {
		return "", err
	}
	if dev == nil {
		return "", fmt.Errorf("device not found: %s", systemIP)
	}
	return dev.UUID, nil
}

// InvalidateDeviceCache clears the device cache.
func (c *APIClient) InvalidateDeviceCache() {
	deviceCache.Invalidate()
	deviceMapCache.Invalidate()
	log.Println("📦 Device cache invalidated")
}

// updateDeviceMapCache builds the system-ip -> Device map cache.
func (c *APIClient) updateDeviceMapCache(devices []models.Device) {
	deviceMap := make(map[string]*models.Device, len(devices))
	for i := range devices {
		deviceMap[devices[i].SystemIP] = &devices[i]
	}
	deviceMapCache.Set(deviceMap)
}

// GetDeviceTemplates returns all device templates from vManage.
func (c *APIClient) GetDeviceTemplates() ([]models.DeviceTemplate, error) {
	rawData, err := c.Get(EndpointDeviceTemplates)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch device templates: %w", err)
	}

	var envelope struct {
		Data []models.DeviceTemplate `json:"data"`
	}
	if err := json.Unmarshal(rawData, &envelope); err != nil {
		return nil, fmt.Errorf("failed to parse device templates: %w", err)
	}

	return envelope.Data, nil
}

// FindTemplateForDevice looks up which device template is attached to a device by UUID.
func (c *APIClient) FindTemplateForDevice(deviceUUID string) (templateName string, templateID string, err error) {
	templates, err := c.GetDeviceTemplates()
	if err != nil {
		return "", "", err
	}

	for _, t := range templates {
		if t.DevicesAttached == 0 {
			continue
		}
		for _, attachedUUID := range t.AttachedDevices {
			if attachedUUID == deviceUUID {
				log.Printf("🔍 Found template for device %s: %q (ID: %s)", deviceUUID, t.TemplateName, t.TemplateID)
				return t.TemplateName, t.TemplateID, nil
			}
		}
	}

	return "", "", nil // No template attached
}

// ResolveTemplateID looks up the device template UUID from vManage by template name.
func (c *APIClient) ResolveTemplateID(templateName string) (string, error) {
	templates, err := c.GetDeviceTemplates()
	if err != nil {
		return "", err
	}

	for _, t := range templates {
		if t.TemplateName == templateName {
			log.Printf("🔍 Resolved template name %q → ID %q", templateName, t.TemplateID)
			return t.TemplateID, nil
		}
	}

	return "", fmt.Errorf("no device template found with name %q", templateName)
}
