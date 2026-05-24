---
sidebar_position: 10
---

# kbox CLI

`kbox` is the workspace CLI. It is a thin wrapper around the [Internal API](./api.md#internal-api) served by `k8shelld` over a Unix socket at `/var/run/k8shelld.sock`. Each subcommand corresponds to one or more REST endpoints; `kbox` handles formatting the JSON responses into human-readable output and provides a consistent interface for workspace operations.

## Commands

```
kbox is a set of tools for k8shell system operations.

Usage:
  kbox [flags]
  kbox [command]

Available Commands:
  apps        Manage workspace apps
  attach      Attach to a detached shell session
  credentials Credentials helpers
  detach      Detach from the current shell session (keeps the process alive)
  identity    Display workspace identity claims
  info        Display workspace system info
  last        Display last user sessions
  logs        Display workspace logs
  shutdown    Shutdown the workspace
  splash      Display the workspace splash message
  streams     Display streams
  uptime      Display workspace uptime
  user        Display user information
  validate    Validate k8shell file

Flags:
  -h, --help            help for kbox
      --socket string   k8shelld unix socket path (default "/var/run/k8shelld.sock")
  -v, --version         Show version and exit

Use "kbox [command] --help" for more information about a command.
```

The socket path defaults to `/var/run/k8shelld.sock` but can be overridden with `--socket` for testing or non-standard deployments.

## System tool wrappers

Several standard Linux utilities have workspace-aware replacements generated during the bootstrap phase:

- **`uptime`** — delegates to `kbox uptime`, which reads cgroup and `/proc` data via the Internal API rather than kernel uptime.
- **`last`** — delegates to `kbox last`, which queries the API Server for session history instead of reading `/var/log/wtmp`.
- **`shutdown`** — delegates to `kbox shutdown`, which sends a shutdown command via `k8shelld`'s `CommandService` to the Provisioner rather than calling the kernel.

These wrappers are placed on `PATH` during bootstrap so that scripts and tools expecting standard Linux utilities behave correctly inside the workspace.

## kbox info

`kbox info` displays a summary of workspace state, resource usage, and storage. It queries the `/sysinfo` endpoint and formats the response into labelled groups.

```
kbox info [--json]
```

Pass `--json` to receive the raw response as pretty-printed JSON instead of the default table output.

Output is divided into four groups:

**Workspace** — static metadata sourced from environment variables set by the Provisioner at pod creation time.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 140px
  - header: Description
rows:
  - - "Name"
    - "Workspace name (\`WORKSPACE\` env var)."
  - - "Start time"
    - "Time the workspace process started, derived from the uptime timestamp."
  - - "Provisioner"
    - "Provisioner version that created the workspace (\`PROVISIONER_VERSION\` env var)."
  - - "Image"
    - "Container image reference (\`IMAGE\` env var)."
  - - "Blueprint"
    - "Blueprint used to provision the workspace (\`BLUEPRINT\` env var)."
  - - "Repository"
    - "Source repository linked to this workspace, if any."
  - - "Users"
    - "Number of active sessions."
`} />

**CPU and Memory** — live resource consumption read from cgroups and `/proc`.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 140px
  - header: Description
rows:
  - - "CPU usage"
    - "Used millicores vs. cgroup CPU limit with percentage."
  - - "Load average"
    - "1-minute, 5-minute, and 15-minute load averages."
  - - "Memory usage"
    - "Used MiB vs. cgroup memory limit with percentage."
`} />

**Storage** — one row per mounted filesystem, sorted by mount point. Each row shows used / total (percentage) and, where available, the filesystem type, source device, and whether the mount is read-only.

**Podman** — present only when the [Podman sidecar](./podman-sidecar.md) is available. Shows the socket path, API version, Podman version, graph driver, graph root, run root, container counts (total / running / paused / stopped), and per-category disk usage (images, container layers, volumes, build cache, total).

## kbox streams

`kbox streams` lists all active and recent streams created by incoming connections from the SSH Proxy or API Server.

```
kbox streams [--sort <fields>] [--json] [--no-ansi]
```

<StandardInlineTable data={`
columns:
  - header: Flag
    width: 120px
  - header: Default
    width: 120px
  - header: Description
rows:
  - - "\`--sort\`"
    - "\`-created\`"
    - "Comma-separated list of fields to sort by. Prefix a field name with \`-\` for descending order."
  - - "\`--json\`"
    - "\`false\`"
    - "Output as JSON instead of a table."
  - - "\`--no-ansi\`"
    - "\`false\`"
    - "Disable ANSI colour formatting."
`} />

Each row represents one stream. The `id` field is prefixed with a short type code that identifies the stream kind:

<StandardInlineTable data={`
columns:
  - header: Prefix
    width: 120px
  - header: Type
    width: 120px
  - header: Description
rows:
  - - "\`sh-\`"
    - "Shell"
    - "Interactive PTY shell session."
  - - "\`ws-\`"
    - "WebSocket"
    - "Shell terminal session over WebSocket."
  - - "\`pf-\`"
    - "Port forward"
    - "TCP port-forwarding tunnel."
  - - "\`ux-\`"
    - "Unix socket"
    - "Unix domain socket proxy."
  - - "\`ex-\`"
    - "Exec"
    - "Arbitrary command execution or SFTP session."
  - - "\`rp-\`"
    - "Reverse proxy"
    - "Reverse proxy tunnel."
`} />

