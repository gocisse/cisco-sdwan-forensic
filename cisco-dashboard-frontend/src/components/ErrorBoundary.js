import React, { Component } from "react";
import { Box, Alert, AlertTitle, Button, Typography, Paper } from "@mui/material";
import { Refresh as RefreshIcon, BugReport as BugIcon } from "@mui/icons-material";

/**
 * ErrorBoundary catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console (could also send to error reporting service)
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
            p: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              maxWidth: 600,
              p: 4,
              textAlign: "center",
              border: 1,
              borderColor: "error.light",
              borderRadius: 2,
            }}
          >
            <BugIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
            
            <Typography variant="h5" gutterBottom>
              Something went wrong
            </Typography>
            
            <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
              <AlertTitle>Error Details</AlertTitle>
              {this.state.error?.message || "An unexpected error occurred"}
            </Alert>

            {this.state.errorInfo && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  maxHeight: 200,
                  overflow: "auto",
                  textAlign: "left",
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ fontFamily: "monospace", fontSize: "0.75rem", whiteSpace: "pre-wrap" }}
                >
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
              If this problem persists, please check the browser console for more details.
            </Typography>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
