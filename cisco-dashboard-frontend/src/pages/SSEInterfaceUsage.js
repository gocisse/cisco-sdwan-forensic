import React from "react";
import { Chip } from "@mui/material";
import SSEPage from "../components/SSEPage";

const columns = [
  { field: "ifname", label: "Interface" },
  { field: "if-admin-status", label: "Admin" },
  { field: "if-oper-status", label: "Oper" },
  { field: "rx-kbps", label: "RX Kbps" },
  { field: "tx-kbps", label: "TX Kbps" },
  { field: "rx-packets", label: "RX Packets" },
  { field: "tx-packets", label: "TX Packets" },
  { field: "rx-errors", label: "RX Errors" },
  { field: "tx-errors", label: "TX Errors" },
];

export default function SSEInterfaceUsage() {
  return (
    <SSEPage
      title="Live Interface Usage"
      eventPath="/events/interface-usage"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "if-admin-status" || field === "if-oper-status") {
          const raw = (value != null ? String(value) : "").trim().toLowerCase();
          const isUp = raw === "up";
          const isDown = raw === "down";
          const color = isUp ? "success" : isDown ? "error" : "default";
          return (
            <Chip label={value || "—"} size="small" color={color} variant="outlined" sx={{ fontSize: "0.75rem" }} />
          );
        }
        return value ?? "—";
      }}
    />
  );
}
