// src/pages/policy/DataPrefixAllList.js

import React, { useEffect, useState } from "react";

function DataPrefixAllList() {
  const [prefixAll, setPrefixAll] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDataPrefixAll = async () => {
      try {
        const response = await fetch("/api/policy/list/dataprefixall");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setPrefixAll(data);
      } catch (err) {
        console.error("Error fetching Data Prefix All policies:", err);
        setError("Failed to fetch Data Prefix All policies");
      }
    };

    fetchDataPrefixAll();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Data Prefix All Policies</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {prefixAll.length === 0 ? (
        <p>No Data Prefix All policies found.</p>
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
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>List ID</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Type</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Description</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Last Updated</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>IP Prefix Entries</th>
            </tr>
          </thead>
          <tbody>
            {prefixAll.map((item, index) => {
              const updatedDate = item.lastUpdated
                ? new Date(item.lastUpdated).toLocaleString()
                : "N/A";

              // Build a comma-separated list of IP prefixes
              const ipPrefixes = item.entries
                ? item.entries.map((e) => e.ipPrefix).join(", ")
                : "N/A";

              return (
                <tr key={index}>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.name || "N/A"}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    {item.listId || "N/A"}
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
                    {ipPrefixes}
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

export default DataPrefixAllList;
