// src/pages/edgepolicy/QosMapInfo.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Basic table styling
const thStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  backgroundColor: "#f2f2f2",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "8px",
};

function QosMapInfo() {
  const { systemIp } = useParams();
  const navigate = useNavigate();
  const [ipInput, setIpInput] = useState(systemIp || "");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (systemIp) {
      setLoading(true);
      fetch(`/api/edgepolicy/qosmapinfo/${systemIp}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error ${res.status}`);
          }
          return res.json();
        })
        .then((json) => {
          setData(json);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [systemIp]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ipInput.trim()) {
      navigate(`/edgepolicy/qosmapinfo/${ipInput.trim()}`);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>QoS Map Info</h1>
      {/* Prompt for a system IP if not provided */}
      {!systemIp && (
        <form onSubmit={handleSubmit}>
          <label>
            Enter System IP:
            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="e.g. 192.0.2.1"
              style={{ marginLeft: "0.5rem" }}
            />
          </label>
          <button type="submit" style={{ marginLeft: "0.5rem" }}>
            Submit
          </button>
        </form>
      )}
      {systemIp && (
        <div>
          <p>
            <strong>System IP:</strong> {systemIp}
          </p>
          {loading && <p>Loading data...</p>}
          {error && <p style={{ color: "red" }}>Error: {error}</p>}
          {data && data.length > 0 ? (
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Last Updated</th>
                  <th style={thStyle}>Vdevice Data Key</th>
                  <th style={thStyle}>Vdevice Name</th>
                  <th style={thStyle}>QoS Map Name</th>
                  <th style={thStyle}>Vdevice Host Name</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>
                      {item["lastupdated"]
                        ? new Date(item["lastupdated"]).toLocaleString()
                        : "N/A"}
                    </td>
                    <td style={tdStyle}>{item["vdevice-dataKey"]}</td>
                    <td style={tdStyle}>{item["vdevice-name"]}</td>
                    <td style={tdStyle}>{item["qos-map-name"]}</td>
                    <td style={tdStyle}>{item["vdevice-host-name"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !loading && <p>No QoS Map info found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default QosMapInfo;

// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";

// function QosMapInfo() {
//   const { systemIp } = useParams();
//   const navigate = useNavigate();
//   const [ipInput, setIpInput] = useState(systemIp || "");
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (systemIp) {
//       setLoading(true);
//       fetch(`/api/edgepolicy/qosmapinfo/${systemIp}`)
//         .then((res) => {
//           if (!res.ok) {
//             throw new Error(`HTTP error ${res.status}`);
//           }
//           return res.json();
//         })
//         .then((json) => {
//           setData(json);
//           setLoading(false);
//         })
//         .catch((err) => {
//           setError(err.message);
//           setLoading(false);
//         });
//     }
//   }, [systemIp]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (ipInput.trim()) {
//       navigate(`/edgepolicy/qosmapinfo/${ipInput.trim()}`);
//     }
//   };

//   return (
//     <div style={{ padding: "1rem" }}>
//       <h1>QoS Map Info</h1>
//       {/* Prompt for a system IP if not provided */}
//       {!systemIp && (
//         <form onSubmit={handleSubmit}>
//           <label>
//             Enter System IP:
//             <input
//               type="text"
//               value={ipInput}
//               onChange={(e) => setIpInput(e.target.value)}
//               placeholder="e.g. 192.0.2.1"
//               style={{ marginLeft: "0.5rem" }}
//             />
//           </label>
//           <button type="submit" style={{ marginLeft: "0.5rem" }}>
//             Submit
//           </button>
//         </form>
//       )}
//       {systemIp && (
//         <div>
//           <p>
//             <strong>System IP:</strong> {systemIp}
//           </p>
//           {loading && <p>Loading data...</p>}
//           {error && <p style={{ color: "red" }}>Error: {error}</p>}
//           {data && (
//             <div>
//               <h3>Data:</h3>
//               <pre>{JSON.stringify(data, null, 2)}</pre>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default QosMapInfo;
