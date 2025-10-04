---
sidebar_position: 1
---

# SSH Proxy

SSH Proxy is a service that belongs to the k8shell-io ecosystem. It provides an SSH protocol interface for SSH-compliant clients, authenticates and authorizes users using identity providers and standard protocols, provisions workspaces for users in a Kubernetes cluster, and transforms SSH protocol communication with workspace processes.

The below diagram shows a high-level architecture with SSH proxy as the core component.

import SSHArchitecture from '@site/static/img/diagrams/ssh-architecture.excalidraw.svg';

<div className="centered-svg-container">
  <SSHArchitecture className="centered-svg" />
</div>

The architecture components are:

- **SSH Client** - A client that supports the SSH protocol, such as SSH CLI or any IDE with ssh protocol support.
- **SSH Proxy** - Communicates with clients using the SSH protocol workspace init process k8shelld using gRPC.
- **Identity** - Provides authentication and authorization via identity providers and stores user identities in a database.
- **Provisioner** - Provisions user workspaces in a Kubernetes cluster based on workspace blueprints, which are descriptions of workspaces including container images, resource limits, initialization scripts, and configuration.
- **k8shelld** - The init process of the workspace pod that provides a gRPC API for SSH Proxy to connect to and manages system capabilities within the workspace pod.

For more information on how SSH Proxy integrates with these components, see [Communication Flows](Communication%20Flows).

SSH Proxy can also parse [PROXY protocol version 1](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt) to retrieve the client's IP address. It publishes events on failed access attempts, which are consumed by the SSH Shield service that can block incoming connections using specific rules. For more information, see [Incoming Connections](Incoming-Connections).
