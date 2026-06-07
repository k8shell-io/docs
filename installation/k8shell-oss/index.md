---
sidebar_position: 1
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# k8shell Open Source

**k8shell OSS** is the open-source of the k8shell platform. It delivers the minimum set of services needed to provision and access Kubernetes-based developer workspaces over SSH. No proprietary infrastructure is required.

## What's included

<StandardInlineTable data={`
columns:
  - header: Service
    width: 140px
  - header: Role
rows:
  - - "**SSH Proxy**"
    - "Terminates inbound SSH connections, authenticates users using identity service, and forwards SSH channels to running workspaces. [Learn more](/concepts/ssh-proxy)"
  - - "**Identity**"
    - "Authenticates users via local credentials — SSH public key. [Learn more](/concepts/identity)"
  - - "**Provisioner**"
    - "Creates and tears down workspaces in a target namespace based on workspace blueprints. [Learn more](/concepts/provisioner)"
  - - "**k8shelld**"
    - "Workspace control plane; runs as PID 1 of the main workspace container. [Learn more](/concepts/workspace)"
`} />

The full k8shell platform adds API Server, Session, Console, SSH Shield, Worktrace, and more.

## Prerequisites

<StandardInlineTable data={`
columns:
  - header: Tool
    width: 140px
  - header: Version
rows:
  - - "Kubernetes + \`kubectl\`"
    - "1.26+ with permission to create namespaces, RBAC, and workloads"
  - - "Helm"
    - "3.12+"
  - - "\`openssl\`"
    - "Any recent version (key generation)"
`} />

## Get started

→ **[Quick Start](./quickstart)** — install k8shell on any cluster in under 5 minutes using the quickstart script.

## What's next

Once k8shell OSS is running, you can go further:

- [Expose SSH Proxy](/configuration/basic-configuration/expose-ssh-proxy) — LoadBalancer or ingress setup
- [Add users](/configuration/basic-configuration/adding-users) — add more users with SSH keys
- [Configure workspace blueprints](./) — customise storage, Podman, resource limits
- [Values reference](/configuration/helm-charts/k8shell-chart/#configuration-reference) — full `values.yaml` documentation


