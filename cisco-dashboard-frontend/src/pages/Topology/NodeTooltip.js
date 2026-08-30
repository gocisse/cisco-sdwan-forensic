/**
 * Tooltip component for topology nodes
 */

import React from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";

export default function NodeTooltip({ tooltip, containerRef }) {
  if (!tooltip) return null;

  const { x, y, data } = tooltip;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
        p: 1.5,
        minWidth: 180,
        zIndex: 9999,
        pointerEvents: "none",
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="subtitle2" fontWeight={700}>
        {data.hostname || data.id}
      </Typography>
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          System IP: {data.systemIp || data.id}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Type: {data.deviceType || "N/A"}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Site: {data.siteId || "N/A"}
        </Typography>
      </Box>
      <Chip
        label={data.status === "reachable" ? "Reachable" : "Unreachable"}
        size="small"
        color={data.status === "reachable" ? "success" : "error"}
        sx={{ mt: 1, fontSize: "0.7rem", height: 20 }}
      />
    </Paper>
  );
}
