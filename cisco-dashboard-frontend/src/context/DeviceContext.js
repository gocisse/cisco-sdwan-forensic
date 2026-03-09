import React, { createContext, useContext, useState, useEffect } from "react";

const DeviceContext = createContext();

export function DeviceProvider({ children }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/devices")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setDevices(data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("DeviceContext: failed to load devices", err);
        setIsLoading(false);
      });
  }, []);

  const selectDeviceByIp = (systemIp) => {
    const dev = devices.find((d) => d["system-ip"] === systemIp) || null;
    setSelectedDevice(dev);
    return dev;
  };

  return (
    <DeviceContext.Provider
      value={{
        devices,
        selectedDevice,
        setSelectedDevice,
        selectDeviceByIp,
        isLoading,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDeviceContext() {
  const ctx = useContext(DeviceContext);
  if (!ctx) {
    throw new Error("useDeviceContext must be used within a DeviceProvider");
  }
  return ctx;
}

export default DeviceContext;
