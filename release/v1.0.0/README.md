# Cisco SD-WAN Forensics Dashboard - v1.0.0

## Release Notes

### Features
- **Policy Forensics**: Compare local vs centralized policies per device
  - Local policies: Access Lists, QoS Maps, Policers, Zone-Based Firewall
  - Centralized policies: Data, Control, and App-Route policies from vSmart
  - Site-ID based policy resolution with numeric range support
- **SLA & Traffic Analysis**: Real-time and historical app-route and tunnel health monitoring
- **Live Interface Usage**: SSE-based real-time interface statistics
- **Template Hierarchy**: Device template visualization with fallback resolution
- **Topology Views**: Network and site-specific topology graphs
- **Real-Time Monitoring**: BFD, connections, control plane, IPsec, tunnels, routes, TLOCs

### Bug Fixes (v1.0.0)
- Fixed policer field mapping (vManage returns `name`, `rate`, `burst`, `oos-action`)
- Fixed centralized policy parsing (siteLists is plain string array)
- Fixed SLA dashboard live data field mapping (SSE data uses hyphenated field names)
- Fixed interface status colors (case-insensitive "Up"/"Down" comparison)
- Fixed numeric site-ID range comparison for policy matching
- Fixed template resolution with name-based fallback

## Installation

### Prerequisites
- vManage API access (HTTPS URL, username, password)
- Network connectivity to vManage

### Quick Start

#### macOS (Intel)
```bash
chmod +x cisco-forenzic-darwin-amd64
./cisco-forenzic-darwin-amd64
```

#### macOS (Apple Silicon)
```bash
chmod +x cisco-forenzic-darwin-arm64
./cisco-forenzic-darwin-arm64
```

#### Linux (x86_64)
```bash
chmod +x cisco-forenzic-linux-amd64
./cisco-forenzic-linux-amd64
```

#### Linux (ARM64)
```bash
chmod +x cisco-forenzic-linux-arm64
./cisco-forenzic-linux-arm64
```

#### Windows
```cmd
cisco-forenzic-windows-amd64.exe
```

### Configuration

On first run, you'll be prompted for:
- **vManage URL**: e.g., `https://192.168.110.4`
- **Username**: vManage admin username
- **Password**: vManage admin password
- **Port**: Dashboard port (default: `6060`)

The application will:
1. Authenticate with vManage
2. Start the backend API server
3. Serve the frontend dashboard at `http://localhost:<port>`

### Usage

1. Open your browser to `http://localhost:6060` (or your configured port)
2. Navigate using the sidebar:
   - **Dashboard**: Device overview
   - **Policy Forensics**: Compare local vs centralized policies
   - **SLA & Traffic**: App-route and tunnel health analysis
   - **Topology**: Network and site topology views
   - **Real-Time**: Live monitoring (BFD, interfaces, connections, etc.)
   - **Policies**: Global policy lists (SLA, VPN, TLOC, etc.)

### Architecture

- **Backend**: Go API server proxying vManage REST API + SSE broadcast
- **Frontend**: React SPA with Material-UI, served from embedded `frontend/` directory
- **Data Flow**: Browser → Go Backend → vManage API

### Troubleshooting

**Connection Issues**
- Verify vManage URL is accessible
- Check credentials are correct
- Ensure vManage API is enabled

**Policy Forensics showing 0 policies**
- Check device has site-id assigned
- Verify vSmart policies have site lists configured
- Review backend logs for policy resolution details

**Policers not displaying**
- Verify device has policers configured via CLI or template
- Check backend logs for raw vManage response

### Support

For issues, check backend logs (stdout) for detailed error messages and API responses.

---

**Version**: 1.0.0  
**Build Date**: 2026-03-09  
**Go Version**: 1.x  
**React Version**: 18.x
