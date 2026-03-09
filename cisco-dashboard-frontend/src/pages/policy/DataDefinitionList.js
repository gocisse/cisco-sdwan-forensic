// src/pages/policy/DataDefinitionList.js

import React, { useEffect, useState } from "react";

function DataDefinitionList() {
  const [definitions, setDefinitions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDataDefinitions = async () => {
      try {
        const response = await fetch("/api/policy/definition/data");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setDefinitions(data);
      } catch (err) {
        console.error("Error fetching Data Definitions:", err);
        setError("Failed to fetch Data Definition Policies");
      }
    };

    fetchDataDefinitions();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Data Definition Policies</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {definitions.length === 0 ? (
        <p>No data definition policies found.</p>
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
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Definition ID</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Type</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Description</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Last Updated</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Owner</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Mode</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Optimized</th>
            </tr>
          </thead>
          <tbody>
            {definitions.map((item, index) => {
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

export default DataDefinitionList;