The table columns are:

<StandardInlineTable data={`
columns:
  - header: Column
    width: 120px
  - header: Description
rows:
  - - "\`id\`"
    - "Stream ID including the type prefix."
  - - "\`created\`"
    - "Time the stream was opened."
  - - "\`duration\`"
    - "How long the stream has been open."
  - - "\`status\`"
    - "Current state: \`ACTIVE\` (running), \`DETACHED\` (shell kept alive after client disconnect), or \`STOPPED\` (ended). DETACHED rows are highlighted in yellow; STOPPED rows are shown in grey and are removed from the list after one minute."
  - - "\`bytes_in\`"
    - "Bytes received from the client."
  - - "\`bytes_out\`"
    - "Bytes sent to the client."
  - - "\`params\`"
    - "Stream parameters. For DETACHED shell sessions includes \`ttl=<remaining>\` showing how long the session will be kept alive."
`} />

## kbox detach

`kbox detach` detaches from the current PTY session without terminating it. The shell process continues running in the background and can be reconnected to later with `kbox attach`. The session ID is read from the `K8SHELL_SESSION_ID` environment variable, which is set automatically when a PTY session starts.

```
kbox detach [--ttl <duration>]
```

The optional `--ttl` flag overrides how long the detached session is kept alive before being garbage-collected (e.g. `30m`, `1h`, `0` for no expiry). If omitted, the server's configured default applies. The server rejects values that exceed its configured maximum.

The keyboard shortcut **Ctrl+A D** (same as GNU screen) sends the detach signal while inside an attached session without needing to run `kbox detach` directly.

## kbox attach

`kbox attach` reconnects to a detached shell session.

```
kbox attach [session-id]
```

If no session ID is given, `kbox attach` fetches the list of detached sessions and — if there is more than one — displays an interactive selection table showing the session ID, shell binary, PID, creation time, and time since detach. With a single detached session it attaches immediately without prompting.

**How the connection works**

Unlike other `kbox` commands that make a regular HTTP request and read the JSON response, `attach` uses HTTP connection hijacking. It sends a request to `POST /shells/{id}/attach` and then takes over the raw TCP connection from the HTTP client, bypassing all further HTTP framing. From that point the connection becomes a raw bidirectional byte pipe directly into the shell's PTY:

- **stdin → connection** — every keystroke is forwarded as-is to the shell.
- **connection → stdout** — all shell output is written directly to the terminal.

The terminal is put into raw mode for the duration of the session so that control characters (arrow keys, Ctrl sequences, etc.) are forwarded unmodified rather than being interpreted by the local line discipline.

Terminal resize events (`SIGWINCH`) are handled out-of-band: when the local terminal is resized, `kbox attach` sends a `POST /shells/{id}/resize` request with the new dimensions so `k8shelld` can update the PTY window size accordingly.

The detach shortcut **Ctrl+A D** is intercepted server-side. When `k8shelld` sees it in the byte stream it closes the hijacked connection cleanly, leaving the shell running. The client side detects the connection close and restores the terminal to its original state.

## kbox logs

`kbox logs` displays the `k8shelld` daemon logs from inside the workspace.

```
kbox logs
```

`k8shelld` writes its logs both to stdout (making them available via `kubectl logs` from outside the cluster) and to an in-process ring buffer. `kbox logs` reads from that ring buffer via the Internal API. This means `kbox logs` and `kubectl logs` show the same log entries, so either can be used to inspect daemon activity.

The ring buffer has a fixed line limit, so `kbox logs` only returns the most recent entries. `kubectl logs` retains a longer history depending on the cluster's logging backend and the pod's log rotation policy — use `kubectl logs` when you need to look further back in time.

## kbox shutdown

`kbox shutdown` stops the workspace from inside.

```
kbox shutdown [--delete]
```

`kbox shutdown` calls the Internal API (`POST /shutdown`), which `k8shelld` handles by sending a `shutdown` command over the external gRPC `CommandService` channel to whichever service initiated the connection — either SSH Proxy or API Server. That service then calls the Provisioner to act on the workspace. This design is deliberate: the API Server is optional in some deployments, and routing the command through the initiating service ensures shutdown works regardless of whether the API Server is present.

**Standalone pod workspaces**

By default, `kbox shutdown` performs a *soft shutdown*: only the workspace pod is deleted. All other workspace resources — PVCs, ConfigMaps, NetworkPolicies — are left intact. When the workspace is started again, the Provisioner recreates only the pod, allowing persistent volumes to be reattached and their data retained.

Pass `--delete` to perform a full workspace deletion, which removes the pod and all associated resources.

**Injected workspaces**

For workspaces [injected into an existing workload](./deployment-models.md), soft shutdown is not available. `kbox shutdown --delete` must be used, which triggers an eject — removing the injected sidecar and all supporting resources via a rolling update on the target workload.
