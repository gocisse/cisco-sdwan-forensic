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
  CheckCircleOutline as AcceptIcon,
  Block as DropIcon,
  Warning as WarnIcon,
} from "@mui/icons-material";

const API_BASE = "";

// ── Color helpers ────────────────────────────────────────────────────────────
function actionColor(action) {
  const l = (action || "").toLowerCase();
  if (l === "drop" || l === "reject" || l === "deny") return { color: "#E53935", bg: "rgba(229,57,53,0.06)", chipColor: "error" };
  if (l === "accept" || l === "forward" || l === "permit" || l === "pass") return { color: "#43A047", bg: "rgba(67,160,71,0.06)", chipColor: "success" };
  return { color: "#FF9800", bg: "rgba(255,152,0,0.06)", chipColor: "warning" };
}

// ── Group match entries by category for readable display ─────────────────────
// Returns: { "Source": ["SITE_A", "10.0.0.0/8"], "Application": ["YOUTUBE"], ... }
function groupMatchEntries(entries) {
  if (!entries || entries.length === 0) return null;
  const groups = {};
  entries.forEach((e) => {
    const label = e.label || e.field || "Other";
    if (!groups[label]) groups[label] = [];
    const display = e.listName || e.value || "Any";
    if (!groups[label].includes(display)) groups[label].push(display);
  });
  return groups;
}

// ── Format grouped matches into a single readable sentence ───────────────────
function matchSentence(entries) {
  const groups = groupMatchEntries(entries);
  if (!groups) return "Any";
  const parts = Object.entries(groups).map(([label, values]) => {
    const joined = values.join(", ");
    return `${label}: ${joined}`;
  });
  return parts.join("  ·  ");
}

// ── Format action entries into readable string ───────────────────────────────
function actionSentence(entries, baseAction) {
  if (!entries || entries.length === 0) return baseAction || "—";
  const parts = entries
    .filter((e) => e.field !== "type")
    .map((e) => {
      const display = e.listName || e.value || "";
      return `${e.label}: ${display}`;
    });
  if (parts.length === 0) return baseAction || "—";
  return parts.join(", ");
}

