/**
 * Topology visualization constants
 */

// Transport / tunnel color map
export const TRANSPORT_COLOR = {
  "public-internet": "#E53935",
  "biz-internet": "#1E88E5",
  "3g": "#3357FF",
  lte: "#FF33A8",
  blue: "#007acc",
  green: "#43A047",
  red: "#FF0000",
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  custom1: "#8A2BE2",
  custom2: "#FF8C00",
  custom3: "#20B2AA",
  mpls: "#F4A460",
  "metro-ethernet": "#8A2BE2",
  private1: "#FFA500",
  private2: "#A52A2A",
  default: "#78909C",
};

// Device role helpers
export const CONTROL_ROLES = ["vmanage", "vsmart", "vbond"];

export const ROLE_STYLE = {
  vmanage: { bg: "#B71C1C", border: "#FF5252", icon: "\u{1F5A5}\uFE0F", shape: "round-rectangle" },
  vsmart: { bg: "#0D47A1", border: "#448AFF", icon: "\u{1F9E0}", shape: "round-rectangle" },
  vbond: { bg: "#E65100", border: "#FF9100", icon: "\u{1F517}", shape: "diamond" },
  vedge: { bg: "#1B5E20", border: "#69F0AE", icon: "\u{1F4E1}", shape: "ellipse" },
  cedge: { bg: "#1B5E20", border: "#69F0AE", icon: "\u{1F4E1}", shape: "ellipse" },
  unknown: { bg: "#37474F", border: "#78909C", icon: "\u2753", shape: "ellipse" },
};

// Cytoscape stylesheet
export const CY_STYLE = [
  {
    selector: "node",
    style: {
      content: "data(icon)",
      width: 50,
      height: 50,
      "background-color": "data(bgColor)",
      "border-width": 3,
      "border-color": "data(borderColor)",
      shape: "data(shape)",
      "font-weight": 600,
      "font-family": "'Inter', 'Roboto', sans-serif",
      color: "#E0E0E0",
      "text-outline-width": 2,
      "text-outline-color": "#0d1117",
      "text-outline-opacity": 0.9,
      "min-zoomed-font-size": 8,
      "overlay-padding": 6,
      "z-index": 10,
      "text-valign": "center",
      "text-halign": "center",
      "font-size": 22,
    },
  },
  {
    selector: "node.control",
    style: { width: 64, height: 64, "font-size": 28, "border-width": 4 },
  },
  {
    selector: "node.up",
    style: {
      "border-color": "#00E676",
      "shadow-blur": 12,
      "shadow-color": "#00E676",
      "shadow-opacity": 0.6,
    },
  },
  {
    selector: "node.down",
    style: {
      "border-color": "#FF1744",
      "shadow-blur": 12,
      "shadow-color": "#FF1744",
      "shadow-opacity": 0.8,
    },
  },
  {
    selector: "node.showLabel",
    style: {
      label: "data(label)",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-margin-y": 8,
      "font-size": 10,
      "font-weight": 500,
    },
  },
  {
    selector: "node.center",
    style: {
      width: 80,
      height: 80,
      "font-size": 32,
      "border-width": 5,
      "border-color": "#FFD600",
      "shadow-blur": 24,
      "shadow-color": "#FFD600",
      "shadow-opacity": 0.9,
      "z-index": 9999,
    },
  },
  {
    selector: "edge",
    style: {
      width: 2,
      "line-color": "data(color)",
      "target-arrow-color": "data(color)",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.7,
      "curve-style": "bezier",
      opacity: 0.75,
      "overlay-padding": 4,
    },
  },
  {
    selector: "edge.control",
    style: {
      "line-style": "dashed",
      "line-dash-pattern": [6, 4],
      width: 1.5,
      opacity: 0.55,
      "target-arrow-shape": "none",
    },
  },
  {
    selector: "edge.down",
    style: { "line-color": "#FF1744", "target-arrow-color": "#FF1744", opacity: 1 },
  },
  {
    selector: "edge.bfd",
    style: { width: 2.5, opacity: 0.85, "target-arrow-shape": "none" },
  },
  {
    selector: "edge.relationship",
    style: {
      width: "data(width)",
      opacity: 0.9,
      "target-arrow-shape": "none",
      "curve-style": "bezier",
    },
  },
  {
    selector: "edge.relationship.degraded",
    style: { "line-style": "dashed", "line-dash-pattern": [8, 4] },
  },
  {
    selector: "edge.relationship.down",
    style: { "line-style": "dotted", "line-dash-pattern": [2, 4] },
  },
  {
    selector: "edge.relationship.multi-type",
    style: { "line-style": "solid", "border-width": 1 },
  },
  {
    selector: "edge.omp-route",
    style: {
      width: "data(width)",
      opacity: 0.85,
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.6,
      "curve-style": "bezier",
    },
  },
  { selector: "node.dimmed", style: { opacity: 0.12 } },
  { selector: "edge.dimmed", style: { opacity: 0.06 } },
  { selector: "node.highlighted", style: { opacity: 1, "border-width": 5, "z-index": 999 } },
  { selector: "edge.highlighted", style: { opacity: 1, "z-index": 999 } },
  {
    selector: "node.selected-node",
    style: {
      "border-width": 6,
      "border-color": "#FFD600",
      "shadow-blur": 20,
      "shadow-color": "#FFD600",
      "shadow-opacity": 0.9,
      "z-index": 9999,
    },
  },
  { selector: "edge.selected-edge", style: { opacity: 1, "z-index": 9999 } },
];
