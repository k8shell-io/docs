---
sidebar_position: 1
---

# k8shell Open Source

**k8shell OSS** is the open-source core of the k8shell platform. It delivers the minimum set of services needed to provision and access Kubernetes-based developer workspaces over SSH. No proprietary infrastructure is required.

The following services are deployed as part of k8shell OSS:

| Service | Role |
|---|---|
| **SSH Proxy** | Terminates inbound SSH connections, authenticates users, and forwards SSH channels to running workspaces. See [SSH Proxy](/concepts/ssh-proxy). |
| **Identity** | Authenticates users via local credentials (password hash or SSH public key). See [Identity](/concepts/identity). |
| **Provisioner** | Creates and tears down workspaces in a target namespace based on workspace blueprints. See [Provisioner](/concepts/provisioner). |

The remaining platform services (API Server, Session, Frontend, SSH Shield, Worktrace, etc.) are available in the full k8shell platform. See [Full k8shell platform]() for more details.

## Prerequisites

To install k8shell OSS, you need:

* Kubernetes 1.26 or later with `kubectl` configured with sufficient permissions to create namespaces, RBAC, and workloads.
* Helm 3.12 or later.

## Quick start

1. **Prepare** — create k8shell system and workspace namespaces, create an SSH server key and admin credentials.
2. **Helm install** — install k8shell using the Helm chart with default values.
3. **Verify** — confirm all pods are running and connect to the SSH Proxy with the admin SSH key or password.

:::note
k8shell OSS does not require persistent storage to operate. To use persistent volumes for workspaces, provide a storage class configured in your cluster.
:::

## Advanced setup

1. **Configure workspace blueprints** — define workspace configuration such as storage, Docker, and permissions.
2. **Configure users** — define additional users.
3. **Expose SSH Proxy** — enable `sshProxy.loadBalancer` to expose port 22 externally, or configure an existing ingress/LB.
4. **Values.yaml reference** — see all `values.yaml` parameters you can configure.  

## Troubleshooting

TODO

