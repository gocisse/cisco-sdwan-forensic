// src/pages/Alarms.js
import React, { useState, useMemo } from "react";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

function Alarms() {
  const { data: alarms, isLoading, error, refetch } = useApiFetch("/api/alarms");

  // Sorting state
  const [sortKey, setSortKey] = useState("entry_time");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!alarms || !Array.isArray(alarms)) return [];
    return [...alarms].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [alarms, sortKey, sortDir]);

  const columns = [
    { key: "type", label: "Severity" },
    { key: "rule_name_display", label: "Alarm" },
    { key: "component", label: "Component" },
    { key: "system_ip", label: "System IP" },
    { key: "host_name", label: "Hostname" },
    { key: "site_id", label: "Site ID" },
    { key: "entry_time", label: "Time" },
    { key: "acknowledged", label: "Ack" },
    { key: "active", label: "Active" },
  ];

  const severityColor = (type) => {
    switch ((type || "").toLowerCase()) {
      case "critical":
        return "#c62828";
      case "major":
        return "#e65100";
      case "minor":
        return "#f9a825";
      case "warning":
        return "#1565c0";
      default:
        return "#333";
    }
  };

  if (isLoading) return <LoadingSpinner message="Fetching alarms..." />;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, color: "#333" }}>
          Alarms
          {sorted.length > 0 && (
            <span style={{ fontSize: "0.9rem", color: "#888", marginLeft: "0.75rem" }}>
              ({sorted.length} total)
            </span>
          )}
        </h1>
        <button
          onClick={refetch}
          style={{
            padding: "8px 20px",
            backgroundColor: "#1A73E8",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Refresh
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {sorted.length === 0 && !error && (
        <p style={{ color: "#888", textAlign: "center", padding: "2rem" }}>
          No alarms found.
        </p>
      )}

      {sorted.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      ...thStyle,
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{ marginLeft: "4px" }}>
                        {sortDir === "asc" ? "\u25B2" : "\u25BC"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((alarm, index) => (
                <tr
                  key={alarm.uuid || index}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={{ ...tdStyle, color: severityColor(alarm.type), fontWeight: 600 }}>
                    {alarm.type || "N/A"}
                  </td>
                  <td style={tdStyle}>{alarm.rule_name_display || alarm.ruleName || "N/A"}</td>
                  <td style={tdStyle}>{alarm.component || "N/A"}</td>
                  <td style={tdStyle}>{alarm.system_ip || alarm["system-ip"] || "N/A"}</td>
                  <td style={tdStyle}>{alarm.host_name || alarm["host-name"] || "N/A"}</td>
                  <td style={tdStyle}>{alarm.site_id || alarm["site-id"] || "N/A"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    {alarm.entry_time
                      ? new Date(alarm.entry_time).toLocaleString()
                      : "N/A"}
                  </td>
                  <td style={tdStyle}>
                    {alarm.acknowledged ? "Yes" : "No"}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: alarm.active ? "#2e7d32" : "#9e9e9e",
                        marginRight: "6px",
                      }}
                    />
                    {alarm.active ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  border: "1px solid #ddd",
  padding: "10px 12px",
  backgroundColor: "#f5f5f5",
  textAlign: "left",
  fontWeight: 600,
};

const tdStyle = {
  border: "1px solid #eee",
  padding: "8px 12px",
};

export default Alarms;
