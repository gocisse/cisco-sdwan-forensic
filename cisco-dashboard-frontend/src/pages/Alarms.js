import React, { useMemo } from "react";
import { Box, Typography, Alert, Chip, Button } from "@mui/material";
import {
  Refresh as RefreshIcon,
  CheckCircleOutline as ActiveIcon,
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import DataTable from "../components/DataTable";

const columns = [
  { field: "severity", label: "Severity" },
  { field: "alarm", label: "Alarm" },
  { field: "component", label: "Component" },
  { field: "systemIp", label: "System IP" },
  { field: "hostName", label: "Hostname" },
  { field: "siteId", label: "Site ID" },
  { field: "entryTime", label: "Time" },
  { field: "status", label: "Status" },
];

const severityMap = {
  critical: "error",
  major: "warning",
  minor: "info",
  warning: "info",
};

function normalizeAlarm(row) {
  return {
    ...row,
    severity: row.type || row.severity || "N/A",
    alarm: row.rule_name_display || row.ruleName || row["rule-name-display"] || "N/A",
    component: row.component || "N/A",
    systemIp: row.system_ip || row["system-ip"] || row.systemIp || "N/A",
    hostName: row.host_name || row["host-name"] || row.hostName || "N/A",
    siteId: row.site_id || row["site-id"] || row.siteId || "N/A",
    entryTime: row.entry_time || row["entry-time"] || row.entryTime || null,
    status: row.active !== undefined ? (row.active ? "Active" : "Cleared") : (row.cleared ? "Cleared" : "Active"),
  };
}

export default function Alarms() {
  const { data: rawAlarms, isLoading, error, refetch } = useApiFetch("/api/alarms");

  const alarms = useMemo(() => {
    if (!rawAlarms) return [];
    const arr = Array.isArray(rawAlarms) ? rawAlarms : rawAlarms.data || [];
    return arr.map(normalizeAlarm);
  }, [rawAlarms]);

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
        rows={alarms}
        defaultSort="entryTime"
        defaultOrder="desc"
        dense
        renderCell={(field, value, row) => {
          if (field === "severity") {
            const color = severityMap[(value || "").toLowerCase()] || "default";
            return <Chip label={value || "N/A"} size="small" color={color} variant="outlined" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />;
          }
          if (field === "entryTime") {
            return value ? new Date(value).toLocaleString() : "N/A";
          }
          if (field === "status") {
            const isActive = value === "Active";
            return (
              <Chip
                icon={isActive ? <ActiveIcon sx={{ fontSize: 14 }} /> : undefined}
                label={value}
                size="small"
                color={isActive ? "success" : "default"}
                variant="outlined"
                sx={{ fontSize: "0.7rem" }}
              />
            );
          }
          return value ?? "N/A";
        }}
      />
    </Box>
  );
}
