---
sidebar_position: 1
---

# SSH Proxy

SSH Proxy provides an SSH protocol interface for SSH-compliant clients, authenticates and authorizes users using identity providers and standard protocols, provisions workspaces for users in a Kubernetes cluster, and transforms SSH protocol communication with workspace processes.

The below diagram shows a high-level architecture with SSH proxy as the core component.

import SSHArchitecture from '@site/static/img/diagrams/ssh-architecture.excalidraw.svg';

<div className="centered-svg-container">
  <SSHArchitecture className="centered-svg" />
</div>

## SSH Protocol Support 

The SSH Proxy provides full support for standard SSH protocol features, including:

* **Session channels** – interactive shell sessions with PTY allocation, agent forwarding, environment variable requests, command execution, and file transfers (SFTP/SCP).
* **Direct TCP/IP channels** – enabling secure tunneling and port forwarding over SSH.


For more information on how SSH Proxy integrates with these components, see [Communication Flows](Communication%20Flows).

SSH Proxy can also parse [PROXY protocol version 1](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt) to retrieve the client's IP address. It publishes events on failed access attempts, which are consumed by the SSH Shield service that can block incoming connections using specific rules. For more information, see [Incoming Connections](Incoming-Connections).
