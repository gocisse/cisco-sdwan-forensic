import React from "react";
import { Box, Typography, Alert, Chip, Button } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import DataTable from "../components/DataTable";

const columns = [
  { field: "type", label: "Severity" },
  { field: "rule_name_display", label: "Alarm" },
  { field: "component", label: "Component" },
  { field: "system_ip", label: "System IP" },
  { field: "host_name", label: "Hostname" },
  { field: "site_id", label: "Site ID" },
  { field: "entry_time", label: "Time" },
  { field: "active", label: "Active" },
];

const severityMap = {
  critical: "error",
  major: "warning",
  minor: "info",
  warning: "info",
};

export default function Alarms() {
  const { data: alarms, isLoading, error, refetch } = useApiFetch("/api/alarms");

  if (isLoading) return <LoadingSpinner message="Fetching alarms..." />;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">Alarms</Typography>
        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={refetch}>
          Refresh
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <DataTable
        columns={columns}
        rows={alarms || []}
        defaultSort="entry_time"
        defaultOrder="desc"
        dense
        renderCell={(field, value, row) => {
          if (field === "type") {
            const color = severityMap[(value || "").toLowerCase()] || "default";
            return <Chip label={value || "N/A"} size="small" color={color} variant="outlined" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />;
          }
          if (field === "entry_time") {
            return value ? new Date(value).toLocaleString() : "N/A";
          }
          if (field === "active") {
            return <Chip label={value ? "Active" : "Cleared"} size="small" color={value ? "error" : "default"} variant="outlined" sx={{ fontSize: "0.7rem" }} />;
          }
          if (field === "rule_name_display") return value || row.ruleName || "N/A";
          if (field === "system_ip") return value || row["system-ip"] || "N/A";
          if (field === "host_name") return value || row["host-name"] || "N/A";
          if (field === "site_id") return value || row["site-id"] || "N/A";
          return value ?? "N/A";
        }}
      />
    </Box>
  );
}
