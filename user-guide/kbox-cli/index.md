---
sidebar_label: Overview
sidebar_position: 1
---

# kbox CLI

`kbox` is the in-workspace command-line interface. It communicates exclusively with [`k8shelld`](/concepts/workspace/), the in-workspace daemon, through the [Internal API](/concepts/workspace/api#internal-api) — a REST API served over a Unix socket at `/var/run/k8shelld.sock`. Because the socket is only accessible from within the [workspace](/concepts/workspace/) container, `kbox` can only run from an active workspace session; it cannot be used remotely.

Each subcommand maps to one or more REST endpoints. `kbox` handles JSON formatting, provides human-readable output, and gives a consistent interface for workspace operations without requiring any authentication tokens — access to the socket already implies shell access.

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

The socket path defaults to `/var/run/k8shelld.sock` and can be overridden with `--socket` for testing or non-standard deployments.

## System tool wrappers

Several standard Linux utilities have workspace-aware replacements installed during the [bootstrap phase](/concepts/workspace/init-bootstrap):

- **`uptime`** — delegates to `kbox uptime`, which reads cgroup and `/proc` data via the Internal API rather than kernel uptime.
- **`last`** — delegates to `kbox last`, which queries the API Server for session history instead of reading `/var/log/wtmp`.
- **`shutdown`** — delegates to `kbox shutdown`, which sends a shutdown command via `k8shelld`'s `CommandService` to the Provisioner rather than calling the kernel.

These wrappers are placed on `PATH` during bootstrap so that scripts and tools expecting standard Linux utilities behave correctly inside the workspace.
