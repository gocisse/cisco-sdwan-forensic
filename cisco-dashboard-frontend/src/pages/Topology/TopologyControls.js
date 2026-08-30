/**
 * Topology control panel component
 */

import React from "react";
import {
  Box,
  ButtonGroup,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as FitIcon,
  Fullscreen as FullscreenIcon,
  AccountTree as ControlIcon,
  Hub as BfdIcon,
  Route as RouteIcon,
} from "@mui/icons-material";

export default function TopologyControls({
  view,
  onViewChange,
  onZoomIn,
  onZoomOut,
  onFit,
  onFullscreen,
  peerCount,
  hiddenCount,
  showAllPeers,
  onToggleShowAll,
  activeIp,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      {/* View Toggle */}
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(_, v) => v && onViewChange(v)}
        size="small"
      >
        <ToggleButton value="control">
          <Tooltip title="Control Plane (All Controllers)">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <ControlIcon fontSize="small" />
              Control
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="dataplane" disabled={!activeIp}>
          <Tooltip title="Data Plane (BFD Tunnels)">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <BfdIcon fontSize="small" />
              Data Plane
              {peerCount > 0 && view === "dataplane" && (
                <Chip label={peerCount} size="small" sx={{ ml: 0.5, height: 18 }} />
              )}
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="omp" disabled={!activeIp}>
          <Tooltip title="OMP Routing Topology">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <RouteIcon fontSize="small" />
              OMP Routes
            </Box>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Show All / Show Less button for data plane */}
      {view === "dataplane" && hiddenCount > 0 && (
        <Button size="small" variant="outlined" onClick={onToggleShowAll}>
          {showAllPeers ? "Show Less" : `Show All (+${hiddenCount})`}
        </Button>
      )}

      {/* Zoom Controls */}
      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Zoom In">
          <Button onClick={onZoomIn}>
            <ZoomInIcon fontSize="small" />
          </Button>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <Button onClick={onZoomOut}>
            <ZoomOutIcon fontSize="small" />
          </Button>
        </Tooltip>
        <Tooltip title="Fit to Screen">
          <Button onClick={onFit}>
            <FitIcon fontSize="small" />
          </Button>
        </Tooltip>
        <Tooltip title="Fullscreen">
          <Button onClick={onFullscreen}>
            <FullscreenIcon fontSize="small" />
          </Button>
        </Tooltip>
      </ButtonGroup>
    </Box>
  );
}
