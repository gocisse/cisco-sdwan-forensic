// SSEExamples.js
// Example React components using SSE for real-time data

import React from 'react';
import useSSE from '../hooks/useSSE';

// ======================
// BFD Sessions Component
// ======================

export function BFDSessions({ systemIP }) {
  const url = systemIP ? `/events/bfd?system-ip=${systemIP}` : null;

  const { data: bfdSessions, isConnected, error, reconnect } = useSSE(url, {
    onMessage: (data) => {
      console.log('BFD data received:', data);
    },
    onConnect: () => {
      console.log('BFD SSE connected');
    },
    onDisconnect: () => {
      console.log('BFD SSE disconnected');
    },
  });

  if (!systemIP) {
    return <div className="text-gray-500">Select a device to view BFD sessions</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        <p>Error: {error.message}</p>
        <button onClick={reconnect} className="btn btn-primary mt-2">
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2>BFD Sessions</h2>
        <span className={`badge ${isConnected ? 'badge-success' : 'badge-error'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      {bfdSessions ? (
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Color</th>
              <th>State</th>
              <th>Uptime</th>
            </tr>
          </thead>
          <tbody>
            {bfdSessions.map((session, index) => (
              <tr key={index}>
                <td>{session['src-ip']}</td>
                <td>{session['dst-ip']}</td>
                <td>{session.color}</td>
                <td className={session.state === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {session.state}
                </td>
                <td>{new Date(session['uptime-date'] * 1000).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-gray-500">Loading BFD data...</div>
      )}
    </div>
  );
}

// ======================
// Interface Usage Component
// ======================

export function InterfaceUsage({ systemIP }) {
  const url = systemIP ? `/events/interface-usage?system-ip=${systemIP}` : null;

  const { data: interfaces, isConnected, error, reconnect } = useSSE(url, {
    onMessage: (data) => {
      console.log('Interface usage data received:', data);
    },
  });

  if (!systemIP) {
    return <div className="text-gray-500">Select a device to view interface usage</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        <p>Error: {error.message}</p>
        <button onClick={reconnect} className="btn btn-primary mt-2">
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2>Interface Usage</h2>
        <span className={`badge ${isConnected ? 'badge-success' : 'badge-error'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      {interfaces ? (
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th>Interface</th>
              <th>IP Address</th>
              <th>Tx Kbps</th>
              <th>Rx Kbps</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {interfaces.map((iface, index) => (
              <tr key={index}>
                <td>{iface.ifname}</td>
                <td>{iface['ip-address']}</td>
                <td>{iface['tx-kbps']}</td>
                <td>{iface['rx-kbps']}</td>
                <td className={iface['if-oper-status'] === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {iface['if-oper-status']}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-gray-500">Loading interface usage data...</div>
      )}
    </div>
  );
}

// ======================
// Interface Stats Component
// ======================

export function InterfaceStats({ systemIP }) {
  const url = systemIP ? `/events/interface-stats?system-ip=${systemIP}` : null;

  const { data: stats, isConnected, error, reconnect } = useSSE(url, {
    onMessage: (data) => {
      console.log('Interface stats data received:', data);
    },
  });

  if (!systemIP) {
    return <div className="text-gray-500">Select a device to view interface stats</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        <p>Error: {error.message}</p>
        <button onClick={reconnect} className="btn btn-primary mt-2">
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2>Interface Statistics</h2>
        <span className={`badge ${isConnected ? 'badge-success' : 'badge-error'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      {stats ? (
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th>Interface</th>
              <th>Tx Packets</th>
              <th>Rx Packets</th>
              <th>Tx Errors</th>
              <th>Rx Errors</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, index) => (
              <tr key={index}>
                <td>{stat.ifname}</td>
                <td>{stat['tx-packets']}</td>
                <td>{stat['rx-packets']}</td>
                <td className={parseInt(stat['tx-errors']) > 0 ? 'text-yellow-500' : ''}>
                  {stat['tx-errors']}
                </td>
                <td className={parseInt(stat['rx-errors']) > 0 ? 'text-yellow-500' : ''}>
                  {stat['rx-errors']}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-gray-500">Loading interface stats data...</div>
      )}
    </div>
  );
}

// ======================
// Combined Dashboard Example
// ======================

export function RealtimeDashboard({ selectedDeviceIP }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <BFDSessions systemIP={selectedDeviceIP} />
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <InterfaceUsage systemIP={selectedDeviceIP} />
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <InterfaceStats systemIP={selectedDeviceIP} />
        </div>
      </div>
    </div>
  );
}

export default { BFDSessions, InterfaceUsage, InterfaceStats, RealtimeDashboard };
