import React from "react";
import { useParams, Link } from "react-router-dom";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";

const sections = [
  { label: "BFD Sessions", path: "bfd" },
  { label: "Tunnel Stats", path: "tunnel" },
  { label: "IPSec", path: "ipsec" },
  { label: "Control Plane", path: "control-plane" },
  { label: "Connections", path: "connections" },
  { label: "Advertised Routes", path: "advertised-routes" },
  { label: "Received Routes", path: "received-routes" },
  { label: "Advertised TLOCs", path: "advertised-tlocs" },
  { label: "Received TLOCs", path: "received-tlocs" },
  { label: "App Routes", path: "app-routes" },
  { label: "View Templates", path: "_templates" },
  { label: "Policy Forensics", path: "_forensics" },
  { label: "SLA Dashboard", path: "_sla" },
];

function DeviceDetail() {
  const { systemIp } = useParams();
  const { data: devices, isLoading, error } = useApiFetch("/api/devices");

  // Find the specific device from the full list
  const device = devices
    ? devices.find((d) => d["system-ip"] === systemIp)
    : null;

  if (isLoading) return <LoadingSpinner message="Loading device info..." />;
  if (error) return <p style={{ color: "red", padding: "2rem" }}>Error: {error}</p>;
  if (!device)
    return (
      <p style={{ padding: "2rem", textAlign: "center" }}>
        Device <strong>{systemIp}</strong> not found.{" "}
        <Link to="/">Back to Dashboard</Link>
      </p>
    );

  const isReachable =
    (device["reachability"] || "").toLowerCase() === "reachable";

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <p style={{ marginBottom: "1rem", color: "#666" }}>
        <Link to="/" style={{ color: "#1A73E8", textDecoration: "none" }}>
          Dashboard
        </Link>{" "}
        / <strong>{device["host-name"] || systemIp}</strong>
      </p>

      {/* Device Info Card */}
      <div
        style={{
          backgroundColor: isReachable ? "#E6FFEB" : "#FFEDED",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <h1 style={{ margin: "0 0 1rem 0", fontSize: "1.5rem" }}>
          {device["host-name"] || "Unnamed Device"}
          <span
            style={{
              marginLeft: "1rem",
              fontSize: "0.85rem",
              color: isReachable ? "#2e7d32" : "#c62828",
            }}
          >
            {isReachable ? "● Reachable" : "● Unreachable"}
          </span>
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.5rem",
          }}
        >
          <InfoItem label="System IP" value={device["system-ip"]} />
          <InfoItem label="Device ID" value={device["deviceId"]} />
          <InfoItem label="Device Model" value={device["device-model"]} />
          <InfoItem label="Site ID" value={device["site-id"]} />
          <InfoItem label="Status" value={device["status"]} />
          <InfoItem label="State" value={device["state"]} />
          <InfoItem
            label="Control Connections"
            value={device["controlConnections"]}
          />
          <InfoItem label="Device OS" value={device["device-os"]} />
          <InfoItem
            label="Certificate"
            value={device["certificate-validity"]}
          />
          <InfoItem
            label="Uptime"
            value={
              device["uptime-date"]
                ? new Date(device["uptime-date"]).toLocaleString()
                : "N/A"
            }
          />
        </div>
      </div>

      {/* Quick Navigation Grid */}
      <h2 style={{ marginBottom: "1rem", color: "#333" }}>
        Real-Time Data for {systemIp}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {sections.map((s) => (
          <Link
            key={s.path}
            to={s.path === "_templates" ? `/templates/${systemIp}` : s.path === "_forensics" ? `/policy-forensics/${systemIp}` : s.path === "_sla" ? `/sla-dashboard/${systemIp}` : `/realtime/${s.path}/${systemIp}`}
            style={{
              display: "block",
              padding: "1rem 1.25rem",
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              textDecoration: "none",
              color: "#333",
              fontWeight: 500,
              textAlign: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1A73E8";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "#1A73E8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
              e.currentTarget.style.color = "#333";
              e.currentTarget.style.borderColor = "#dee2e6";
            }}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <p style={{ margin: "0.2rem 0" }}>
      <strong style={{ color: "#555" }}>{label}:</strong>{" "}
      {value || "N/A"}
    </p>
  );
}

export default DeviceDetail;
