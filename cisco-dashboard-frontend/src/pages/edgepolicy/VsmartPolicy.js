// src/pages/edgepolicy/VsmartPolicy.js
import React, { useState, useEffect } from "react";

const thStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  backgroundColor: "#f2f2f2",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "8px",
};

function VsmartPolicy() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPolicies = async () => {
      setLoading(true);
      try {
        // Calls your Go endpoint: GET /api/edgepolicy/vsmart
        const response = await fetch("/api/edgepolicy/vsmart");
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setPolicies(data);
      } catch (err) {
        console.error("Failed to fetch vSmart policies:", err);
        setError("Failed to fetch vSmart policies");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>vSmart Policy</h1>
      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {policies.length > 0 && (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={thStyle}>Policy Name</th>
              <th style={thStyle}>Policy Version</th>
              <th style={thStyle}>Last Updated By</th>
              <th style={thStyle}>Created On</th>
              <th style={thStyle}>Activated</th>
              <th style={thStyle}>Policy Type</th>
              <th style={thStyle}>Policy Description</th>
              <th style={thStyle}>Last Updated On</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy, index) => (
              <tr key={index}>
                <td style={tdStyle}>{policy.policyName}</td>
                <td style={tdStyle}>{policy.policyVersion}</td>
                <td style={tdStyle}>{policy.lastUpdatedBy}</td>
                <td style={tdStyle}>
                  {policy.createdOn ? new Date(policy.createdOn).toLocaleString() : "N/A"}
                </td>
                <td style={tdStyle}>{policy.isPolicyActivated ? "Yes" : "No"}</td>
                <td style={tdStyle}>{policy.policyType}</td>
                <td style={tdStyle}>{policy.policyDescription}</td>
                <td style={tdStyle}>
                  {policy.lastUpdatedOn ? new Date(policy.lastUpdatedOn).toLocaleString() : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {policies.length === 0 && !loading && !error && <p>No policies found.</p>}
    </div>
  );
}

export default VsmartPolicy;



// import React, { useState, useEffect } from "react";

// function VsmartPolicy() {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/edgepolicy/vsmart`)
//       .then((res) => {
//         if (!res.ok) {
//           throw new Error(`HTTP error ${res.status}`);
//         }
//         return res.json();
//       })
//       .then((json) => {
//         setData(json);
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, []);

//   return (
//     <div style={{ padding: "1rem" }}>
//       <h1>vSmart Policy</h1>
//       {loading && <p>Loading data...</p>}
//       {error && <p style={{ color: "red" }}>Error: {error}</p>}
//       {data && (
//         <div>
//           <h3>Data:</h3>
//           <pre>{JSON.stringify(data, null, 2)}</pre>
//         </div>
//       )}
//     </div>
//   );
// }

// export default VsmartPolicy;
