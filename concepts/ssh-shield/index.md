---
sidebar_label: SSH Shield
sidebar_custom_props:
  earlyAccess: true
---

# SSH Shield <EarlyAccessBadge />

SSH Shield protects the k8shell SSH entry point from brute-force attacks and automated credential-stuffing bots. It subscribes to failed authentication events published by the SSH Proxy over NATS and applies configurable rule-based policies to block offending IP addresses at the network layer.

The diagram below shows SSH Shield's position in the platform and its integration points.

![SSH Shield Architecture](svg-gen:drawings/ssh-shield-architecture.excalidraw.svg)

The following outlines the key interaction points for SSH Shield:

:::NumberedList
* **Connection ingress** — an SSH client connects to the entry point Linux host. Inbound traffic passes through firewall, which evaluates it against active blocking rules before forwarding. 
* **Routing** — the load balancer forwards the traffic to the SSH Proxy via the configured Kubernetes service which transfers the traffic to SSH proxy instance.
* **SSH handshake and authentication** — the SSH Proxy accepts the TCP connection and performs the SSH handshake. The SSH Proxy calls the [Identity service](/concepts/identity) over gRPC to verify the user's credentials.
* **Failure event publishing** — when authentication fails, the SSH Proxy publishes a failure event to NATS. The event includes the client IP, the username, the authentication method, and the failure reason. 
* **Blocking Rules** — SSH Shield evaluates each event against configured policies and delegates rule installation to a [firewall plugin](/concepts/ssh-shield/blocking). The `nfgate` plugin installs rules directly into an `nftables` set on the entry point Linux host; cloud provider plugins (AWS, GCP, Azure) update the corresponding managed firewall via the provider API.
:::