import React from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Alert } from "@mui/material";
import useApiFetch from "../hooks/useApiFetch";
import DataTable from "./DataTable";
import DeviceSelector from "./DeviceSelector";
import LoadingSpinner from "./LoadingSpinner";

export default function RealTimePage({
  title,
  apiPath,
  columns,
  renderCell,
  dense = true,
  navigateTo,
}) {
  const { systemIp: urlSystemIp } = useParams();
  const activeIp = urlSystemIp || null;

  const url = activeIp ? `${apiPath}/${activeIp}` : null;
  const { data, isLoading, error } = useApiFetch(url);

  const prefix = navigateTo || apiPath.replace("/api/", "/realtime/").replace(/\/?$/, "/");

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5">{title}</Typography>
        <DeviceSelector navigatePrefix={prefix} />
      </Box>
      {!activeIp && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select a device to view {title.toLowerCase()}.
        </Alert>
      )}
      {isLoading && <LoadingSpinner message={`Loading ${title.toLowerCase()}...`} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {data && !isLoading && (
        <DataTable
          columns={columns}
          rows={data}
          title={`${title} — ${activeIp}`}
          dense={dense}
          renderCell={renderCell}
        />
      )}
    </Box>
  );
}
