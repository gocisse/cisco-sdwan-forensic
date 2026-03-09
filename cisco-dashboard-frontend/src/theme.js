import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1B2A4A",
      light: "#2C3E6B",
      dark: "#0F1B33",
      contrastText: "#fff",
    },
    secondary: {
      main: "#00BCB4",
      light: "#33C9C3",
      dark: "#00847E",
    },
    success: { main: "#2e7d32" },
    warning: { main: "#e65100" },
    error: { main: "#c62828" },
    background: {
      default: "#F4F6F8",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1B2A4A",
      secondary: "#637381",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 500, color: "#637381" },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1B2A4A",
          color: "#FFFFFF",
          borderRight: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: "2px 8px",
          "&.Mui-selected": {
            backgroundColor: "rgba(0, 188, 180, 0.15)",
            "&:hover": { backgroundColor: "rgba(0, 188, 180, 0.25)" },
          },
          "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#F4F6F8",
            fontWeight: 600,
            color: "#1B2A4A",
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          },
        },
      },
    },
  },
});

export default theme;
