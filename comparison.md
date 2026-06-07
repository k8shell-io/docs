---
sidebar_position: 6
title: Comparison
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Comparison with other solutions

Several platforms address parts of the cloud-native developer workflow — spanning Cloud Development Environments (CDEs), self-hosted workspace tooling, and AI-augmented coding assistants. k8shell approaches this space differently: Kubernetes-native from the ground up, SSH-first, and designed to serve both human developers and AI agents operating autonomously inside isolated, auditable workspaces.

The sections below describe where each platform sits and how it compares to k8shell.

## Platforms

**GitHub Codespaces** is a cloud-hosted CDE tightly integrated with GitHub. Workspaces are accessible via browser or local IDE and come pre-configured for a repository. Codespaces is strongly coupled to the GitHub ecosystem, offers no self-hosting option, and provides limited control over the underlying infrastructure and runtime environment..

**GitPod** (now **Ona**) pioneered ephemeral, prebuilt cloud development environments accessible from browser and IDE clients. While conceptually similar to on-demand workspace platforms, its current direction focuses on managed developer environments rather than Kubernetes-native workspace orchestration. Public documentation does not position Kubernetes as the primary workspace abstraction.

**Coder** is a self-hosted CDE platform that provisions developer workspaces across Kubernetes, cloud VMs, and other infrastructure through templates and infrastructure automation. Unlike Kubernetes-native workspace platforms, Kubernetes is primarily an implementation target rather than the primary user-facing abstraction. Coder supports automatic workspace startup and IDE connectivity through its own access layer.

**DevPod** is an open-source developer tool for launching DevContainer-based environments across local machines, cloud VMs, and Kubernetes backends. It focuses on developer experience rather than providing a centralized multi-tenant workspace platform.

**ContainerSSH** is an open-source SSH access gateway for containers and Kubernetes workloads. It provides authentication, audit logging, and session management capabilities, but is focused on secure SSH access rather than full lifecycle management of development workspaces.

## Feature comparison

<StandardInlineTable data={`
columns:
  - header: Feature
  - header: k8shell
    width: 90px
  - header: GitHub Codespaces
    width: 90px
  - header: Ona
    width: 90px
  - header: Coder
    width: 90px
  - header: DevPod
    width: 80px
  - header: ContainerSSH
    width: 100px
rows:
  - - "Commercial offering"
    - "**Early Access ¹**"
    - "**Yes**"
    - "**Yes**"
    - "**Yes**"
    - "No ²"
    - "No"
  - - "Kubernetes-native environments"
    - "**Yes**"
    - "No"
    - "Partial³"
    - "Partial³"
    - "Partial³"
    - "Yes"
  - - "SSH-based access"
    - "**Yes**"
    - "Yes"
    - "Limited⁴"
    - "Limited⁴"
    - "Limited"
    - "Yes"
  - - "Cloud vendor neutral"
    - "**Yes**"
    - "No"
    - "Yes"
    - "Yes"
    - "Yes"
    - "Yes"
  - - "Open-source"
    - "**Yes**"
    - "No"
    - "Partial⁵"
    - "Yes"
    - "Yes"
    - "Yes"
  - - "Native auditability and session replay"
    - "**Yes**"
    - "No"
    - "No"
    - "No"
    - "No"
    - "Partial⁶"
  - - "Native OPA policy enforcement"
    - "**Yes**"
    - "No"
    - "No"
    - "No"
    - "No"
    - "No"
  - - "Pluggable identity providers"
    - "**Yes**"
    - "Limited⁷"
    - "Limited"
    - "Yes"
    - "No"
    - "Partial"
  - - "Workspace injection ⁸"
    - "**Yes**"
    - "No"
    - "No"
    - "No"
    - "No"
    - "No"
`} />

---

¹ k8shell platform is currently available under Early Access. See [Licensing](/licensing#early-access) for more details.

² DevPod is an open-source project and does not have a commercial SaaS or enterprise offering.

³ Kubernetes can be used as a deployment or execution backend, but Kubernetes is not the primary user-facing workspace abstraction.

⁴ SSH access is provided through a standard `sshd` running inside the workspace. Workspace lifecycle management is separate from the SSH connection itself.

⁵ Ona originated from the open-source Gitpod project. The current commercial offering includes proprietary components and the open-source status of all platform components is not clearly documented.

⁶ ContainerSSH provides audit logging and session tracking, but not full workspace-level session replay capabilities.

⁷ GitHub Codespaces inherits authentication and identity management from GitHub and GitHub Enterprise rather than exposing a generic pluggable identity-provider architecture.

⁸ Workspace injection refers to dynamically attaching a workspace runtime to an existing Kubernetes workload, pod, or application environment without modifying or rebuilding the workload.
