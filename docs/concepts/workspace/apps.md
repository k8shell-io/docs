---
sidebar_position: 3
title: App Manager
---

# App Manager

The app manager is a component of `k8shelld` that installs, starts, and supervises long-running processes inside the workspace. Its primary purpose is to provide pre-configured services that users can connect to from the Console — without any manual setup.

## Apps vs. containers

Apps are not containers. They are processes that run directly inside the main workspace container, managed by `k8shelld`. This is a deliberate choice: apps need to be reachable by the API Server's reverse proxy, which forwards browser traffic to in-workspace processes over the existing `k8shelld` gRPC channel. A process running in a separate container would require additional networking to achieve the same.

The distinction matters in practice:

| | Apps | Containers (Podman) |
|---|---|---|
| **Runtime** | Process in main container | Isolated container via Podman sidecar |
| **Managed by** | `k8shelld` app manager | User, via Podman CLI |
| **Console access** | Built-in via API Server reverse proxy | Manual tunnel setup required |
| **Lifecycle** | Starts at workspace boot, supervised | User-controlled |
| **Typical use** | VS Code Server, language servers | Build environments, service dependencies |

## Configuration

Apps are defined in the blueprint. Most workspaces define a single app, but multiple apps are supported. The entire app manager can be disabled with `enableApps: false`, in which case no apps are started and no install scripts are run regardless of individual app configuration.

```yaml
apps:
  vscode:
    enabled: false
    listen: 8080
    installAsRoot: true
    binary: "/usr/bin/code-server"
    versionCmd: ["/usr/bin/code-server", "--version"]
    versionRegex: "^([0-9]+\\.[0-9]+\\.[0-9]+)"
    install: |
      curl -fsSL https://code-server.dev/install.sh | sh
    start: ["/usr/bin/code-server", "--auth=none", "--bind-addr=127.0.0.1:8080", "."]
    restartPolicy: always
    protocol: "http"
```

### Fields

| Field | Description |
|---|---|
| `enabled` | Whether this app is active in this blueprint. |
| `listen` | Port the app listens on inside the workspace. The API Server reverse proxy forwards to this port. |
| `installAsRoot` | Run the install script as root. Required for package-manager-based installs. |
| `binary` | Path to the app binary. Used to detect whether the app is already installed. |
| `versionCmd` | Command to retrieve the installed version. |
| `versionRegex` | Regex to extract the version string from `versionCmd` output. Used for version tracking. |
| `install` | Shell script run once if the binary is absent. Handles installation. |
| `start` | Command and arguments to launch the app. |
| `restartPolicy` | `always` — restart on failure. |
| `protocol` | Protocol used by the reverse proxy (`http` or `https`). |

## Lifecycle

At workspace boot, the app manager runs for each enabled app:

1. **Install check** — if the binary is absent, the app manager runs the `install` script. The install script is a fallback — the preferred approach is to bake the app binary into the workspace image.
2. **Start** — launches the process using the `start` command.
3. **Supervision** — monitors the process and restarts it on failure according to `restartPolicy`.

The app binds to `127.0.0.1` (loopback only). The API Server reverse proxy forwards Console traffic to the app over the `k8shelld` gRPC channel — no port needs to be exposed outside the pod.

:::tip
When an app is installed at workspace startup via the `install` script, it writes to the container's ephemeral storage. In environments where workspaces are short-lived or frequently reprovisioned, this means the install runs on every new workspace. Baking the binary into the image avoids this overhead and keeps startup time predictable.
:::
