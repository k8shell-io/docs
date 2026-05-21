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

Each WebSocket connection is managed by a `Session` that runs four concurrent components:

<StandardInlineTable data={`
columns:
  - header: Component
    width: 200px
  - header: CloudShell message
  - header: k8shelld RPC
rows:
  - - "Terminal"
    - "\`TerminalOutput\`, \`TerminalError\`"
    - "\`RunShell\`"
  - - "Terminal resizer"
    - "\`TerminalResizeMessage\`"
    - "\`ResizeTerminal\`"
  - - "File explorer"
    - "\`FileExplorerMessage\`"
    - "\`RunExec\` (SFTP subsystem)"
  - - "WebSocket client"
    - "All \`CloudshellMessage\` types"
    - "—"
`} />

- **Terminal** — streams PTY input and output between the browser and the workspace shell via k8shelld's `RunShell` gRPC call. Input arrives as `CloudshellMessage` frames from the browser; output is written back as `TerminalOutput` frames.
- **Terminal resizer** — listens for `TerminalResizeMessage` frames and forwards PTY resize events to k8shelld, keeping the terminal dimensions in sync with the browser window.
- **File explorer** — handles `FileExplorerMessage` frames for file system operations. It starts an SFTP subsystem inside the workspace by executing the SFTP binary via k8shelld's `RunExec`, then bridges the `pkg/sftp` client over that connection. This gives the Console seamless file transfer capability — upload, download, and directory browsing — without any separate transfer protocol.
- **WebSocket client** — manages the binary read/write loop, ping/pong keepalives, and connection lifecycle for all of the above.

The four components run in parallel and share a single WebSocket connection. If any component fails or the context is cancelled, all components are shut down together and the connection is closed cleanly.

Terminal sessions are identified by a `terminalSessionId` that is persisted in the user's session store, keyed by workspace and browser tab. When a tab reconnects — for example after a page reload — the API Server resumes the existing terminal session rather than starting a new one.

## Reverse proxy

Traffic arriving on the wildcard domain `*.app.k8shell.dev` is handled by the API Server's reverse proxy component. The subdomain encodes the workspace identifier and the app's port, allowing the API Server to locate the correct workspace and forward traffic to the app running inside it — without any additional ingress configuration per workspace.

The reverse proxy is built on Go's `httputil.ReverseProxy` and forwards requests to the workspace via a k8shelld-backed HTTP transport. The transport authenticates each connection using the user's token retrieved from the session, so the upstream app receives only legitimate, authenticated traffic.

The proxy handles HTTP and WebSocket traffic differently:

- **HTTP requests** are forwarded as HTTP/1.1 with `Connection: keep-alive` and a `Keep-Alive: timeout=120, max=1000` header, keeping the upstream connection alive across multiple requests from the same browser session.
- **WebSocket connections** skip the keep-alive headers and instead set the `Origin` header to the original subdomain host. This ensures that upstream apps performing origin or CSRF checks — such as code-server or Jupyter — accept the connection correctly.

In both cases the proxy sets standard forwarding headers — `X-Forwarded-Host`, `X-Forwarded-For`, and `X-Forwarded-Proto` — so upstream apps can see the original client address and protocol (`https`/`http` or `wss`/`ws` depending on whether TLS is in use).

The `FlushInterval` is set to `-1` (immediate flush), which ensures that streamed responses — such as server-sent events or chunked output — are delivered to the browser as soon as the upstream writes them, rather than being buffered.

If the upstream connection fails, the proxy removes the cached k8shelld client for that workspace and returns a `502 Bad Gateway` to the browser. The next request will re-establish the connection.
