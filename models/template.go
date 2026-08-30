package models

// FeatureTemplate represents a feature template attached to a device template.
type FeatureTemplate struct {
	Name         string            `json:"templateName"`
	Type         string            `json:"templateType"`
	Description  string            `json:"templateDescription"`
	TemplateID   string            `json:"templateId"`
	SubTemplates []FeatureTemplate `json:"subTemplates,omitempty"`
}

// TemplateHierarchy represents the full template structure for a device.
type TemplateHierarchy struct {
	DeviceTemplateName string            `json:"deviceTemplateName"`
	DeviceTemplateID   string            `json:"deviceTemplateId"`
	DeviceTemplateDesc string            `json:"deviceTemplateDescription"`
	FeatureTemplates   []FeatureTemplate `json:"featureTemplates"`
}

// DeviceTemplate represents a device template from vManage.
type DeviceTemplate struct {
	TemplateName        string            `json:"templateName"`
	TemplateID          string            `json:"templateId"`
	TemplateDescription string            `json:"templateDescription"`
	DeviceType          string            `json:"deviceType"`
	DevicesAttached     int               `json:"devicesAttached"`
	AttachedDevices     []string          `json:"attached_devices"`
	GeneralTemplates    []FeatureTemplate `json:"generalTemplates"`
}
