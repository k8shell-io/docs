---
sidebar_position: 5
title: Roadmap
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Roadmap

k8shell already covers a broad set of functionality — SSH-based workspace access, blueprint-driven provisioning, identity and credential management, session auditing, workload injection, and more. As the platform matures, we are looking at expanding k8shell with new capabilities that address more advanced developer and operator workflows, tighter AI agent integration, and richer ecosystem support.

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
  - - "MCP server — workspace lifecycle"
    - "A first-class MCP server that allows AI coding agents to spawn, access, and terminate workspaces on demand via the Model Context Protocol."
    - "Near-term"
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
    - "Provision workspaces inside micro-VMs (e.g. Firecracker) for hardware-level isolation — suitable for untrusted workloads, AI agents, and multi-tenant environments with strict security requirements."
    - "Mid-term"
  - - "Namespace isolation profiles"
    - "Configurable isolation tiers — shared namespace, dedicated namespace, or dedicated node — selectable per blueprint or per team."
    - "Mid-term"
  - - "Multi-cloud workspace placement"
    - "Schedule workspaces across clusters in different cloud providers or regions, with placement rules defined per blueprint or team."
    - "Long-term"
`} />

### Integrations

We are adding deeper integrations with the secrets and identity infrastructure teams.

<StandardInlineTable data={`
columns:
  - header: Capability
    width: 180px
  - header: Description
  - header: Horizon
    width: 110px
rows:
  - - "Vault dynamic secrets"
    - "Native support for HashiCorp Vault dynamic secret engines, so workspaces receive short-lived database credentials and cloud IAM tokens at startup."
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

## Horizon definitions

<StandardInlineTable data={`
columns:
  - header: Horizon
    width: 180px
  - header: Meaning
rows:
  - - "**Near-term**"
    - "Active development or in Early Access — expected within the next one to two releases."
  - - "**Mid-term**"
    - "Planned and scoped — expected within the next two to four releases."
  - - "**Long-term**"
    - "Exploratory — direction set, implementation not yet scheduled."
`} />
