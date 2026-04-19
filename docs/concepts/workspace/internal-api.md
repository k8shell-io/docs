---
sidebar_position: 4
title: Internal API
---

# Internal API

`k8shelld` exposes a REST API over a Unix socket at `/var/run/k8shelld.sock` for in-workspace tooling. This is the interface used by `kbox`, the workspace CLI, and any other local processes that need programmatic access to workspace state or operations.

## Access

The socket is accessible only from within the workspace container. No authentication is required — the assumption is that any process running inside the container is already authorized by virtue of having shell access. This makes the API suitable for user-facing tooling and scripts without requiring token management.

## Endpoints

All endpoints are prefixed with `/api/v1`.

<StandardInlineTable data={`
columns:
  - header: Method
    width: 80px
  - header: Path
    width: 200px
  - header: kbox Command
    width: 190px
  - header: Wrapper
    width: 100px
  - header: Source
rows:
  - - "\`GET\`"
    - "\`/identity\`"
    - "\`kbox identity\`, \`user\`"
    - ""
    - "Identity JWT claims"
  - - "\`GET\`"
    - "\`/sysinfo\`"
    - "\`kbox info\`, \`uptime\`"
    - "\`uptime\`"
    - "cgroups, /proc, mounts"
  - - "\`GET\`"
    - "\`/splash\`"
    - "\`kbox splash\`"
    - ""
    - "Blueprint configuration"
  - - "\`GET\`"
    - "\`/sessions\`"
    - "\`kbox last\`"
    - "\`last\`"
    - "API Server proxy"
  - - "\`GET\`"
    - "\`/ssh/channels\`"
    - "\`kbox channels\`"
    - ""
    - "k8shelld SSH channel state"
  - - "\`GET\`"
    - "\`/creds\`"
    - "\`kbox credentials\`"
    - ""
    - "API Server proxy"
  - - "\`GET\`"
    - "\`/apps\`"
    - "\`kbox apps list\`"
    - ""
    - "App manager"
  - - "\`POST\`"
    - "\`/apps/{name}/install\`"
    - "\`kbox apps install\`"
    - ""
    - "App manager"
  - - "\`POST\`"
    - "\`/apps/{name}/start\`"
    - "\`kbox apps start\`"
    - ""
    - "App manager"
  - - "\`POST\`"
    - "\`/apps/{name}/stop\`"
    - "\`kbox apps stop\`"
    - ""
    - "App manager"
  - - "\`GET\`"
    - "\`/apps/{name}/logs\`"
    - "\`kbox apps logs\`"
    - ""
    - "App manager log files"
  - - "\`GET\`"
    - "\`/logs\`"
    - "\`kbox logs\`"
    - ""
    - "k8shelld daemon logs"
  - - "\`POST\`"
    - "\`/shutdown\`"
    - "\`kbox shutdown\`"
    - "\`shutdown\`"
    - "gRPC CommandService → Provisioner"
  - - "\`POST\`"
    - "\`/validate\`"
    - "\`kbox validate\`"
    - ""
    - "API Server proxy"
`} />

:::note
The `/creds` and `/sessions` endpoints require the API Server to be enabled in the deployment. When the API Server is not available, `kbox credentials`, `kbox last`, and the `last` wrapper are not functional.
:::

## kbox CLI

The `kbox` CLI is a thin wrapper around this API. Each subcommand corresponds to one or more REST endpoints. The CLI handles formatting the JSON responses into human-readable output and provides a consistent interface for workspace operations.

System tool wrappers (`uptime`, `last`, `shutdown`) are automatically generated during the bootstrap phase by running `kbox tools-init`, which creates workspace-aware replacements for standard Linux utilities.

```
kbox is a set of tools for k8shell system operations.

Usage:
  kbox [flags]
  kbox [command]

Available Commands:
  apps        Manage workspace apps
  channels    Display channels
  credentials Credentials helpers
  identity    Display workspace identity claims
  info        Display workspace system info
  last        Display last user sessions
  logs        Display workspace logs
  shutdown    Shutdown the workspace
  splash      Display the workspace splash message
  tools-init  Generate wrapper scripts for system tools
  uptime      Display workspace uptime
  user        Display user information
  validate    Validate k8shell file

Flags:
  -h, --help            help for kbox
      --socket string   k8shelld unix socket path (default "/var/run/k8shelld.sock")
  -v, --version         Show version and exit
```

The socket path defaults to `/var/run/k8shelld.sock` but can be overridden with the `--socket` flag for testing or non-standard deployments.
