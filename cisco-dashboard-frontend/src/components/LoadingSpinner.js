import React from "react";

const spinnerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "3rem",
  color: "#666",
};

const dotStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #e0e0e0",
  borderTop: "4px solid #1A73E8",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
  marginBottom: "1rem",
};

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div style={spinnerStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={dotStyle} />
      <span>{message}</span>
    </div>
  );
}

export default LoadingSpinner;
