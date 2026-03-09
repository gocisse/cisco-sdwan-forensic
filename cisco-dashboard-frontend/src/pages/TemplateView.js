import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Grid,
  Paper,
  Typography,
  Alert,
  IconButton,
} from "@mui/material";
import {
  Inventory as PackageIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";
import useApiFetch from "../hooks/useApiFetch";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDeviceContext } from "../context/DeviceContext";
import DeviceSelector from "../components/DeviceSelector";

export default function TemplateView() {
  const { systemIp: urlSystemIp } = useParams();
  const navigate = useNavigate();
  const { selectedDevice } = useDeviceContext();
  const activeIp = urlSystemIp || (selectedDevice ? selectedDevice["system-ip"] : null);

  const { data: details, isLoading: detailsLoading, error: detailsError } = useApiFetch(activeIp ? `/api/device/${activeIp}/details` : null);
  const { data: templates, isLoading: templatesLoading, error: templatesError } = useApiFetch(activeIp ? `/api/device/${activeIp}/templates` : null);
  const isLoading = detailsLoading || templatesLoading;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5">Template Hierarchy</Typography>
        <DeviceSelector onSelect={(ip) => navigate(`/templates/${ip}`)} />
      </Box>

      {!activeIp && <Alert severity="info">Select a device to view its template hierarchy.</Alert>}
      {isLoading && <LoadingSpinner message="Loading template data..." />}
      {(detailsError || templatesError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {detailsError && <div>Device error: {detailsError}</div>}
          {templatesError && <div>Template error: {templatesError}</div>}
        </Alert>
      )}

      {details && !isLoading && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="h6">{details.hostName || "Unnamed Device"}</Typography>
              <Chip label={details.reachability || "unknown"} size="small" color={details.reachability === "reachable" ? "success" : "error"} />
            </Box>
            <Grid container spacing={1}>
              {[
                ["System IP", details.systemIp],
                ["Model", details.deviceModel],
                ["Site ID", details.siteId],
                ["OS", details.deviceOs],
                ["Template", details.template],
                ["Template ID", details.templateId],
              ].map(([label, value]) => (
                <Grid item xs={6} sm={4} md={3} key={label}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value || "N/A"}</Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {templates && !isLoading && (
        <Box>
          <Paper sx={{ p: 2, mb: 1.5, bgcolor: "primary.main", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PackageIcon />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>{templates.deviceTemplateName}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Device Template{templates.deviceTemplateDescription && ` — ${templates.deviceTemplateDescription}`}
                </Typography>
              </Box>
            </Box>
            <Chip label={`${templates.featureTemplates?.length || 0} features`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }} />
          </Paper>

          {templates.featureTemplates && templates.featureTemplates.length > 0 ? (
            templates.featureTemplates.map((ft, i) => (
              <FeatureTemplateCard key={ft.templateId || i} template={ft} depth={0} />
            ))
          ) : (
            <Alert severity="info">No feature templates attached.</Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

function FeatureTemplateCard({ template, depth }) {
  const [expanded, setExpanded] = useState(true);
  const hasSubs = template.subTemplates && template.subTemplates.length > 0;

  return (
    <Box sx={{ ml: depth > 0 ? 3 : 0 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 1.25,
          my: 0.5,
          borderLeft: 3,
          borderLeftColor: depth === 0 ? "primary.main" : "primary.light",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: hasSubs ? "pointer" : "default",
          "&:hover": { bgcolor: "action.hover" },
        }}
        onClick={() => hasSubs && setExpanded(!expanded)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flex: 1 }}>
          {hasSubs ? (
            <IconButton size="small" sx={{ p: 0 }}>
              {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          ) : (
            <CircleIcon sx={{ fontSize: 8, color: "text.disabled", mx: 0.75 }} />
          )}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" fontWeight={600}>{template.templateName}</Typography>
              <Chip label={template.templateType} size="small" sx={{ fontSize: "0.7rem", height: 20, bgcolor: "primary.main", color: "#fff" }} />
            </Box>
            {template.templateDescription && (
              <Typography variant="caption" color="text.secondary">{template.templateDescription}</Typography>
            )}
          </Box>
        </Box>
        {hasSubs && (
          <Chip label={`${template.subTemplates.length} sub`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
        )}
      </Paper>
      {hasSubs && (
        <Collapse in={expanded}>
          {template.subTemplates.map((st, j) => (
            <FeatureTemplateCard key={st.templateId || j} template={st} depth={depth + 1} />
          ))}
        </Collapse>
      )}
    </Box>
  );
}
