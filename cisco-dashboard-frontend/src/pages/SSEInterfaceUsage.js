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
          const isUp = typeof value === "string" && value.toLowerCase() === "up";
          return (
            <Chip label={value || "—"} size="small" color={isUp ? "success" : "error"} variant="outlined" sx={{ fontSize: "0.75rem" }} />
          );
        }
        return value ?? "—";
      }}
    />
  );
}
