import React, { useState, useEffect } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  ArrowForward as ArrowIcon,
  Shield as ShieldIcon,
} from "@mui/icons-material";

const API_BASE = "";

export default function PolicyDrillDown({ open, onClose, policyType, policyId, policyName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !policyType || !policyId) return;
    setLoading(true);
    setError(null);
    setData(null);

    // Map frontend policy types to vManage definition types
    const typeMap = { data: "data", control: "control", appRoute: "approute", approute: "approute" };
    const apiType = typeMap[policyType] || policyType;

    fetch(`${API_BASE}/api/policy/definition/${apiType}/${policyId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [open, policyType, policyId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper"
      PaperProps={{ sx: { minHeight: "60vh", maxHeight: "90vh" } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 6 }}>
        <ShieldIcon color="primary" />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="span">
            {policyName || "Policy Definition"}
          </Typography>
          {data && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {data.type} policy · {data.sequenceCount} sequence{data.sequenceCount !== 1 ? "s" : ""} · Default: {data.defaultAction}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
            <CircularProgress size={32} />
            <Typography sx={{ ml: 2 }} color="text.secondary">Loading policy definition...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            Failed to load policy definition: {error}
          </Alert>
        )}

        {data && !loading && (
          <Box>
            {/* Description */}
            {data.description && (
              <Box sx={{ px: 3, py: 1.5, bgcolor: "rgba(25,118,210,0.04)" }}>
                <Typography variant="body2" color="text.secondary">{data.description}</Typography>
              </Box>
            )}

            {/* Summary lines — quick-read firewall rulebook */}
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Quick Summary
              </Typography>
              {data.sequences.map((seq) => (
                <Typography key={seq.index} variant="body2"
                  sx={{ mb: 0.75, pl: 1.5, borderLeft: 3,
                    borderColor: actionBorderColor(seq.baseAction),
                    lineHeight: 1.6, fontFamily: "monospace", fontSize: "0.82rem" }}>
                  {seq.summary}
                </Typography>
              ))}
              <Typography variant="body2"
                sx={{ pl: 1.5, borderLeft: 3, borderColor: actionBorderColor(data.defaultAction),
                  lineHeight: 1.6, fontFamily: "monospace", fontSize: "0.82rem", fontStyle: "italic", color: "text.secondary" }}>
                Default: {data.defaultAction} (all unmatched traffic)
              </Typography>
            </Box>

            <Divider />

            {/* Detailed Rule Table */}
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, px: 1 }}>
                Sequence Details
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "background.default" }}>
                      <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 180 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Match Criteria</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 30, textAlign: "center" }}></TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 90, textAlign: "center" }}>Base Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.sequences.map((seq) => (
                      <TableRow key={seq.index} hover
                        sx={{ borderLeft: 4, borderLeftColor: actionBorderColor(seq.baseAction) }}>
                        <TableCell>
                          <Chip label={seq.index} size="small"
                            sx={{ fontWeight: 700, fontSize: "0.75rem", height: 22 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                            {seq.sequenceName || `Sequence ${seq.index}`}
                          </Typography>
                          {seq.sequenceType && (
                            <Chip label={seq.sequenceType} size="small" variant="outlined"
                              sx={{ fontSize: "0.6rem", height: 16, mt: 0.25 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <MatchBlock entries={seq.match} />
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <ArrowIcon sx={{ fontSize: 18, color: actionBorderColor(seq.baseAction) }} />
                        </TableCell>
                        <TableCell>
                          <ActionBlock entries={seq.actions} baseAction={seq.baseAction} />
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <ActionChip action={seq.baseAction} />
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Default action row */}
                    <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)", borderLeft: 4,
                      borderLeftColor: actionBorderColor(data.defaultAction) }}>
                      <TableCell>
                        <Chip label="∞" size="small"
                          sx={{ fontWeight: 700, fontSize: "0.75rem", height: 22 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} fontStyle="italic" color="text.secondary">
                          Default Rule
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                          All unmatched traffic
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <ArrowIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                          —
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <ActionChip action={data.defaultAction} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Sub-components ── */

function MatchBlock({ entries }) {
  if (!entries || entries.length === 0) {
    return <Typography variant="caption" color="text.secondary" fontStyle="italic">All traffic</Typography>;
  }
  return (
    <Box>
      {entries.length > 1 && (
        <Chip label="Match ALL of:" size="small" variant="outlined" color="info"
          sx={{ fontSize: "0.6rem", height: 16, mb: 0.5 }} />
      )}
      {entries.map((e, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.25 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ minWidth: 90 }}>
            {e.label}:
          </Typography>
          <Tooltip title={e.rawRef && e.rawRef !== e.value ? `Raw ID: ${e.rawRef}` : ""} arrow>
            <Typography variant="caption" sx={{ wordBreak: "break-word" }}>
              {e.value}
            </Typography>
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}

function ActionBlock({ entries, baseAction }) {
  if (!entries || entries.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" fontStyle="italic">
        {baseAction || "—"}
      </Typography>
    );
  }
  return (
    <Box>
      {entries.map((e, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.25 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ minWidth: 90 }}>
            {e.label}:
          </Typography>
          <Tooltip title={e.rawRef && e.rawRef !== e.value ? `Raw ID: ${e.rawRef}` : ""} arrow>
            <Typography variant="caption" sx={{ wordBreak: "break-word" }}>
              {e.value}
            </Typography>
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}

function ActionChip({ action }) {
  if (!action) return null;
  const lower = (action || "").toLowerCase();
  const isDrop = lower === "drop" || lower === "reject" || lower === "deny";
  const isAccept = lower === "accept" || lower === "forward" || lower === "permit" || lower === "pass";
  const color = isDrop ? "error" : isAccept ? "success" : "warning";
  return (
    <Chip label={action} size="small" color={color} variant="filled"
      sx={{ fontSize: "0.7rem", height: 22, fontWeight: 700, color: "#fff", textTransform: "capitalize" }} />
  );
}

function actionBorderColor(action) {
  const lower = (action || "").toLowerCase();
  if (lower === "drop" || lower === "reject" || lower === "deny") return "#E53935";
  if (lower === "accept" || lower === "forward" || lower === "permit") return "#43A047";
  return "#FF9800";
}
