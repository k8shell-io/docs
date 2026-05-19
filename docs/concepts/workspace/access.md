---
sidebar_position: 6
title: Access
---

# Access

Workspace access encompasses both network connectivity and Kubernetes API access. Network policies control traffic between workspace pods and other endpoints, while Kubernetes access is managed through service accounts and RBAC.

## Kubernetes Access

Kubernetes API access from within a workspace is controlled through a credential helper that dynamically retrieves authentication tokens from the Kubernetes API server. The service account is not mounted directly to the workspace pod. Instead, when tools like `kubectl` or `helm` attempt to access the Kubernetes API, the credential helper obtains a token on-demand.

RBAC can be assigned to an arbitrary service account and provided in the identity to supply tokens for workspace access bound to a specific user. Once RBAC is configured, users can access the Kubernetes API from within the workspace using standard tools such as `kubectl` and `helm`.

## Credential Helpers

k8shell provides credential helpers that integrate with various tools to provide seamless authentication without requiring users to manage credentials manually. 

**Kubernetes credential helper** — Dynamically retrieves authentication tokens from the Kubernetes API server when tools like `kubectl` or `helm` need to authenticate. This eliminates the need to mount service account tokens directly into the workspace pod and allows for fine-grained, on-demand access control.

**Docker credential helper** — Provides authentication for container registries when pulling or pushing images. The credential helper integrates with Docker and Podman to retrieve registry credentials securely without storing them in configuration files.

**Git credential helper** — Supplies authentication credentials for Git operations when accessing private repositories. When a user is onboarded via a git-based identity provider (GitHub or GitLab), the credential helper automatically provides a token associated with the user account. This allows users to clone, push, and pull from Git repositories without manually configuring credentials in the workspace.

Credentials are managed by the [Identity credential helper backend](../identity/credential-helpers.md).

## SSH Keys

SSH keys enable secure authentication for remote connections. Workspaces support SSH agent forwarding, which allows users to leverage SSH keys from their local machine without copying private keys into the workspace environment.

## Network Policy

Network policies control traffic between workspace pods and other network endpoints. Policies are defined in the blueprint under the `network` key and are implemented as Kubernetes NetworkPolicy resources applied to the workspace pod. The policy is applied to the workspace pod using pod selectors based on workspace identity labels (`k8shell.io/user`, `k8shell.io/blueprint`, `k8shell.io/organization`).

There are following fields:

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`networkPolicyClass\`"
    - "Predefined policy template: \`user\`, \`workspace\`, \`organization\`, or \`system\`. When omitted, no policy is applied."
  - - "\`allowEgressToCIDRs\`"
    - "List of CIDR ranges permitted for egress. Each entry must be valid CIDR notation."
  - - "\`allowEgressToPods\`"
    - "List of label selectors for pods permitted for egress. Each entry is a map of label key-value pairs."
`} />


### Network policy classes

The `networkPolicyClass` field selects a predefined policy template that controls which workspaces can communicate with each other. When no class is specified, no network policy is applied and all traffic is permitted.

**`user`** — allows communication with workspaces owned by the same user, regardless of blueprint. Workspaces from different users are isolated from each other. This restricts traffic to the user's own workspace namespace.

**`workspace`** — allows communication with workspaces provisioned from the same blueprint, regardless of user. Users working in the same blueprint can reach each other's workspaces. Workspaces from different blueprints are isolated.

**`organization`** — allows communication with any workspace in the same organization. Cross-user and cross-blueprint traffic is permitted as long as both workspaces belong to the organization. Workspaces from different organizations are isolated.

**`system`** — allows communication with any network endpoint. No restrictions are applied. This is equivalent to not setting a network policy class, but makes the intent explicit in the blueprint.

Example:

```yaml
network:
  networkPolicyClass: user
```

### Egress to CIDRs

The `allowEgressToCIDRs` field specifies CIDR ranges that the workspace is permitted to reach. This is a convenience shorthand for adding egress rules without writing a full NetworkPolicy spec. Each entry must be a valid CIDR notation (e.g., `10.0.0.0/8`, `192.168.1.0/24`).

This is typically used to allow access to on-premises services, databases, or other infrastructure that is not part of the Kubernetes cluster:

```yaml
network:
  networkPolicyClass: user
  allowEgressToCIDRs:
    - 10.96.0.0/12      # cluster service network
    - 192.168.1.0/24    # on-prem database subnet
```

When combined with a network policy class, the CIDR rules are added to the policy generated from the class.

### Egress to pods

The `allowEgressToPods` field specifies label selectors for pods that the workspace is permitted to reach. This is a convenience shorthand for permitting egress to specific services or workloads running in the cluster. Each entry is a map of label key-value pairs that must all match for the rule to apply.

This is useful for allowing access to shared services, monitoring agents, or other workspaces that are not covered by the network policy class:

```yaml
network:
  networkPolicyClass: user
  allowEgressToPods:
    - app: prometheus
      role: server
    - app: jaeger
```

The first rule allows egress to pods with both labels `app=prometheus` and `role=server`. The second rule allows egress to any pod with the label `app=jaeger`.
