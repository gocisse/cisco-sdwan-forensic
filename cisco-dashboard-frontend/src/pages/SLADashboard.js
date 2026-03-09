import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useApiFetch from "../hooks/useApiFetch";
import useSSE from "../hooks/useSSE";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDeviceContext } from "../context/DeviceContext";
import DeviceSelector from "../components/DeviceSelector";

function SLADashboard() {
  const { systemIp: urlSystemIp } = useParams();
  const navigate = useNavigate();
  const { selectedDevice } = useDeviceContext();
  const [activeTab, setActiveTab] = useState("app-route");
  const [sortConfig, setSortConfig] = useState({ key: "slaStatus", dir: "desc" });

  const activeIp =
    urlSystemIp || (selectedDevice ? selectedDevice["system-ip"] : null);

  // ─── REST fetch (initial load) ───────────────────────────────────────
  const appRouteUrl = activeIp ? `/api/device/${activeIp}/app-route` : null;
  const {
    data: appRouteData,
    isLoading: appRouteLoading,
    error: appRouteError,
  } = useApiFetch(appRouteUrl);

  const tunnelUrl = activeIp ? `/api/device/${activeIp}/tunnel-health` : null;
  const {
    data: tunnelData,
    isLoading: tunnelLoading,
    error: tunnelError,
  } = useApiFetch(tunnelUrl);

  // ─── SSE live stream (overlays REST data for app-route) ──────────────
  const sseUrl = activeIp ? `/events/app-route?system-ip=${activeIp}` : null;
  const { data: liveFlows, isConnected: sseConnected } = useSSE(sseUrl);

  const isLoading = appRouteLoading || tunnelLoading;

  // Merge: prefer live SSE data when available, fallback to REST
  const flows = useMemo(() => {
    if (liveFlows && Array.isArray(liveFlows) && liveFlows.length > 0) {
      return liveFlows;
    }
    return appRouteData?.flows || [];
  }, [liveFlows, appRouteData]);

  // Sort flows
  const sortedFlows = useMemo(() => {
    const arr = [...flows];
    const statusOrder = { CRITICAL: 0, WARNING: 1, OK: 2 };
    arr.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === "slaStatus") {
        aVal = statusOrder[aVal] ?? 3;
        bVal = statusOrder[bVal] ?? 3;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.dir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || "");
      const bStr = String(bVal || "");
      return sortConfig.dir === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
    return arr;
  }, [flows, sortConfig]);

  const tunnels = tunnelData?.tunnels || [];

  const sortedTunnels = useMemo(() => {
    const arr = [...tunnels];
    const statusOrder = { CRITICAL: 0, WARNING: 1, OK: 2 };
    arr.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === "slaStatus") {
        aVal = statusOrder[aVal] ?? 3;
        bVal = statusOrder[bVal] ?? 3;
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.dir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || "");
      const bStr = String(bVal || "");
      return sortConfig.dir === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
    return arr;
  }, [tunnels, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  };

  const handleDeviceSelect = (ip) => {
    navigate(`/sla-dashboard/${ip}`);
  };

  // Counts
  const appCritical = appRouteData?.criticalCount ?? 0;
  const appWarning = appRouteData?.warningCount ?? 0;
  const appOk = appRouteData?.okCount ?? 0;
  const tunCritical = tunnelData?.criticalCount ?? 0;
  const tunWarning = tunnelData?.warningCount ?? 0;
  const tunOk = tunnelData?.okCount ?? 0;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, color: "#333" }}>SLA &amp; Traffic Analysis</h1>
          {sseConnected && (
            <span style={{ fontSize: "0.75rem", color: "#2e7d32", fontWeight: 600 }}>
              ● Live streaming
            </span>
          )}
        </div>
        <DeviceSelector onSelect={handleDeviceSelect} />
      </div>

      {!activeIp && (
        <div style={emptyState}>
          <p style={{ fontSize: "1.1rem", color: "#666" }}>
            Select a device above to view SLA and traffic analysis, or click a device on the{" "}
            <Link to="/" style={{ color: "#1A73E8" }}>Dashboard</Link>.
          </p>
        </div>
      )}

      {isLoading && <LoadingSpinner message="Fetching traffic data..." />}

      {(appRouteError || tunnelError) && (
        <div style={errorBox}>
          {appRouteError && <p>App-route error: {appRouteError}</p>}
          {tunnelError && <p>Tunnel health error: {tunnelError}</p>}
        </div>
      )}

      {activeIp && !isLoading && (
        <>
          {/* Summary Cards */}
          <div style={summaryGrid}>
            <SummaryCard title="App-Route Flows" total={appRouteData?.totalFlows ?? 0} critical={appCritical} warning={appWarning} ok={appOk} />
            <SummaryCard title="Tunnel Health" total={tunnelData?.totalTunnels ?? 0} critical={tunCritical} warning={tunWarning} ok={tunOk} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0", marginBottom: "1rem", borderBottom: "2px solid #e0e0e0" }}>
            <TabButton label="App-Route SLA" active={activeTab === "app-route"} onClick={() => setActiveTab("app-route")} />
            <TabButton label="Tunnel Health" active={activeTab === "tunnel"} onClick={() => setActiveTab("tunnel")} />
          </div>

          {/* App-Route Table */}
          {activeTab === "app-route" && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <SortTh label="Status" field="slaStatus" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Source IP" field="srcIp" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Dest IP" field="dstIp" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Application" field="application" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Local Color" field="localColor" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Remote Color" field="remoteColor" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Latency (ms)" field="latency" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Loss (%)" field="loss" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Jitter (ms)" field="jitter" sortConfig={sortConfig} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {sortedFlows.length > 0 ? (
                    sortedFlows.map((f, i) => (
                      <tr key={i} style={rowStyle(f.slaStatus)}>
                        <td style={cellStyle}><StatusBadge status={f.slaStatus} /></td>
                        <td style={cellStyle}>{f.srcIp || f["src-ip"]}</td>
                        <td style={cellStyle}>{f.dstIp || f["dst-ip"]}</td>
                        <td style={cellStyle}>{f.application || f["app-probe-class-name"] || "—"}</td>
                        <td style={cellStyle}>{f.localColor || f["local-color"]}</td>
                        <td style={cellStyle}>{f.remoteColor || f["remote-color"]}</td>
                        <td style={cellStyle}>{formatNum(f.latency)}</td>
                        <td style={cellStyle}>{formatNum(f.loss)}</td>
                        <td style={cellStyle}>{formatNum(f.jitter)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={9} style={{ ...cellStyle, textAlign: "center", color: "#999" }}>No app-route data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tunnel Health Table */}
          {activeTab === "tunnel" && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <SortTh label="Status" field="slaStatus" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Source IP" field="srcIp" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Dest IP" field="dstIp" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Local Color" field="localColor" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Remote Color" field="remoteColor" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="State" field="state" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="TX Packets" field="txPackets" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="RX Packets" field="rxPackets" sortConfig={sortConfig} onSort={handleSort} />
                    <SortTh label="Loss (%)" field="lossPercentage" sortConfig={sortConfig} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {sortedTunnels.length > 0 ? (
                    sortedTunnels.map((t, i) => (
                      <tr key={i} style={rowStyle(t.slaStatus)}>
                        <td style={cellStyle}><StatusBadge status={t.slaStatus} /></td>
                        <td style={cellStyle}>{t.srcIp}</td>
                        <td style={cellStyle}>{t.dstIp}</td>
                        <td style={cellStyle}>{t.localColor}</td>
                        <td style={cellStyle}>{t.remoteColor}</td>
                        <td style={cellStyle}>{t.state}</td>
                        <td style={cellStyle}>{t.txPackets?.toLocaleString()}</td>
                        <td style={cellStyle}>{t.rxPackets?.toLocaleString()}</td>
                        <td style={cellStyle}>{t.lossPercentage}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={9} style={{ ...cellStyle, textAlign: "center", color: "#999" }}>No tunnel data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ title, total, critical, warning, ok }) {
  return (
    <div style={summaryCardStyle}>
      <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "#555" }}>{title}</h3>
      <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#333" }}>{total}</div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", fontSize: "0.8rem" }}>
        <span style={{ color: "#c62828", fontWeight: 600 }}>● {critical} Critical</span>
        <span style={{ color: "#e65100", fontWeight: 600 }}>● {warning} Warning</span>
        <span style={{ color: "#2e7d32", fontWeight: 600 }}>● {ok} OK</span>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.6rem 1.25rem",
        border: "none",
        borderBottom: active ? "2px solid #1A73E8" : "2px solid transparent",
        backgroundColor: "transparent",
        color: active ? "#1A73E8" : "#666",
        fontWeight: active ? 600 : 400,
        fontSize: "0.9rem",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function SortTh({ label, field, sortConfig, onSort }) {
  const isActive = sortConfig.key === field;
  const arrow = isActive ? (sortConfig.dir === "asc" ? " ▲" : " ▼") : "";
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        ...thStyle,
        cursor: "pointer",
        userSelect: "none",
        color: isActive ? "#1A73E8" : "#555",
      }}
    >
      {label}{arrow}
    </th>
  );
}

function StatusBadge({ status }) {
  const colors = {
    CRITICAL: { bg: "#ffebee", color: "#c62828" },
    WARNING: { bg: "#fff3e0", color: "#e65100" },
    OK: { bg: "#e8f5e9", color: "#2e7d32" },
  };
  const c = colors[status] || colors.OK;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "10px",
        backgroundColor: c.bg,
        color: c.color,
        fontSize: "0.75rem",
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}

function formatNum(val) {
  if (val === undefined || val === null) return "—";
  const n = Number(val);
  if (isNaN(n)) return val;
  return n.toFixed(2);
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

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1rem",
  marginBottom: "1.5rem",
};

const summaryCardStyle = {
  padding: "1.25rem",
  backgroundColor: "#f8f9fa",
  border: "1px solid #dee2e6",
  borderRadius: "8px",
  textAlign: "center",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.85rem",
};

const thStyle = {
  padding: "0.6rem 0.75rem",
  borderBottom: "2px solid #dee2e6",
  textAlign: "left",
  fontSize: "0.8rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const cellStyle = {
  padding: "0.5rem 0.75rem",
  borderBottom: "1px solid #f0f0f0",
  whiteSpace: "nowrap",
};

const rowStyle = (status) => ({
  backgroundColor:
    status === "CRITICAL"
      ? "#fff5f5"
      : status === "WARNING"
      ? "#fffde7"
      : "transparent",
  transition: "background-color 0.3s",
});

export default SLADashboard;
