---
sidebar_position: 2
---

# Protocol Support

SSH Proxy uses the SSH-2 protocol suite for client connections and optionally the PROXY protocol to preserve the original client IP when running behind a load balancer.

## SSH Protocol 

The K8shell SSH Proxy implements the core channel types and request classes defined in the **SSH-2 protocol suite (RFC 4251–4254)**, providing compatibility with standard SSH clients and IDEs.

### Supported Channel Types

<StandardInlineTable data={`
columns:
  - header: Channel Type
    width: 250px
  - header: Description
rows:
  - - "**\`session\`**"
    - "Provides an interactive environment for users. Supports PTY allocation, shell execution, environment variable configuration, agent forwarding, and subsystem operations (SFTP)."
  - - "**\`direct-tcpip\`**"
    - "Enables client-initiated TCP/IP forwarding (local port forwarding), allowing the user to tunnel connections through the SSH session to internal network services."
  - - "**\`direct-streamlocal@openssh.com\`**"
    - "Enables client-initiated unix socket forwarding, allowing the user to tunnel connections through the SSH session to internal services using unix socket."
`} />

### Supported Channel Requests

<StandardInlineTable data={`
columns:
  - header: Request Type
    width: 250px
  - header: Description
rows:
  - - "**\`pty-req\`**"
    - "Allocates a pseudo-terminal for interactive shells."
  - - "**\`shell\`**"
    - "Starts an interactive shell session in the workspace."
  - - "**\`exec\`**"
    - "Executes a single command without starting a shell."
  - - "**\`env\`**"
    - "Sets environment variables within the session context."
  - - "**\`subsystem\`**"
    - "Invokes protocol subsystems such as SFTP."
  - - "**\`auth-agent-req@openssh.com\`**"
    - "Enables SSH agent forwarding for delegated authentication."
  - - "**\`signal\`**"
    - "Sends a signal to the process running in an \`exec\` session. Currently not supported for shell or pty sessions."
`} />

### Unsupported Features

Only the channel types and requests listed above are supported. Anything not explicitly listed is not implemented. Notable examples of unsupported SSH features include:

- **`tcpip-forward`** — server-initiated (remote) port forwarding
- **`x11-req` / X11 forwarding** — graphical display forwarding over SSH

## PROXY Protocol Support 

K8shell’s SSH Proxy supports [PROXY protocol version 1](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt), allowing it to retrieve the original client’s IP address and port information even when connections are routed through an external Load Balancer or reverse proxy. This enables accurate identification of the client source for event publishing and auditing. See [IP Address Protection](ip-protection) for more details. 

The use of the PROXY protocol in the SSH Proxy is optional. When enabled, the SSH Proxy inspects incoming connections to detect the presence of a PROXY protocol header. If the header is found, the proxy extracts the original client connection details from it. If the header is not present, the SSH Proxy falls back to using the client IP address obtained directly from the TCP socket.


