import React from "react";
import { useNavigate } from "react-router-dom";
import { TextField, MenuItem } from "@mui/material";
import { useDeviceContext } from "../context/DeviceContext";

export default function DeviceSelector({ onSelect, navigatePrefix }) {
  const navigate = useNavigate();
  const { devices, selectedDevice, selectDeviceByIp, isLoading } =
    useDeviceContext();

  const handleChange = (e) => {
    const ip = e.target.value;
    if (!ip) return;
    const dev = selectDeviceByIp(ip);
    if (onSelect) onSelect(ip, dev);
    if (navigatePrefix) navigate(`${navigatePrefix}${ip}`);
  };

  return (
    <TextField
      select
      size="small"
      label="Select Device"
      value={selectedDevice ? selectedDevice["system-ip"] : ""}
      onChange={handleChange}
      disabled={isLoading}
      sx={{ minWidth: 280 }}
    >
      <MenuItem value="">
        <em>{isLoading ? "Loading devices…" : "— Select a device —"}</em>
      </MenuItem>
      {devices.map((d) => (
        <MenuItem key={d["system-ip"]} value={d["system-ip"]}>
          {d["host-name"] || "Unnamed"} ({d["system-ip"]})
        </MenuItem>
      ))}
    </TextField>
  );
}