// ═════════════════════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════════════════════
export default function PolicyDrillDown({ open, onClose, policyType, policyId, policyName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !policyType || !policyId) return;
    setLoading(true);
    setError(null);
    setData(null);

    const typeMap = { data: "data", control: "control", appRoute: "approute", approute: "approute" };
    const apiType = typeMap[policyType] || policyType;

    fetch(`${API_BASE}/api/policy/definition/${apiType}/${policyId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => { setData(json); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [open, policyType, policyId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper"
      PaperProps={{ sx: { minHeight: "60vh", maxHeight: "90vh" } }}>

      {/* ── Header ── */}
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 6, pb: 1 }}>
        <ShieldIcon color="primary" />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="span" fontWeight={700}>
            {policyName || "Policy Definition"}
          </Typography>
          {data && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
              <Chip label={data.type} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
              <Typography variant="caption" color="text.secondary">
                {data.sequenceCount} rule{data.sequenceCount !== 1 ? "s" : ""}
              </Typography>
              <Typography variant="caption" color="text.secondary">·</Typography>
              <Typography variant="caption" color="text.secondary">
                Default: <ActionChipInline action={data.defaultAction} />
              </Typography>
            </Box>
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
          <Alert severity="error" sx={{ m: 2 }}>Failed to load policy definition: {error}</Alert>
        )}

        {data && !loading && (
          <Box>
            {/* ── Description ── */}
            {data.description && (
              <Box sx={{ px: 3, py: 1.5, bgcolor: "rgba(25,118,210,0.04)" }}>
                <Typography variant="body2" color="text.secondary">{data.description}</Typography>
              </Box>
            )}

            {/* ── ACL Quick-Read Summary ── */}
            <Box sx={{ px: 3, py: 2, bgcolor: "#fafafa" }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                <ShieldIcon sx={{ fontSize: 16, color: "primary.main" }} />
                Access Control List — Quick Read
              </Typography>
              {data.sequences.map((seq) => {
                const ac = actionColor(seq.baseAction);
                return (
                  <Box key={seq.index} sx={{ display: "flex", alignItems: "flex-start", mb: 0.75, pl: 1, borderLeft: 3, borderColor: ac.color }}>
                    <Typography variant="body2" component="div"
                      sx={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "0.8rem", lineHeight: 1.7 }}>
                      <Box component="span" sx={{ fontWeight: 700, color: "text.secondary", mr: 1 }}>
                        Seq {seq.index * 10}:
                      </Box>
                      <Box component="span" sx={{ color: "text.primary" }}>
                        Match{" "}
                        <Box component="span" sx={{ fontWeight: 600 }}>
                          {matchSentence(seq.match)}
                        </Box>
                      </Box>
                      <Box component="span" sx={{ mx: 1, color: "text.disabled" }}>→</Box>
                      <Box component="span" sx={{ fontWeight: 700, color: ac.color }}>
                        {seq.baseAction}
                      </Box>
                      {seq.actions && seq.actions.length > 0 && seq.actions.some(a => a.field !== "type") && (
                        <Box component="span" sx={{ color: "text.secondary", ml: 0.5 }}>
                          ({actionSentence(seq.actions, "")})
                        </Box>
                      )}
                    </Typography>
                  </Box>
                );
              })}
              <Box sx={{ pl: 1, borderLeft: 3, borderColor: actionColor(data.defaultAction).color }}>
                <Typography variant="body2"
                  sx={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "0.8rem", lineHeight: 1.7, fontStyle: "italic", color: "text.secondary" }}>
                  <Box component="span" sx={{ fontWeight: 700, mr: 1 }}>Default:</Box>
                  Match <Box component="span" sx={{ fontWeight: 600 }}>Any</Box>
                  <Box component="span" sx={{ mx: 1, color: "text.disabled" }}>→</Box>
                  <Box component="span" sx={{ fontWeight: 700, color: actionColor(data.defaultAction).color }}>
                    {data.defaultAction}
                  </Box>
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* ── Detailed ACL Rule Table ── */}
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, px: 1 }}>
                Rule Details
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: 700, width: 64, textAlign: "center" }}>Seq #</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 160 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Match Criteria</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 28, textAlign: "center", px: 0 }}></TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 220 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.sequences.map((seq) => {
                      const ac = actionColor(seq.baseAction);
                      return (
                        <TableRow key={seq.index} hover
                          sx={{ bgcolor: ac.bg, borderLeft: 4, borderLeftColor: ac.color,
                            "&:hover": { bgcolor: `${ac.color}12` } }}>
                          {/* Sequence number */}
                          <TableCell sx={{ textAlign: "center", verticalAlign: "top", pt: 1.5 }}>
                            <Chip label={seq.index * 10} size="small"
                              sx={{ fontWeight: 700, fontSize: "0.8rem", height: 24, minWidth: 40,
                                bgcolor: "rgba(0,0,0,0.06)" }} />
                          </TableCell>

                          {/* Name + type badge */}
                          <TableCell sx={{ verticalAlign: "top", pt: 1.5 }}>
                            <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.25 }}>
                              {seq.sequenceName || `Rule ${seq.index}`}
                            </Typography>
                            {seq.sequenceType && (
                              <Chip label={seq.sequenceType} size="small" variant="outlined"
                                sx={{ fontSize: "0.6rem", height: 16 }} />
                            )}
                          </TableCell>

                          {/* Match criteria — grouped and readable */}
                          <TableCell sx={{ verticalAlign: "top", pt: 1.25 }}>
                            <MatchCriteria entries={seq.match} />
                          </TableCell>

                          {/* Arrow */}
                          <TableCell sx={{ textAlign: "center", verticalAlign: "top", pt: 1.5, px: 0 }}>
                            <ArrowIcon sx={{ fontSize: 18, color: ac.color }} />
                          </TableCell>

                          {/* Action — colored prominently */}
                          <TableCell sx={{ verticalAlign: "top", pt: 1.25 }}>
                            <ActionCell entries={seq.actions} baseAction={seq.baseAction} />
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Default rule row */}
                    {(() => {
                      const dac = actionColor(data.defaultAction);
                      return (
                        <TableRow sx={{ bgcolor: "rgba(0,0,0,0.03)", borderLeft: 4, borderLeftColor: dac.color }}>
                          <TableCell sx={{ textAlign: "center", verticalAlign: "top", pt: 1.5 }}>
                            <Chip label="∞" size="small"
                              sx={{ fontWeight: 700, fontSize: "0.8rem", height: 24, minWidth: 40, bgcolor: "rgba(0,0,0,0.06)" }} />
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top", pt: 1.5 }}>
                            <Typography variant="body2" fontWeight={700} fontStyle="italic" color="text.secondary">
                              Default Rule
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top", pt: 1.5 }}>
                            <Chip icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "text.disabled", ml: 0.5 }} />}
                              label="Any (all unmatched traffic)" size="small" variant="outlined"
                              sx={{ fontSize: "0.75rem", height: 22, fontStyle: "italic" }} />
                          </TableCell>
                          <TableCell sx={{ textAlign: "center", verticalAlign: "top", pt: 1.5, px: 0 }}>
                            <ArrowIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top", pt: 1.25 }}>
                            <ActionChipLarge action={data.defaultAction} />
                          </TableCell>
                        </TableRow>
                      );
                    })()}
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

// ═════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════════════════════

// ── Match Criteria: grouped, readable, shows "Any" when empty ────────────────
function MatchCriteria({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <Chip icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "info.main", ml: 0.5 }} />}
        label="Any" size="small" color="info" variant="outlined"
        sx={{ fontSize: "0.75rem", height: 22, fontWeight: 600 }} />
    );
  }

  const groups = groupMatchEntries(entries);
  if (!groups) return null;

  return (
    <Box>
      {Object.entries(groups).map(([label, values], i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.4 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ minWidth: 85, flexShrink: 0, fontSize: "0.72rem" }}>
            {label}:
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {values.map((v, j) => {
              const raw = entries.find((e) => (e.listName || e.value) === v);
              const hasRawRef = raw?.rawRef && raw.rawRef !== v && raw.rawRef !== raw.value;
              return (
                <Tooltip key={j} title={hasRawRef ? `UUID: ${raw.rawRef}` : ""} arrow placement="top">
                  <Chip label={v} size="small" variant="outlined"
                    sx={{ fontSize: "0.72rem", height: 20, fontWeight: 500,
                      borderColor: hasRawRef ? "primary.light" : "divider",
                      bgcolor: hasRawRef ? "rgba(25,118,210,0.04)" : "transparent" }} />
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ── Action Cell: prominent colored action with details ───────────────────────
function ActionCell({ entries, baseAction }) {
  const details = (entries || []).filter((e) => e.field !== "type");

  return (
    <Box>
      <ActionChipLarge action={baseAction} />
      {details.length > 0 && (
        <Box sx={{ mt: 0.5 }}>
          {details.map((e, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.25 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                {e.label}:
              </Typography>
              <Tooltip title={e.rawRef && e.rawRef !== e.value ? `UUID: ${e.rawRef}` : ""} arrow>
                <Typography variant="caption" sx={{ fontSize: "0.72rem", wordBreak: "break-word" }}>
                  {e.listName || e.value || "—"}
                </Typography>
              </Tooltip>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Large action chip with icon ──────────────────────────────────────────────
function ActionChipLarge({ action }) {
  if (!action) return null;
  const ac = actionColor(action);
  const lower = (action || "").toLowerCase();
  const isDrop = lower === "drop" || lower === "reject" || lower === "deny";
  const isAccept = lower === "accept" || lower === "forward" || lower === "permit" || lower === "pass";
  const Icon = isDrop ? DropIcon : isAccept ? AcceptIcon : WarnIcon;

  return (
    <Chip
      icon={<Icon sx={{ fontSize: 14, color: "#fff !important" }} />}
      label={action.charAt(0).toUpperCase() + action.slice(1)}
      size="small"
      color={ac.chipColor}
      variant="filled"
      sx={{ fontSize: "0.75rem", height: 24, fontWeight: 700, color: "#fff",
        "& .MuiChip-icon": { color: "#fff" } }}
    />
  );
}

// ── Inline action chip for header ────────────────────────────────────────────
function ActionChipInline({ action }) {
  if (!action) return null;
  const ac = actionColor(action);
  return (
    <Chip label={action} size="small" color={ac.chipColor} variant="filled"
      sx={{ fontSize: "0.6rem", height: 16, fontWeight: 700, color: "#fff", verticalAlign: "middle" }} />
  );
}
