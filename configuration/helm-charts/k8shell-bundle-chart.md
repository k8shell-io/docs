---
sidebar_position: 2
title: k8shell Bundle Chart
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# k8shell Bundle Chart

The `k8shell-bundle` chart is an umbrella chart that wraps the [k8shell chart](../k8shell-chart) and adds production-ready supporting infrastructure in a single deployment. It is the recommended starting point for production deployments and for teams that use HashiCorp Vault as their secrets backend.

:::info Early Access
To use `k8shell-bundle` with all services enabled, please [register for Early Access](https://k8shell.io/early-access) — we'll be happy to get you set up.
:::

The chart uses ArgoCD Application manfiest to install the following applications:

<StandardInlineTable data={`
columns:
  - header: Application
    width: 160px
  - header: Description
rows:
  - - "**k8shell**"
    - "The full k8shell service stack. See [k8shell Chart](../k8shell-chart)."
  - - "**GitHub IdP**"
    - "GitHub identity provider integration, allowing users to authenticate to k8shell using their GitHub credentials. See [GitHub IdP chart](#)."
  - - "**GitLab IdP**"
    - "GitLab identity provider integration, allowing users to authenticate to k8shell using their GitLab credentials. See [GitLab IdP chart](#)."
  - - "**SSH Shield**"
    - "Deploys the SSH Shield service for blocking IP addresses on the external access interface based on SSH authentication failures. See [SSH Shield chart](#)."
  - - "**Secrets**"
    - "Creates secrets with specific keys used by k8shell services. See [Secrets chart](/configuration/helm-charts/vault-secrets-chart/)."
  - - "**NATS**"
    - "Pre-configured NATS deployment providing the message bus and KV storage required by the provisioner and session services."
  - - "**PostgreSQL**"
    - "Pre-configured PostgreSQL deployment used by the identity, session, and provisioner services."
`} />
