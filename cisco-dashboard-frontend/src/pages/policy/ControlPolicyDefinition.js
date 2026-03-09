import React, { useEffect, useState } from "react";

function ControlPolicyDefinition() {
  const [policies, setPolicies] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/policies/control") // Calls the working Go API
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setPolicies(data))
      .catch((err) => {
        console.error("Failed to fetch Control Policies:", err);
        setError("Failed to fetch Control Policies");
      });
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Control Policy Definitions</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {policies.length > 0 ? (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>Last Updated</th>
              <th style={thStyle}>Reference Count</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy, index) => (
              <tr key={index}>
                <td style={tdStyle}>{policy.name}</td>
                <td style={tdStyle}>{policy.type}</td>
                <td style={tdStyle}>{policy.description || "N/A"}</td>
                <td style={tdStyle}>{policy.owner}</td>
                <td style={tdStyle}>
                  {policy.lastUpdated
                    ? new Date(policy.lastUpdated).toLocaleString()
                    : "N/A"}
                </td>
                <td style={tdStyle}>{policy.referenceCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No Control Policies found.</p>
      )}
    </div>
  );
}

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

export default ControlPolicyDefinition;
