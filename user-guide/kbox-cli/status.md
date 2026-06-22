---
sidebar_label: Status and Info
sidebar_position: 2
---

# Status and Info

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

**Podman** — present only when the [Podman sidecar](/concepts/workspace/podman-sidecar) is available. Shows the socket path, API version, Podman version, graph driver, graph root, run root, container counts (total / running / paused / stopped), and per-category disk usage (images, container layers, volumes, build cache, total).

## kbox uptime

`kbox uptime` reports how long the workspace has been running. Unlike the standard `uptime` binary, it reads cgroup CPU time and `/proc` data via the Internal API rather than kernel-level uptime, giving an accurate figure relative to the workspace process start time rather than the node boot time.

```
kbox uptime [--json]
```

The `uptime` wrapper installed during bootstrap calls `kbox uptime` transparently so that scripts using `uptime` work as expected inside the container.

## kbox splash

`kbox splash` prints the workspace splash message — the text shown to users when they first connect to the workspace via SSH. The message is sourced from the blueprint configuration and is stored in `k8shelld` at startup.

```
kbox splash
```
