import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Alert, TextField, Button, InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
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
  prefixSearch = false,
}) {
  const { systemIp: urlSystemIp } = useParams();
  const activeIp = urlSystemIp || null;

  // Prefix search state (for routes pages)
  const [prefixQuery, setPrefixQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const navPrefix = navigateTo || apiPath.replace("/api/", "/realtime/").replace(/\/?$/, "/");

  const handleSearch = () => {
    setActiveQuery(prefixQuery.trim());
  };

  const handleLoadAll = () => {
    setActiveQuery("__all__");
  };

  // Build the fetch URL
  const actualUrl = useMemo(() => {
    if (!activeIp) return null;
    const base = `${apiPath}/${activeIp}`;
    if (!prefixSearch) return base;
    if (activeQuery === "__all__") return base;
    if (activeQuery) return `${base}?prefix=${encodeURIComponent(activeQuery)}`;
    return null; // Don't auto-fetch without a search term
  }, [activeIp, apiPath, prefixSearch, activeQuery]);

  const { data: actualData, isLoading: actualLoading, error: actualError } = useApiFetch(actualUrl);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5">{title}</Typography>
        <DeviceSelector navigatePrefix={navPrefix} />
      </Box>
      {!activeIp && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select a device to view {title.toLowerCase()}.
        </Alert>
      )}

      {/* Prefix search bar for routes pages */}
      {prefixSearch && activeIp && (
        <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search by prefix (e.g. 10.0.0 or 172.16)"
            value={prefixQuery}
            onChange={(e) => setPrefixQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" size="small" onClick={handleSearch} disabled={!prefixQuery.trim()}>
            Search Routes
          </Button>
          <Button variant="outlined" size="small" onClick={handleLoadAll} color="warning">
            Load All (may be slow)
          </Button>
        </Box>
      )}

      {prefixSearch && activeIp && !activeQuery && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Enter a prefix/subnet to search for specific routes. Loading all routes may be slow on devices with large routing tables.
        </Alert>
      )}

      {actualLoading && <LoadingSpinner message={`Loading ${title.toLowerCase()}...`} />}
      {actualError && <Alert severity="error" sx={{ mb: 2 }}>{actualError}</Alert>}
      {actualData && !actualLoading && (
        <DataTable
          columns={columns}
          rows={actualData}
          title={`${title} — ${activeIp}${activeQuery && activeQuery !== "__all__" ? ` (prefix: ${activeQuery})` : ""}`}
          dense={dense}
          renderCell={renderCell}
        />
      )}
    </Box>
  );
}
