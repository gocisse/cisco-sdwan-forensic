import React from "react";
import { Box, Typography, Alert } from "@mui/material";
import useApiFetch from "../hooks/useApiFetch";
import DataTable from "./DataTable";
import LoadingSpinner from "./LoadingSpinner";

export default function PolicyListPage({
  title,
  apiPath,
  columns,
  renderCell,
  dense = true,
}) {
  const { data, isLoading, error } = useApiFetch(apiPath);

  const rows = Array.isArray(data) ? data : [];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {title}
      </Typography>
      {isLoading && <LoadingSpinner message={`Loading ${title.toLowerCase()}...`} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!isLoading && !error && rows.length === 0 && (
        <Alert severity="info">No {title.toLowerCase()} found.</Alert>
      )}
      {rows.length > 0 && (
        <DataTable
          columns={columns}
          rows={rows}
          title={title}
          dense={dense}
          renderCell={renderCell}
        />
      )}
    </Box>
  );
}
