---
sidebar_position: 4
title: External API
---

# External API

`k8shelld` exposes a gRPC API over a TLS-secured channel that SSH Proxy and API Server use to interact with the workspace. This is the primary external interface — all remote access to shell sessions, command execution, port forwarding, and workspace introspection flows through this API.

## Authentication

Every API call requires a valid JWT token passed in the request metadata. The token is issued by the Identity service and contains the user's identity claims (username, UID, GID, email). `k8shelld` verifies the token signature on every request using the public key mounted at `/run/secrets/jwt-verifier/public.pem`. Expired or tampered tokens are rejected.

## Services

The API is organized into four gRPC services, each handling a distinct aspect of workspace interaction.

### SystemService

Provides system-level information and handshake validation.

**`Handshake`** — validates client version compatibility and token acceptance. Returns the server version and whether the connection is accepted. This is the first call made by clients to establish that they can communicate with the daemon.

**`SystemInfo`** — returns real-time workspace metrics: CPU and memory usage, uptime, load averages, mounted storage usage (including PVC-backed volumes), and Podman/Docker storage breakdown if the sidecar is enabled. This is what `kbox info` queries internally.

### SshService

Handles all interactive and forwarding operations initiated over SSH.

**`Shell`** — bidirectional streaming RPC for interactive shell sessions. The client sends a start request specifying the user, shell command, environment variables, PTY dimensions, and optionally a container reference (for shells inside Podman containers). The request can include a `lock_id` from `AcquireSession` to attach to an existing shell session, and a `detach_on_close` flag to keep the session running after the client disconnects. `k8shelld` spawns the shell (or attaches to an existing one) and streams stdin/stdout/stderr over the connection. The client sends data (keystrokes) upstream; the server sends output downstream. Terminal resize events are handled via a separate `ResizeTerminal` call.

**`Exec`** — bidirectional streaming for non-interactive command execution. The client specifies the command, shell binary (if wrapping in a shell is needed), user, and environment. The server streams stdout and stderr separately and returns the exit code when the process terminates. The client can send signals to the running process mid-execution.

**`PortForward`** — bidirectional streaming for TCP port forwarding (SSH `-L` local forwarding). The client sends a destination IP and port in the initial message, then streams data to forward. `k8shelld` opens a TCP connection to the destination inside the workspace network namespace and relays data in both directions. This allows clients to tunnel connections to services running inside the workspace or Podman containers.

**`UnixSocket`** — bidirectional streaming for Unix socket forwarding. Supports two modes: `LISTEN` (server listens on a socket path and accepts connections) and `DIAL` (client connects to an existing socket). This is used primarily for SSH agent forwarding, where the SSH Proxy forwards the user's local SSH agent socket into the workspace.

**`GetCWD`** — returns the current working directory for a running shell session. The client provides a shell ID; the server responds with the absolute path of the shell's working directory. The Console uses this to synchronize the file system tree view with the terminal's current directory.

**`AcquireSession`** — acquires an exclusive lock on an existing shell session by session ID, enabling a client to attach to it. Returns a `lock_id` on success, which must be provided in the `Shell` start request to complete the attachment. Returns a failure reason if the session does not exist or is already acquired by another client. This enables session reconnection workflows, such as restoring terminal sessions in the web console after a browser refresh or network interruption.

### AppService

Manages apps defined in the blueprint.

**`ListApps`** — returns the status of all apps: name, running state, version, listen port, PID, uptime, restart count, and protocol. This is what the Console queries to display app status.

**`InstallApp`** / **`StartApp`** / **`StopApp`** — control app lifecycle. Install runs the install script if the binary is missing (or forces reinstall). Start launches the app process. Stop terminates it. These are typically invoked by administrators or automation, not end users.

**`GetLogs`** / **`GetLogsStream`** — fetch app logs. `GetLogs` returns the full log as a single response; `GetLogsStream` tails the log line-by-line in real time. Both support querying runtime logs or install logs.

### CommandService

Provides a bidirectional command/reply channel for `k8shelld` to send commands to the calling service (SSH Proxy or API Server) that require implementation outside the workspace. Each message carries a command ID for request/response correlation.

The primary use case is the `shutdown` command: when a user runs `shutdown` from inside the workspace, `k8shelld` sends the command over this channel to the calling service, which then invokes the provisioner to delete the workspace pod via the Kubernetes API. This ensures separation of concerns — `k8shelld` does not interact with the Kubernetes API directly; pod lifecycle management is handled by the provisioner. The mechanism works regardless of whether the API Server is deployed, since SSH Proxy can also handle the command and forward it to the provisioner.

## Transport

The gRPC server listens on a pod-internal address and uses TLS when cert-manager is enabled. The certificate and key are mounted from `/etc/tls/k8shelld` and are signed by the cluster CA. Service-to-service authorization is implemented using JWT tokens issued by Kubernetes OIDC — SSH Proxy and API Server present these tokens in request metadata.
