---
sidebar_position: 3
---

# Installation

K8Shell provides multiple installation methods to suit different environments and use cases.

## Prerequisites

Before installing K8Shell, ensure you have:

- **Kubernetes cluster access** - A running Kubernetes cluster (local or remote)
- **kubectl** - Kubernetes command-line tool installed and configured
- **Node.js** - Version 18.0 or higher (for certain features)

## Installation Methods

### Option 1: Binary Installation (Recommended)

Download the latest binary for your platform:

```bash
# Linux
curl -LO "https://github.com/k8shell-io/k8shell/releases/latest/download/k8shell-linux-amd64"
chmod +x k8shell-linux-amd64
sudo mv k8shell-linux-amd64 /usr/local/bin/k8shell

# macOS
curl -LO "https://github.com/k8shell-io/k8shell/releases/latest/download/k8shell-darwin-amd64"
chmod +x k8shell-darwin-amd64
sudo mv k8shell-darwin-amd64 /usr/local/bin/k8shell

# Windows
# Download from GitHub releases and add to PATH
```

### Option 2: Package Managers

#### Using Homebrew (macOS/Linux)

```bash
brew tap k8shell-io/tap
brew install k8shell
```

#### Using apt (Ubuntu/Debian)

```bash
curl -s https://packagecloud.io/install/repositories/k8shell/stable/script.deb.sh | sudo bash
sudo apt-get install k8shell
```

#### Using yum (RHEL/CentOS)

```bash
curl -s https://packagecloud.io/install/repositories/k8shell/stable/script.rpm.sh | sudo bash
sudo yum install k8shell
```

### Option 3: Go Install

If you have Go 1.19+ installed:

```bash
go install github.com/k8shell-io/k8shell@latest
```

## Verification

Verify your installation:

```bash
k8shell version
```

You should see output similar to:

```
K8Shell version v1.0.0
Build: 2024-10-02T10:30:00Z
Git commit: abc123def456
```

## Configuration

### Basic Setup

Initialize K8Shell in your project:

```bash
k8shell init
```

This creates a basic configuration file (`.k8shell.yaml`) in your current directory.

### Cluster Connection

K8Shell uses your existing kubectl configuration. Verify cluster access:

```bash
k8shell cluster info
```

### Next Steps

- [Getting Started Guide](./getting-started)
- [Configuration Reference](./configuration)
- [CLI Commands](./cli-reference)