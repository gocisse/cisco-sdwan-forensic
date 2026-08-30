package models

// LocalPolicyEntry represents a single policy item running on a device.
type LocalPolicyEntry struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	Direction    string `json:"direction,omitempty"`
	Interface    string `json:"interface,omitempty"`
	Sequence     string `json:"sequence,omitempty"`
	CIR          string `json:"cir,omitempty"`
	Burst        string `json:"burst,omitempty"`
	ExceedAction string `json:"exceedAction,omitempty"`
}

// LocalPolicyResponse is the consolidated response for local policy data.
type LocalPolicyResponse struct {
	SystemIP     string             `json:"systemIp"`
	HostName     string             `json:"hostName"`
	SiteID       string             `json:"siteId"`
	AccessLists  []LocalPolicyEntry `json:"accessLists"`
	QosMaps      []LocalPolicyEntry `json:"qosMaps"`
	Policers     []LocalPolicyEntry `json:"policers"`
	ZoneFirewall []LocalPolicyEntry `json:"zoneFirewall"`
	TotalCount   int                `json:"totalCount"`
}

// PolicySequenceInfo holds simplified sequence match/action info.
type PolicySequenceInfo struct {
	SequenceName string            `json:"sequenceName"`
	SequenceType string            `json:"sequenceType"`
	BaseAction   string            `json:"baseAction"`
	Match        map[string]string `json:"match,omitempty"`
	Actions      map[string]string `json:"actions,omitempty"`
}

// CentralPolicyMatch represents a centralized policy that affects a device.
type CentralPolicyMatch struct {
	PolicyName string               `json:"policyName"`
	PolicyID   string               `json:"policyId"`
	PolicyType string               `json:"policyType"`
	IsActive   bool                 `json:"isActive"`
	Sequences  []PolicySequenceInfo `json:"sequences,omitempty"`
}

// CentralPolicyResponse is the consolidated response for centralized policy data.
type CentralPolicyResponse struct {
	SystemIP        string               `json:"systemIp"`
	HostName        string               `json:"hostName"`
	SiteID          string               `json:"siteId"`
	DataPolicies    []CentralPolicyMatch `json:"dataPolicies"`
	ControlPolicies []CentralPolicyMatch `json:"controlPolicies"`
	AppPolicies     []CentralPolicyMatch `json:"appRoutePolicies"`
	TotalCount      int                  `json:"totalCount"`
}

// PolicyListInfo holds the resolved name and sample entries for a policy list.
type PolicyListInfo struct {
	Name    string   `json:"name"`
	Entries []string `json:"entries"` // first few entries for preview
}

// VSmartPolicy represents a vSmart policy from vManage.
type VSmartPolicy struct {
	PolicyID          string `json:"policyId"`
	PolicyName        string `json:"policyName"`
	PolicyType        string `json:"policyType"`
	IsPolicyActivated bool   `json:"isPolicyActivated"`
	PolicyDefinition  string `json:"policyDefinition"`
}
