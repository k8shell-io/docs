---
sidebar_position: 5
---

# Security

Security is a first-class concern in k8shell. The platform is built for environments where multiple teams share the same cluster, and applies zero-trust principles. Security is enforced at multiple layers:

**Application security** — built into k8shell services and configuration:

- [**SSH public key authentication**](#ssh-public-key-authentication) — passwords supported but off by default
- [**JWT tokens and RBAC**](#user-authentication-and-authorization--jwt-and-rbac) — short-lived, role-scoped user credentials
- [**No credentials stored in workspaces**](#no-credentials-stored-in-workspaces) — credential helpers and SSH agent forwarding supported
- [**Least-privileged workspace containers**](#least-privileged-workspace-containers) — workspaces run without elevated privileges
- [**Detection of malicious activities**](#detection-of-malicious-activities--worktrace) — eBPF-based observation of workspace activity for threat detection
- [**Brute-force protection**](#brute-force-and-bot-protection--ssh-shield) — dynamic IP blocking driven by failed authentication events

**Infrastructure security** — enforced through Kubernetes setup and deployment configuration:

- [**Network policy enforcement via Cilium**](#network-policy-enforcement--cilium) — preferred CNI for eBPF-enforced network policies
- [**TLS and cert management**](#transport-security--tls-and-certificate-management) — encrypted service-to-service transport with automated certs rotation
- [**Service-to-service authorization**](#service-to-service-authorization--kubernetes-projected-tokens) — scoped Kubernetes tokens limit inter-service access
- [**Secrets injection from Vault**](#secrets-injection-from-vault) — k8shell deployment secrets sourced from Vault

## SSH public key authentication

SSH user authentication is handled via public key cryptography. Password authentication is supported but disabled by default. The key comparison is delegated to an Identity Provider, which holds the user's registered public keys.

## User authentication and authorization — JWT and RBAC

The Identity service issues a short-lived JWT when a user is onboarded into the system. The token carries the user's identity and role claims, is propagated into the workspace, and is passed as a bearer token in requests made by the user or the workspace to the API Server.

The API Server validates the JWT on every request and enforces a role-based access control (RBAC) policy before forwarding to internal services. Access decisions — which blueprints a user can provision, which workspaces they can manage, which administrative functions they can invoke — are all governed by the roles encoded in the token.

RBAC policies and identity provider integration are covered in detail in the [Identity service](../identity/index.md) documentation.

## No credentials stored in workspaces

No credentials are written to the workspace filesystem. Instead, k8shell provides credential helpers for the tools that need them — git, Docker, and Helm retrieve credentials on-demand by calling the API Server, which validates the workspace's JWT and returns the appropriate credential. Credentials are never cached on disk.

For SSH authentication to external hosts, k8shell supports standard SSH agent forwarding (`ssh -A`). When enabled, signing requests are forwarded back to the agent on the client machine — the private key never leaves the client.

For more details, see [Agent Forwarding](/concepts/ssh-proxy/communication-flows#agent-forwarding).

## Least-privileged workspace containers

Workspace pods run as non-privileged containers by default. No elevated Linux capabilities are granted unless explicitly required — the container security context starts from a minimal capability set, and any additions must be intentionally configured in the blueprint. This limits the blast radius if a workspace is compromised: a process running inside cannot trivially escape to the host or affect other pods.

For container build and run support inside workspaces, k8shell uses **Podman** as a sidecar. Podman runs rootless and daemonless — it requires no privileged container, which means workspace pods stay within normal security boundaries and cannot be exploited to escape to the host. 

## Detection of malicious activities — Worktrace

Worktrace is a k8shell service that uses [Tetragon](https://tetragon.io) to observe activity inside workspace pods — system calls, process executions, network connections, and file access patterns — without modifying the workspace image or requiring any in-workspace agent. Tetragon is built on Cilium and eBPF.

This provides a continuous audit trail of what runs inside workspaces and enables detection of anomalous behaviour: unexpected outbound connections, privilege escalation attempts or suspicious process trees.

For more details see [Worktrace](../worktrace/index.md).

:::note
Worktrace is only available in clusters using [Cilium](https://cilium.io) as the CNI.
:::

## Brute-force and bot protection — SSH Shield

Because TCP/22 is a well-known port, it is routinely targeted by automated scanners and credential-stuffing bots. To address this, the SSH Proxy can be configured to publish failed authentication events — containing the client IP, attempted username, and failure reason — to NATS. The SSH Shield service subscribes to this stream and applies configurable rule-based policies: when an IP address accumulates failures beyond a defined threshold, SSH Shield blocks it at the network layer.

For more details see [IP Address Protection](../ssh-proxy/ip-protection.md) and [SSH Shield](/concepts/ssh-shield).

## Network policy enforcement — Cilium

[Cilium](https://cilium.io) is the preferred CNI for k8shell deployments. It enforces network policy using eBPF directly in the kernel, which brings both performance and security improvements over traditional bridge-based CNI plugins. For example, Cilium bypasses the ARP/bridge layer and makes forwarding decisions based on cryptographic pod identity. Link-layer attacks such as ARP spoofing, in which a pod with `CAP_NET_RAW` poisons ARP caches to intercept traffic, therefore have no effect. 

## Transport security — TLS and certificate management

All service-to-service communication inside the cluster uses gRPC over TLS. Certificates and private keys are provisioned and rotated automatically through cert-manager, integrated with an external PKI provider such as HashiCorp Vault. Rotation occurs on a configurable schedule (30 days by default). When a new certificate is issued, services reload it and re-establish their gRPC listeners without downtime — there is no manual certificate management and no service restart required.

## Secrets injection from Vault

k8shell supports sourcing secrets for its own deployment from a secrets management system such as HashiCorp Vault. Secrets are not managed as static Kubernetes Secret objects — instead, a `VaultSecret` resource is defined that references a secret path in Vault. A controller synchronizes the Vault secret into a corresponding Kubernetes Secret, which is then consumed by k8shell services in the normal way (as environment variables or mounted files).

This means secrets are defined and rotated in Vault, and the Kubernetes Secrets are derived from them automatically. There is no need to manage credential values directly in cluster manifests or version control.

## Service-to-service authorization — Kubernetes projected tokens

Any k8shell service verifies *who* is calling before processing a request. Each service uses a Kubernetes-projected service account token scoped to the specific target service as its bearer credential. The receiving service validates the token audience, service account name, and namespace before handling the request, ensuring that only authorized services can invoke each API.


