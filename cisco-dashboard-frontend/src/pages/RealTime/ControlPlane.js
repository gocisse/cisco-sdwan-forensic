import React from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Alert } from "@mui/material";
import useApiFetch from "../../hooks/useApiFetch";
import DataTable from "../../components/DataTable";
import DeviceSelector from "../../components/DeviceSelector";
import LoadingSpinner from "../../components/LoadingSpinner";

const columns = [
  { field: "vdevice-name", label: "Device" },
  { field: "peer", label: "Peer" },
  { field: "state", label: "State" },
  { field: "type", label: "Type" },
  { field: "site-id", label: "Site ID" },
  { field: "domain-id", label: "Domain ID" },
  { field: "uptime", label: "Uptime" },
  { field: "lastupdated", label: "Last Updated" },
];

// vManage control/synced/connections returns fields in various naming
// conventions (kebab-case, camelCase, or mixed). Normalize every row
// so the DataTable columns always find data.
function normalize(row) {
  return {
    ...row,
    "peer":         row["peer"] || row["peer-system-ip"] || row["peerSystemIp"] || row["system-ip"] || row["systemIp"] || "N/A",
    "type":         row["type"] || row["peer-type"] || row["peerType"] || "N/A",
    "uptime":       row["uptime"] || row["up-time"] || row["upTime"] || row["uptimeDate"] || row["lastupdated"] || "N/A",
    "vdevice-name": row["vdevice-name"] || row["vdeviceName"] || row["host-name"] || row["hostName"] || row["vdevice-host-name"] || "N/A",
    "state":        row["state"] || row["operState"] || "N/A",
    "site-id":      row["site-id"] || row["siteId"] || "N/A",
    "domain-id":    row["domain-id"] || row["domainId"] || "N/A",
  };
}

export default function ControlPlane() {
  const { systemIp: urlSystemIp } = useParams();
  const activeIp = urlSystemIp || null;

  const url = activeIp ? `/api/control-plane/${activeIp}` : null;
  const { data: rawData, isLoading, error } = useApiFetch(url);

  // Normalize rows and log raw data for debugging
  const data = React.useMemo(() => {
    if (!rawData) return null;
    const arr = Array.isArray(rawData) ? rawData : [];
    if (arr.length > 0) {
      console.log("🔍 Control Plane raw row[0]:", JSON.stringify(arr[0], null, 2));
    }
    return arr.map(normalize);
  }, [rawData]);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5">Control Plane</Typography>
        <DeviceSelector navigatePrefix="/realtime/control-plane/" />
      </Box>
      {!activeIp && (
        <Alert severity="info" sx={{ mb: 2 }}>Select a device to view control plane.</Alert>
      )}
      {isLoading && <LoadingSpinner message="Loading control plane..." />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {data && !isLoading && (
        <DataTable
          columns={columns}
          rows={data}
          title={`Control Plane — ${activeIp}`}
          dense
          renderCell={(field, value) => {
            if (field === "lastupdated") return value ? new Date(value).toLocaleString() : "—";
            return value ?? "—";
          }}
        />
      )}
    </Box>
  );
}
