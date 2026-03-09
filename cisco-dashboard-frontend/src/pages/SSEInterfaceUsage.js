// SSEInterfaceUsage.js
// Interface Usage component using Server-Sent Events (SSE)

import React, { useState } from "react";
import useSSE from "../hooks/useSSE";

function SSEInterfaceUsage() {
  const [systemIp, setSystemIp] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Build SSE URL when systemIp is provided
  const sseUrl = systemIp.trim() ? `/events/interface-usage?system-ip=${encodeURIComponent(systemIp.trim())}` : null;

  // Connect to SSE endpoint
  const { data: updates, isConnected, error, reconnect } = useSSE(sseUrl, {
    onConnect: () => {
      console.log("SSE (Interface Usage) connection established");
      setIsConnecting(false);
    },
    onMessage: (data) => {
      console.log("Received Interface Usage Data:", data);
    },
    onDisconnect: () => {
      console.log("SSE (Interface Usage) connection closed");
    },
    onError: (err) => {
      console.error("SSE (Interface Usage) error:", err);
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
      <h1>Interface Usage (SSE)</h1>

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
          {!sseUrl ? "Enter a system IP and click Connect to start receiving interface usage data." : "Waiting for interface usage data..."}
        </p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Interface</th>
              <th>Admin Status</th>
              <th>Oper Status</th>
              <th>Rx Kbps</th>
              <th>Tx Kbps</th>
              <th>Rx Packets</th>
              <th>Tx Packets</th>
              <th>Rx Errors</th>
              <th>Tx Errors</th>
            </tr>
          </thead>
          <tbody>
            {updates.map((item, index) => (
              <tr key={index}>
                <td>{item.ifname}</td>
                <td className={item["if-admin-status"] === "up" ? "status-up" : "status-down"}>
                  {item["if-admin-status"]}
                </td>
                <td className={item["if-oper-status"] === "up" ? "status-up" : "status-down"}>
                  {item["if-oper-status"]}
                </td>
                <td>{item["rx-kbps"]}</td>
                <td>{item["tx-kbps"]}</td>
                <td>{item["rx-packets"]}</td>
                <td>{item["tx-packets"]}</td>
                <td className={item["rx-errors"] > 0 ? "status-warning" : ""}>
                  {item["rx-errors"]}
                </td>
                <td className={item["tx-errors"] > 0 ? "status-warning" : ""}>
                  {item["tx-errors"]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SSEInterfaceUsage;
