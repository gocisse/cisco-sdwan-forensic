// src/pages/policy/ColorPolicyList.js

import React, { useEffect, useState } from "react";

function ColorPolicyList() {
  const [colors, setColors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchColors = async () => {
      try {
        // Make sure your backend server proxies `/api/` or you have a full URL
        const response = await fetch("/api/policy/color");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setColors(data);
      } catch (err) {
        console.error("Error fetching Color Policies:", err);
        setError("Failed to fetch Color Policies");
      }
    };

    fetchColors();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Color Policies</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {colors.length === 0 ? (
        <p>No color policies found.</p>
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
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Entries (Colors)</th>
            </tr>
          </thead>
          <tbody>
            {colors.map((item, index) => {
              const updatedDate = item.lastUpdated
                ? new Date(item.lastUpdated).toLocaleString()
                : "N/A";

              // Build a comma-separated list of color entries
              const colorEntries = item.entries
                ? item.entries.map((e) => e.color).join(", ")
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
                    {colorEntries}
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

export default ColorPolicyList;
