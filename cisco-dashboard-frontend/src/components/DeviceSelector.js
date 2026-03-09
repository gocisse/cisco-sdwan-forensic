import React from "react";
import { useDeviceContext } from "../context/DeviceContext";

function DeviceSelector({ onSelect }) {
  const { devices, selectedDevice, selectDeviceByIp, isLoading } =
    useDeviceContext();

  const handleChange = (e) => {
    const ip = e.target.value;
    if (ip) {
      const dev = selectDeviceByIp(ip);
      if (onSelect) onSelect(ip, dev);
    }
  };

  if (isLoading) {
    return (
      <select disabled style={selectStyle}>
        <option>Loading devices…</option>
      </select>
    );
  }

  return (
    <select
      value={selectedDevice ? selectedDevice["system-ip"] : ""}
      onChange={handleChange}
      style={selectStyle}
    >
      <option value="">— Select a device —</option>
      {devices.map((d) => (
        <option key={d["system-ip"]} value={d["system-ip"]}>
          {d["host-name"] || "Unnamed"} ({d["system-ip"]})
        </option>
      ))}
    </select>
  );
}

const selectStyle = {
  padding: "8px 12px",
  fontSize: "0.95rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  minWidth: "280px",
  backgroundColor: "#fff",
};

export default DeviceSelector;
