---
sidebar_position: 1
---

# SSH Proxy Service

SSH Proxy provides an SSH protocol interface for SSH-compliant clients, authenticates and authorizes users using identity providers, provisions workspaces for users in a Kubernetes cluster, and transforms SSH protocol communication with workspace processes.

The below diagram shows a high-level architecture with SSH proxy as the core component.

![SSH Architecture](svg-gen:drawings/ssh-architecture.excalidraw.svg)

The following sequence outlines the high-level operations handled by the SSH Proxy during an SSH session.

:::NumberedList
* **SSH Connection.** The user connects to K8shell using a standard SSH client (ssh CLI or an IDE with ssh plugin such as VS Code or IntelliJ). The SSH Proxy accepts the incoming SSH session request. 
* **User Authentication.** The SSH Proxy authenticates the user by calling the [Identity Service](/concepts/identity) over gRPC. The Identity Service integrates with identity providers (e.g. GitHub, GitLab, LDAP, etc.) to verify the user. See [User Discovery and Onboarding](communication-flows#user-discovery-and-onboarding) for more details. 
* **Failed Authentication Event Publishing.** The SSH Proxy publishes information about failed authentication attempts to the NATS middleware for further analysis and automated IP blocking. See [IP Address Protection](ip-protection) for more details.   
* **Session Management.** The SSH Proxy creates a session record and periodically reports metrics (ingress/egress volumes). When recording is enabled, it streams the TCP session to the Session service for capture in ASCIINEMA or PCAP format. See [Session Recording]() for more details.
* **Workspace Provisioning.** The SSH Proxy requests the Provisioner to find or start a workspace in Kubernetes. The Provisioner uses Kubernetes APIs for pods, volumes, and networking. See [Workspace Provisioning](communication-flows#workspace-provisioning) for more details. 
* **Interaction.** The SSH Proxy forwards the request to the workspace’s `k8shelld` gRPC API to handle interactive channels such as shell, PTY, port forwarding, and Unix sockets. See [SSH Channels Communication](communication-flows#ssh-channels-communication) for more details. 
:::


## PROXY Protocol Support 

K8shell’s SSH Proxy supports [PROXY protocol version 1](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt), allowing it to retrieve the original client’s IP address and port information even when connections are routed through an external Load Balancer or reverse proxy. This enables accurate identification of the client source for event publishing and auditing. See [IP Address Protection](ip-protection) for more details. 

The use of the PROXY protocol in the SSH Proxy is optional. When enabled, the SSH Proxy inspects incoming connections to detect the presence of a PROXY protocol header. If the header is found, the proxy extracts the original client connection details from it. If the header is not present, the SSH Proxy falls back to using the client IP address obtained directly from the TCP socket.

