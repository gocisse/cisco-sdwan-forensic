// src/pages/policy/QosMapListPage.js

import React, { useEffect, useState } from "react";

function QosMapListPage() {
  const [qosMaps, setQosMaps] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQosMaps = async () => {
      try {
        // Adjust if needed for your environment
        const response = await fetch("/api/policy/definition/qosmap");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setQosMaps(data);
      } catch (err) {
        console.error("Error fetching QoS Map policies:", err);
        setError("Failed to fetch QoS Map policies");
      }
    };

    fetchQosMaps();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>QoS Map Policies</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {qosMaps.length === 0 ? (
        <p>No QoS Map policies found.</p>
      ) : (
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Definition ID
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Type</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Description
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Last Updated
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Owner</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Mode</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Optimized
              </th>
            </tr>
          </thead>
          <tbody>
            {qosMaps.map((item, index) => {
              const updatedDate = item.lastUpdated
                ? new Date(item.lastUpdated).toLocaleString()
                : "N/A";

              return (
                <tr key={index}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.name || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.definitionId || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.type || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.description || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {updatedDate}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.owner || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.mode || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.optimized || "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default QosMapListPage;
