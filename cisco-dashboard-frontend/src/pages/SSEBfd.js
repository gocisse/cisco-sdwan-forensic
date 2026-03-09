// SSEBfd.js
// BFD State component using Server-Sent Events (SSE)

import React, { useState } from "react";
import useSSE from "../hooks/useSSE";

function SSEBfd() {
  const [systemIp, setSystemIp] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Build SSE URL when systemIp is provided
  const sseUrl = systemIp.trim() ? `/events/bfd?system-ip=${encodeURIComponent(systemIp.trim())}` : null;

  // Connect to SSE endpoint
  const { data: updates, isConnected, error, reconnect } = useSSE(sseUrl, {
    onConnect: () => {
      console.log("SSE (BFD) connection established");
      setIsConnecting(false);
    },
    onMessage: (data) => {
      console.log("Received BFD Data:", data);
    },
    onDisconnect: () => {
      console.log("SSE (BFD) connection closed");
    },
    onError: (err) => {
      console.error("SSE (BFD) error:", err);
      setIsConnecting(false);
    },
  });

  const handleConnect = () => {
    if (!systemIp.trim()) {
      alert("Please enter a valid system IP");
      return;
    }
    setIsConnecting(true);
  };

  const handleDisconnect = () => {
    setSystemIp("");
    setIsConnecting(false);
  };

  return (
    <div className="dashboard-container">
      <h1>BFD State (SSE)</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Enter system IP"
          value={systemIp}
          onChange={(e) => setSystemIp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
        />
        {!sseUrl ? (
          <button onClick={handleConnect}>Connect</button>
        ) : (
          <button onClick={handleDisconnect} className="btn-disconnect">
            Disconnect
          </button>
        )}
        <span className={`status-indicator ${isConnected ? "connected" : "disconnected"}`}>
          {isConnecting ? "Connecting..." : isConnected ? "● Connected" : "○ Disconnected"}
        </span>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error.message}</p>
          <button onClick={reconnect} className="btn-reconnect">
            Reconnect
          </button>
        </div>
      )}

      {!updates || updates.length === 0 ? (
        <p className="no-data">
          {!sseUrl ? "Enter a system IP and click Connect to start receiving BFD data." : "Waiting for BFD data..."}
        </p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Hostname</th>
              <th>Source IP</th>
              <th>Remote IP</th>
              <th>Local Color</th>
              <th>Color</th>
              <th>BFD State</th>
            </tr>
          </thead>
          <tbody>
            {updates.map((item, index) => (
              <tr key={index}>
                <td>{item["vdevice-host-name"]}</td>
                <td>{item["src-ip"]}</td>
                <td>{item["dst-ip"]}</td>
                <td>{item["local-color"]}</td>
                <td>{item["color"]}</td>
                <td className={item["state"] === "up" ? "status-up" : "status-down"}>
                  {item["state"]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SSEBfd;
