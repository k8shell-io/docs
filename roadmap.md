---
sidebar_position: 5
title: Roadmap
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Roadmap

k8shell already covers a broad set of functionality - SSH-based workspace access, blueprint-driven provisioning, identity and credential management, session auditing, workload injection, and more. As the platform matures, we are looking at expanding k8shell with new capabilities that address more advanced developer and operator workflows, tighter AI agent integration, and richer ecosystem support.

This page gives a brief overview of the areas we are actively exploring in the near future. Timelines and scope may shift as we learn from early adopters and the community.

:::info Shape the roadmap
We prioritize based on feedback from users and Early Access partners. If a capability here is important to you — or if something is missing — reach out via [support](./support.md) or the [Early Access program](./licensing.md#early-access).
:::

## Upcoming capabilities

### AI agent support

We are expanding k8shell's AI-first capabilities to let agents operate workspaces autonomously.

<StandardInlineTable data={`
columns:
  - header: Capability
    width: 180px
  - header: Description
  - header: Horizon
    width: 110px
rows:
  - - "MCP server - workspace lifecycle"
    - "A first-class MCP server that allows AI coding agents to spawn, access, and terminate workspaces on demand via the Model Context Protocol."
    - "Near-term"
`} />

### Operator

We are building a Kubernetes operator to manage k8shell resources natively via custom resource definitions.

<StandardInlineTable data={`
columns:
  - header: Capability
    width: 180px
  - header: Description
  - header: Horizon
    width: 110px
rows:
  - - "Kubernetes operator"
    - "Manage blueprints, quotas, and workspaces as Kubernetes custom resources. Enables GitOps workflows where workspace configuration is version-controlled and applied declaratively alongside other cluster resources."
    - "Mid-term"
`} />


### Multi-tenancy and multi-cloud

We are expanding isolation and deployment options across single and multi-cloud environments.

<StandardInlineTable data={`
columns:
  - header: Capability
    width: 180px
  - header: Description
  - header: Horizon
    width: 110px
rows:
  - - "Micro-VM workspaces"
    - "Provision workspaces inside micro-VMs (e.g. Firecracker) for hardware-level isolation -suitable for untrusted workloads, AI agents, and multi-tenant environments with strict security requirements."
    - "Mid-term"
  - - "Namespace isolation profiles"
    - "Configurable isolation tiers -shared namespace, dedicated namespace, or dedicated node - selectable per blueprint or per team."
    - "Mid-term"
  - - "Multi-cloud workspace placement"
    - "Schedule workspaces across clusters in different cloud providers or regions, with placement rules defined per blueprint or team."
    - "Long-term"
`} />

### Authentication

We are expanding authentication options to support a wider range of client environments and operator requirements.

<StandardInlineTable data={`
columns:
  - header: Capability
    width: 180px
  - header: Description
  - header: Horizon
    width: 110px
rows:
  - - "Password authentication"
    - "Support password-based authentication for SSH workspace access alongside existing public-key and certificate-based methods."
    - "Near-term"
`} />

### Integrations

<StandardInlineTable data={`
columns:
  - header: Capability
    width: 180px
  - header: Description
  - header: Horizon
    width: 110px
rows:
  - - "DevContainer support"
    - "Support the DevContainer specification as an alternative way to define a workspace environment. DevContainer configuration will map to a subset of the k8shell blueprint spec - allowing teams already using DevContainers in their repositories to adopt k8shell without rewriting their environment definitions."
    - "Near-term"
  - - "Cloud firewall API support"
    - "SSH Shield currently requires a Linux host and uses \`nftables\` to block offending IPs. Planned support for cloud provider firewall APIs - AWS Security Groups, GCP Firewall Rules, and Azure NSGs - will allow SSH Shield to operate without a dedicated Linux entry point, blocking traffic at the network perimeter instead."
    - "Mid-term"
`} />

### Observability

We are building pre-packaged observability tooling so operators get insight into platform health.

<StandardInlineTable data={`
columns:
  - header: Capability
    width: 180px
  - header: Description
  - header: Horizon
    width: 110px
rows:
  - - "OpenTelemetry dashboard"
    - "Pre-built Grafana dashboards for k8shell services, covering workspace latency, provisioning throughput, SSH connection rates, and identity resolution."
    - "Near-term"
`} />

### Open source

The following components are already built and in use within k8shell but have not yet been publicly released. We plan to release them as open source.

<StandardInlineTable data={`
columns:
  - header: Component
    width: 180px
  - header: Description
  - header: Horizon
    width: 110px
rows:
  - - "ZFS CSI driver and API Server"
    - "The \`zfs-csi-k8shell\` CSI driver provisions NFS-backed storage from a ZFS storage API server. It is already used internally to back shared workspace storage. We plan to release it as open source."
    - "Near-term"
`} />

## Horizon definitions

<StandardInlineTable data={`
columns:
  - header: Horizon
    width: 180px
  - header: Meaning
rows:
  - - "**Near-term**"
    - "Active development or in Early Access - expected within the next one to two releases."
  - - "**Mid-term**"
    - "Planned and scoped - expected within the next two to four releases."
  - - "**Long-term**"
    - "Exploratory - direction set, implementation not yet scheduled."
`} />
