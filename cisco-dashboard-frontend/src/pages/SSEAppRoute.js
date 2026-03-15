import React from "react";
import { Chip } from "@mui/material";
import SSEPage from "../components/SSEPage";

const columns = [
  { field: "src-ip", label: "Source IP" },
  { field: "dst-ip", label: "Dest IP" },
  { field: "local-color", label: "Local Color" },
  { field: "remote-color", label: "Remote Color" },
  { field: "app-probe-class", label: "SLA Class" },
  { field: "latency", label: "Latency (ms)" },
  { field: "loss", label: "Loss (%)" },
  { field: "jitter", label: "Jitter (ms)" },
  { field: "slaStatus", label: "SLA Status" },
  { field: "vdevice-name", label: "Device" },
];

// Thresholds for color coding
const LOSS_THRESHOLD = 0;
const LATENCY_HIGH = 150;

export default function SSEAppRoute() {
  return (
    <SSEPage
      title="Live App-Route Statistics"
      eventPath="/events/app-route"
      columns={columns}
      renderCell={(field, value, row) => {
        const numVal = parseFloat(value);

        if (field === "loss") {
          const hasLoss = !isNaN(numVal) && numVal > LOSS_THRESHOLD;
          return (
            <Chip
              label={value ?? "—"}
              size="small"
              color={hasLoss ? "error" : "success"}
              variant="outlined"
              sx={{ fontSize: "0.75rem", fontWeight: hasLoss ? 700 : 400 }}
            />
          );
        }

        if (field === "latency") {
          const isHigh = !isNaN(numVal) && numVal > LATENCY_HIGH;
          return (
            <Chip
              label={value ?? "—"}
              size="small"
              color={isHigh ? "warning" : "default"}
              variant="outlined"
              sx={{ fontSize: "0.75rem", fontWeight: isHigh ? 700 : 400 }}
            />
          );
        }

        if (field === "slaStatus") {
          const s = (value || "").toLowerCase();
          const color = s === "good" ? "success" : s === "degraded" ? "warning" : s === "bad" ? "error" : "default";
          return (
            <Chip
              label={value || "—"}
              size="small"
              color={color}
              sx={{ fontSize: "0.75rem", fontWeight: 600 }}
            />
          );
        }

        if (field === "src-ip" || field === "dst-ip") {
          return <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{value || "—"}</span>;
        }

        return value ?? "—";
      }}
    />
  );
}
