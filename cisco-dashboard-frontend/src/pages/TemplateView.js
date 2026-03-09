import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDeviceContext } from "../context/DeviceContext";
import DeviceSelector from "../components/DeviceSelector";

function TemplateView() {
  const { systemIp: urlSystemIp } = useParams();
  const navigate = useNavigate();
  const { selectedDevice } = useDeviceContext();

  const activeIp = urlSystemIp || (selectedDevice ? selectedDevice["system-ip"] : null);

  // Fetch device details
  const detailsUrl = activeIp ? `/api/device/${activeIp}/details` : null;
  const {
    data: details,
    isLoading: detailsLoading,
    error: detailsError,
  } = useApiFetch(detailsUrl);

  // Fetch template hierarchy
  const templatesUrl = activeIp ? `/api/device/${activeIp}/templates` : null;
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useApiFetch(templatesUrl);

  const isLoading = detailsLoading || templatesLoading;

  const handleDeviceSelect = (ip) => {
    navigate(`/templates/${ip}`);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header with device selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0, color: "#333" }}>Template Hierarchy</h1>
        <DeviceSelector onSelect={handleDeviceSelect} />
      </div>

      {!activeIp && (
        <div style={emptyState}>
          <p style={{ fontSize: "1.1rem", color: "#666" }}>
            Select a device above to view its template hierarchy, or click a
            device on the{" "}
            <Link to="/" style={{ color: "#1A73E8" }}>
              Dashboard
            </Link>
            .
          </p>
        </div>
      )}

      {isLoading && <LoadingSpinner message="Loading template data..." />}

      {(detailsError || templatesError) && (
        <div style={{ padding: "1rem", color: "#c62828", backgroundColor: "#ffebee", borderRadius: "6px", marginBottom: "1rem" }}>
          {detailsError && <p>Device error: {detailsError}</p>}
          {templatesError && <p>Template error: {templatesError}</p>}
        </div>
      )}

      {/* Device Info Summary */}
      {details && !isLoading && (
        <div style={deviceCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
              {details.hostName || "Unnamed Device"}
            </h2>
            <span
              style={{
                fontSize: "0.8rem",
                padding: "3px 10px",
                borderRadius: "12px",
                backgroundColor: details.reachability === "reachable" ? "#e8f5e9" : "#ffebee",
                color: details.reachability === "reachable" ? "#2e7d32" : "#c62828",
                fontWeight: 600,
              }}
            >
              {details.reachability || "unknown"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.4rem", fontSize: "0.9rem" }}>
            <InfoItem label="System IP" value={details.systemIp} />
            <InfoItem label="Model" value={details.deviceModel} />
            <InfoItem label="Site ID" value={details.siteId} />
            <InfoItem label="OS" value={details.deviceOs} />
            <InfoItem label="Template" value={details.template} />
            <InfoItem label="Template ID" value={details.templateId} />
          </div>
        </div>
      )}

      {/* Template Hierarchy Tree */}
      {templates && !isLoading && (
        <div style={{ marginTop: "1.5rem" }}>
          {/* Device Template Header */}
          <div style={templateHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={iconStyle}>📦</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                  {templates.deviceTemplateName}
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#666" }}>
                  Device Template
                  {templates.deviceTemplateDescription && ` — ${templates.deviceTemplateDescription}`}
                </p>
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#888" }}>
              {templates.featureTemplates?.length || 0} feature templates
            </span>
          </div>

          {/* Feature Templates List */}
          {templates.featureTemplates && templates.featureTemplates.length > 0 ? (
            <div style={{ marginTop: "0.5rem" }}>
              {templates.featureTemplates.map((ft, i) => (
                <FeatureTemplateCard key={ft.templateId || i} template={ft} depth={0} />
              ))}
            </div>
          ) : (
            <p style={{ color: "#888", textAlign: "center", padding: "2rem" }}>
              No feature templates attached to this device template.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FeatureTemplateCard({ template, depth }) {
  const [expanded, setExpanded] = useState(true);
  const hasSubs = template.subTemplates && template.subTemplates.length > 0;

  return (
    <div style={{ marginLeft: depth > 0 ? "1.5rem" : 0 }}>
      <div
        style={{
          ...featureCardStyle,
          borderLeftColor: depth === 0 ? "#1A73E8" : "#90CAF9",
          cursor: hasSubs ? "pointer" : "default",
        }}
        onClick={() => hasSubs && setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
          <span style={{ fontSize: "1rem" }}>
            {hasSubs ? (expanded ? "▾" : "▸") : "•"}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "0.95rem" }}>{template.templateName}</strong>
              <span style={typeBadge}>{template.templateType}</span>
            </div>
            {template.templateDescription && (
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#777" }}>
                {template.templateDescription}
              </p>
            )}
          </div>
        </div>
        {hasSubs && (
          <span style={{ fontSize: "0.75rem", color: "#999", whiteSpace: "nowrap" }}>
            {template.subTemplates.length} sub
          </span>
        )}
      </div>
      {hasSubs && expanded && (
        <div>
          {template.subTemplates.map((st, j) => (
            <FeatureTemplateCard key={st.templateId || j} template={st} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <p style={{ margin: "0.15rem 0" }}>
      <strong style={{ color: "#555" }}>{label}:</strong>{" "}
      {value || "N/A"}
    </p>
  );
}

const emptyState = {
  textAlign: "center",
  padding: "3rem 2rem",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  border: "1px dashed #ccc",
};

const deviceCard = {
  backgroundColor: "#f8f9fa",
  border: "1px solid #dee2e6",
  borderRadius: "8px",
  padding: "1.25rem",
};

const templateHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1rem 1.25rem",
  backgroundColor: "#e3f2fd",
  borderRadius: "8px",
  border: "1px solid #bbdefb",
};

const iconStyle = {
  fontSize: "1.5rem",
};

const featureCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.75rem 1rem",
  margin: "4px 0",
  backgroundColor: "#fff",
  borderRadius: "6px",
  border: "1px solid #e0e0e0",
  borderLeft: "3px solid #1A73E8",
  transition: "background-color 0.15s",
};

const typeBadge = {
  display: "inline-block",
  padding: "1px 8px",
  borderRadius: "10px",
  backgroundColor: "#e8eaf6",
  color: "#3949ab",
  fontSize: "0.72rem",
  fontWeight: 600,
};

export default TemplateView;
