import React from "react";
import { Chip } from "@mui/material";
import SSEPage from "../components/SSEPage";

const columns = [
  { field: "vdevice-host-name", label: "Hostname" },
  { field: "src-ip", label: "Source IP" },
  { field: "dst-ip", label: "Remote IP" },
  { field: "local-color", label: "Local Color" },
  { field: "color", label: "Color" },
  { field: "state", label: "BFD State" },
];

export default function SSEBfd() {
  return (
    <SSEPage
      title="Live BFD State"
      eventPath="/events/bfd"
      columns={columns}
      renderCell={(field, value) => {
        if (field === "state") {
          return (
            <Chip
              label={value || "—"}
              size="small"
              color={typeof value === "string" && value.toLowerCase() === "up" ? "success" : "error"}
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: "0.75rem" }}
            />
          );
        }
        return value ?? "—";
      }}
    />
  );
}
