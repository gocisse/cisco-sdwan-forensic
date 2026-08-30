/**
 * Component for displaying relationship/edge details
 */

import React from "react";
import {
  Paper,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { TRANSPORT_COLOR } from "./constants";

export function EdgeInfoPanel({ selectedEdgeInfo, view }) {
  if (!selectedEdgeInfo) return null;

  if (view === "omp") {
    return <OmpEdgeInfo edge={selectedEdgeInfo} />;
  }

  return <DataPlaneEdgeInfo edge={selectedEdgeInfo} />;
}

function DataPlaneEdgeInfo({ edge }) {
  const {
    peerHostname,
    peerType,
    siteId,
    healthStatus,
    activeCount,
    totalCount,
    transports,
    controlConns,
    relationshipTypes,
    uniqueColors,
  } = edge;

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Connection to {peerHostname}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Chip label={peerType} size="small" variant="outlined" />
        <Chip label={`Site ${siteId}`} size="small" variant="outlined" />
        <Chip
          label={healthStatus}
          size="small"
          color={
            healthStatus === "healthy"
              ? "success"
              : healthStatus === "degraded"
              ? "warning"
              : "error"
          }
        />
        <Chip label={`${activeCount}/${totalCount} active`} size="small" />
      </Box>

      {relationshipTypes && relationshipTypes.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Relationship Types:
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
            {relationshipTypes.map((type) => (
              <Chip key={type} label={type} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      )}

      {uniqueColors && uniqueColors.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Transport Colors:
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
            {uniqueColors.map((color) => (
              <Chip
                key={color}
                label={color}
                size="small"
                sx={{
                  bgcolor: TRANSPORT_COLOR[color] || TRANSPORT_COLOR.default,
                  color: "#fff",
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {transports && transports.length > 0 && (
        <TableContainer sx={{ maxHeight: 200 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Color</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Src IP</TableCell>
                <TableCell>Dst IP</TableCell>
                <TableCell>Uptime</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transports.map((t, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Chip
                      label={t.color}
                      size="small"
                      sx={{
                        bgcolor: TRANSPORT_COLOR[t.color] || TRANSPORT_COLOR.default,
                        color: "#fff",
                        fontSize: "0.7rem",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.state}
                      size="small"
                      color={t.state === "up" ? "success" : "error"}
                      sx={{ fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{t.srcIp}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{t.dstIp}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{t.uptime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {controlConns && controlConns.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Control Connections:
          </Typography>
          <TableContainer sx={{ maxHeight: 150 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>State</TableCell>
                  <TableCell>Peer Type</TableCell>
                  <TableCell>Protocol</TableCell>
                  <TableCell>Color</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {controlConns.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell>{c.state}</TableCell>
                    <TableCell>{c.peerType}</TableCell>
                    <TableCell>{c.protocol}</TableCell>
                    <TableCell>{c.localColor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
}

function OmpEdgeInfo({ edge }) {
  const { peerHostname, peerType, siteId, routeCount, vpnIds, prefixes } = edge;

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        OMP Routes from {peerHostname}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Chip label={peerType} size="small" variant="outlined" />
        <Chip label={`Site ${siteId}`} size="small" variant="outlined" />
        <Chip label={`${routeCount} routes`} size="small" color="primary" />
      </Box>

      {vpnIds && vpnIds.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            VPN IDs:
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
            {vpnIds.slice(0, 10).map((vpn) => (
              <Chip key={vpn} label={`VPN ${vpn}`} size="small" variant="outlined" />
            ))}
            {vpnIds.length > 10 && (
              <Chip label={`+${vpnIds.length - 10} more`} size="small" />
            )}
          </Box>
        </Box>
      )}

      {prefixes && prefixes.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Sample Prefixes:
          </Typography>
          <Box
            sx={{
              mt: 0.5,
              p: 1,
              bgcolor: "grey.100",
              borderRadius: 1,
              maxHeight: 150,
              overflow: "auto",
            }}
          >
            {prefixes.slice(0, 20).map((prefix, i) => (
              <Typography
                key={i}
                variant="caption"
                component="div"
                sx={{ fontFamily: "monospace" }}
              >
                {prefix}
              </Typography>
            ))}
            {prefixes.length > 20 && (
              <Typography variant="caption" color="text.secondary">
                ... and {prefixes.length - 20} more
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default EdgeInfoPanel;
