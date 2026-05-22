---
sidebar_position: 2
---

# Access

The API Server is exposed through a Kubernetes Ingress that handles two hostnames. The base hostname (e.g. `app.k8shell.dev`) serves all standard API traffic. A wildcard subdomain (e.g. `*.app.k8shell.dev`) routes traffic to apps running inside workspaces, where the subdomain prefix identifies the target workspace and app port.

```
app.k8shell.dev          → API Server (platform API)
*.app.k8shell.dev        → API Server (workspace app reverse proxy)
```

The API Server handles three distinct traffic types on these hostnames.

## Plain HTTP

Standard request-response calls used by the CLI, Console, and automation. These cover the majority of platform operations:

- **User management** — find, onboard, and update users via the [Identity service](/concepts/identity).
- **Workspace operations** — list, create, start, stop, and delete workspaces via the [Provisioner](/concepts/provisioner).
- **Session access** — retrieve current and past sessions from the [Session service](/concepts/session).
- **Authentication flows** — login redirects, OAuth callbacks, token exchange, and logout.

All requests are authenticated before dispatch. See [Authentication](./authentication.md) for how credentials are resolved.

A full reference of paths and methods will be available on the API reference page.

## WebSocket

WebSocket connections power the **CloudShell** component of the browser-based Console. The connection uses the `cloudshell-v1` subprotocol and all messages are transmitted as binary frames serialized with **Protocol Buffers**. Using protobuf over binary WebSocket frames avoids the overhead of JSON serialization for the high-frequency, low-latency data that terminal I/O generates.

Each WebSocket connection is shared by two components that handle different message types over the same connection:

<StandardInlineTable data={`
columns:
  - header: Component
    width: 160px
  - header: Messages in (browser → server)
  - header: Messages out (server → browser)
  - header: k8shelld RPC
    width: 200px
rows:
  - - "Terminal"
    - "\`TerminalInput\`, \`TerminalResizeMessage\`"
    - "\`TerminalOutput\`, \`TerminalError\`"
    - "\`RunShell\`, \`ResizeTerminal\`"
  - - "File explorer"
    - "\`FileExplorerMessage\` (commands)"
    - "\`FileExplorerMessage\` (responses)"
    - "\`RunExec\` (SFTP subsystem)"
`} />

- **Terminal** — streams PTY input and output between the browser and the workspace shell via k8shelld's `RunShell` gRPC call. Resize events arriving as `TerminalResizeMessage` frames are forwarded to k8shelld via `ResizeTerminal`, keeping the PTY dimensions in sync with the browser window.
- **File explorer** — handles `FileExplorerMessage` frames for file system operations. It starts an SFTP subsystem inside the workspace by executing the SFTP binary via k8shelld's `RunExec`, then bridges the `pkg/sftp` client over that connection. This gives the Console seamless file transfer capability — upload, download, and directory browsing — without any separate transfer protocol.

### Session persistence across page reloads

Terminal sessions are identified by a session Id that is persisted in the user's session store, keyed by workspace and browser tab. When a WebSocket connection is closed — for example on a page reload — the underlying PTY session in the workspace is not terminated immediately. Instead, k8shelld keeps it alive in a detached state. When the browser reconnects, the API Server looks up the stored session Id and re-attaches to it, allowing the shell and any running processes to be preserved across reloads. This relies on the [detach/attach mechanism](/concepts/workspace/kbox#kbox-detach) provided by k8shelld.  

## Reverse proxy

Traffic arriving on the wildcard domain `*.app.k8shell.dev` is handled by the API Server's reverse proxy component. Its primary purpose is to expose [workspace apps](/concepts/workspace/apps) — registered HTTP services running inside a workspace — through a stable, authenticated URL. The subdomain encodes the workspace identifier and the app's port — for example:

```
 https://8080--john-1a7fd88.app.k8shell.dev
 ```
 
routes to port `8080` in workspace with canonical ID `john-1a7fd88`. This allows the API Server to locate the correct workspace and forward traffic to the app running inside it without any additional ingress configuration per workspace.

The reverse proxy forwards requests to the workspace via a k8shelld-backed HTTP transport. For each upstream connection the transport opens a k8shelld `PortForward` gRPC stream, which implements the same direct TCP channel as the SSH `direct-tcpip` forwarding mechanism. The transport authenticates each stream using the user's token retrieved from the session, so the upstream app receives only legitimate, authenticated traffic.

The proxy behaviour differs by traffic type:

<StandardInlineTable data={`
columns:
  - header: Traffic type
    width: 80px
  - header: Protocol
    width: 80px
  - header: Purpose
    width: 210px
rows:
  - - "HTTP"
    - "HTTP/1.1"
    - "Keeps the upstream connection alive across multiple requests from the same browser session."
  - - "WebSocket"
    - "WebSocket upgrade"
    - "Satisfies upstream CSRF/origin checks in apps such as code-server or Jupyter."
  - - "Streaming (SSE/chunked)"
    - "HTTP/1.1"
    - "Delivers server-sent events and chunked output to the browser as soon as the upstream writes them."
`} />

:::info
The reverse proxy is not limited to registered workspace apps. Any process running inside a workspace that listens on a port and speaks HTTP can be reached through the same subdomain routing — including ad-hoc development servers, Jupyter notebooks, or internal tooling that has not been formally registered as an app.
:::

