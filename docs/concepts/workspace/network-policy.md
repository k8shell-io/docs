---
sidebar_position: 9
title: Network Policy
---

# Network Policy

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


## Network policy classes

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

## Egress to CIDRs

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

## Egress to pods

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
