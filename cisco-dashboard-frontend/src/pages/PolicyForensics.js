import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDeviceContext } from "../context/DeviceContext";
import DeviceSelector from "../components/DeviceSelector";

function PolicyForensics() {
  const { systemIp: urlSystemIp } = useParams();
  const navigate = useNavigate();
  const { selectedDevice } = useDeviceContext();

  const activeIp =
    urlSystemIp || (selectedDevice ? selectedDevice["system-ip"] : null);

  // Fetch local policies
  const localUrl = activeIp
    ? `/api/device/${activeIp}/policy/local`
    : null;
  const {
    data: localData,
    isLoading: localLoading,
    error: localError,
  } = useApiFetch(localUrl);

  // Fetch centralized policies
  const centralUrl = activeIp
    ? `/api/device/${activeIp}/policy/centralized`
    : null;
  const {
    data: centralData,
    isLoading: centralLoading,
    error: centralError,
  } = useApiFetch(centralUrl);

  const isLoading = localLoading || centralLoading;

  const handleDeviceSelect = (ip) => {
    navigate(`/policy-forensics/${ip}`);
  };

  const localTotal = localData ? localData.totalCount : 0;
  const centralTotal = centralData ? centralData.totalCount : 0;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
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
        <h1 style={{ margin: 0, color: "#333" }}>Policy Forensics</h1>
        <DeviceSelector onSelect={handleDeviceSelect} />
      </div>

      {!activeIp && (
        <div style={emptyState}>
          <p style={{ fontSize: "1.1rem", color: "#666" }}>
            Select a device above to compare its Local vs Centralized policies,
            or click a device on the{" "}
            <Link to="/" style={{ color: "#1A73E8" }}>
              Dashboard
            </Link>
            .
          </p>
        </div>
      )}

      {isLoading && <LoadingSpinner message="Analyzing policies..." />}

      {(localError || centralError) && (
        <div style={errorBox}>
          {localError && <p>Local policy error: {localError}</p>}
          {centralError && <p>Centralized policy error: {centralError}</p>}
        </div>
      )}

      {/* Two-Column Layout */}
      {activeIp && !isLoading && (
        <>
          <div style={twoColumnGrid}>
            {/* LEFT: Local Policies */}
            <div>
              <div style={columnHeader("#e8f5e9", "#2e7d32")}>
                <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
                  Local Policies (Device)
                </h2>
                <span style={{ fontSize: "0.85rem", color: "#555" }}>
                  {localData?.hostName || activeIp} — Site {localData?.siteId || "N/A"}
                </span>
              </div>

              {localData && (
                <div style={{ marginTop: "0.75rem" }}>
                  <PolicySection
                    title="Access Lists"
                    icon="🛡️"
                    items={localData.accessLists}
                    renderItem={(item) => (
                      <div style={itemRow} key={item.name + item.interface}>
                        <strong>{item.name}</strong>
                        <div style={itemMeta}>
                          {item.direction && (
                            <span style={badge("#e3f2fd", "#1565c0")}>
                              {item.direction}
                            </span>
                          )}
                          {item.interface && (
                            <span style={badge("#f3e5f5", "#7b1fa2")}>
                              {item.interface}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  />

                  <PolicySection
                    title="QoS Maps"
                    icon="📊"
                    items={localData.qosMaps}
                    renderItem={(item) => (
                      <div style={itemRow} key={item.name + item.interface}>
                        <strong>{item.name}</strong>
                        <div style={itemMeta}>
                          {item.direction && (
                            <span style={badge("#e3f2fd", "#1565c0")}>
                              {item.direction}
                            </span>
                          )}
                          {item.interface && (
                            <span style={badge("#f3e5f5", "#7b1fa2")}>
                              {item.interface}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  />

                  <PolicySection
                    title="Policers"
                    icon="🚦"
                    items={localData.policers}
                    renderItem={(item) => (
                      <div style={itemRow} key={item.name}>
                        <strong>{item.name}</strong>
                      </div>
                    )}
                  />

                  <PolicySection
                    title="Zone-Based Firewall"
                    icon="🔥"
                    items={localData.zoneFirewall}
                    renderItem={(item) => (
                      <div style={itemRow} key={item.name}>
                        <strong>{item.name}</strong>
                      </div>
                    )}
                  />
                </div>
              )}
            </div>

            {/* RIGHT: Centralized Policies */}
            <div>
              <div style={columnHeader("#e3f2fd", "#1565c0")}>
                <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
                  Centralized Policies (vSmart)
                </h2>
                <span style={{ fontSize: "0.85rem", color: "#555" }}>
                  Policies affecting Site {centralData?.siteId || "N/A"}
                </span>
              </div>

              {centralData && (
                <div style={{ marginTop: "0.75rem" }}>
                  <CentralSection
                    title="Data Policies"
                    icon="📋"
                    policies={centralData.dataPolicies}
                  />
                  <CentralSection
                    title="Control Policies"
                    icon="🔀"
                    policies={centralData.controlPolicies}
                  />
                  <CentralSection
                    title="App-Route Policies"
                    icon="🌐"
                    policies={centralData.appRoutePolicies}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary Banner */}
          <div style={summaryBanner}>
            <p style={{ margin: 0, fontSize: "1rem", color: "#333" }}>
              <strong>Summary:</strong> This device (
              <strong>{localData?.hostName || activeIp}</strong>, Site{" "}
              {localData?.siteId || "N/A"}) is subject to{" "}
              <strong style={{ color: "#1565c0" }}>
                {centralTotal} Centralized{" "}
                {centralTotal === 1 ? "Policy" : "Policies"}
              </strong>{" "}
              and{" "}
              <strong style={{ color: "#2e7d32" }}>
                {localTotal} Local{" "}
                {localTotal === 1 ? "ACL/Rule" : "ACLs/Rules"}
              </strong>
              .
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PolicySection({ title, icon, items, renderItem }) {
  const count = items ? items.length : 0;
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={sectionHeader}>
        <span>
          {icon} <strong>{title}</strong>
        </span>
        <span style={countBadge}>{count}</span>
      </div>
      {count > 0 ? (
        items.map(renderItem)
      ) : (
        <p style={emptyMsg}>No {title.toLowerCase()} found.</p>
      )}
    </div>
  );
}

function CentralSection({ title, icon, policies }) {
  const count = policies ? policies.length : 0;
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={sectionHeader}>
        <span>
          {icon} <strong>{title}</strong>
        </span>
        <span style={countBadge}>{count}</span>
      </div>
      {count > 0 ? (
        policies.map((pol, i) => (
          <div style={centralCard} key={pol.policyId || i}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <strong style={{ fontSize: "0.95rem" }}>{pol.policyName}</strong>
              <span
                style={badge(
                  pol.isActive ? "#e8f5e9" : "#fff3e0",
                  pol.isActive ? "#2e7d32" : "#e65100"
                )}
              >
                {pol.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.4rem" }}>
              Type: <strong>{pol.policyType}</strong>
            </div>
            {pol.sequences && pol.sequences.length > 0 && (
              <div style={sequenceList}>
                {pol.sequences.map((seq, j) => (
                  <div style={sequenceRow} key={j}>
                    <span>{seq.sequenceName || `Sequence ${j + 1}`}</span>
                    <span
                      style={badge(
                        seq.baseAction === "accept" ? "#e8f5e9" : "#ffebee",
                        seq.baseAction === "accept" ? "#2e7d32" : "#c62828"
                      )}
                    >
                      {seq.baseAction || "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <p style={emptyMsg}>No {title.toLowerCase()} affecting this site.</p>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const emptyState = {
  textAlign: "center",
  padding: "3rem 2rem",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  border: "1px dashed #ccc",
};

const errorBox = {
  padding: "1rem",
  color: "#c62828",
  backgroundColor: "#ffebee",
  borderRadius: "6px",
  marginBottom: "1rem",
};

const twoColumnGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1.5rem",
  marginBottom: "1.5rem",
};

const columnHeader = (bg, color) => ({
  padding: "1rem 1.25rem",
  backgroundColor: bg,
  borderRadius: "8px 8px 0 0",
  borderBottom: `2px solid ${color}`,
});

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.6rem 0.75rem",
  backgroundColor: "#fafafa",
  borderRadius: "6px",
  marginBottom: "0.4rem",
  fontSize: "0.9rem",
};

const countBadge = {
  display: "inline-block",
  padding: "1px 10px",
  borderRadius: "10px",
  backgroundColor: "#e0e0e0",
  fontSize: "0.8rem",
  fontWeight: 600,
};

const itemRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.5rem 0.75rem",
  borderBottom: "1px solid #f0f0f0",
  fontSize: "0.88rem",
};

const itemMeta = {
  display: "flex",
  gap: "0.4rem",
};

const badge = (bg, color) => ({
  display: "inline-block",
  padding: "1px 8px",
  borderRadius: "10px",
  backgroundColor: bg,
  color: color,
  fontSize: "0.72rem",
  fontWeight: 600,
});

const centralCard = {
  padding: "0.75rem 1rem",
  margin: "4px 0",
  backgroundColor: "#fff",
  borderRadius: "6px",
  border: "1px solid #e0e0e0",
  borderLeft: "3px solid #1565c0",
};

const sequenceList = {
  marginTop: "0.4rem",
  paddingLeft: "0.5rem",
  borderLeft: "2px solid #e0e0e0",
};

const sequenceRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "3px 0.5rem",
  fontSize: "0.8rem",
};

const emptyMsg = {
  color: "#999",
  fontSize: "0.85rem",
  padding: "0.5rem 0.75rem",
  fontStyle: "italic",
};

const summaryBanner = {
  padding: "1rem 1.5rem",
  backgroundColor: "#f5f5f5",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
  textAlign: "center",
};

export default PolicyForensics;
