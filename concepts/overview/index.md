---
sidebar_position: 1
---

# Overview

K8shell provides developer access to Kubernetes-based workspaces via SSH, a browser-based console, or the REST API. Each workspace runs as an isolated pod, giving users a Linux environment to code, build, and debug with their preferred tools.

The platform is composed of independent microservices communicating over gRPC, REST, and NATS — each with a well-defined responsibility.

The following figure shows the k8shell components.

![Architecture](svg-gen:drawings/k8shell-architecture.excalidraw.svg)

:::note
Components shown in yellow are purpose-built k8shell services. Components shown in blue are standard infrastructure services that k8shell integrates with.
:::

## Clients

* **SSH Client** – Any SSH-compatible client: the `ssh` CLI, VS Code Remote, IntelliJ, or similar.
* **Browser** – Web browser for accessing the k8shell Console.

## Access

* **[SSH Proxy](../ssh-proxy/)** – Authenticates users via Identity, forwards SSH to workspace's k8shelld gRPC interface.
* **[API Server](../api-server/)** – REST API gateway for CLI, Console, and automation. Routes requests to backend services.
* **Console** – Web UI for managing workspaces, sessions, and users. Includes an integrated CloudShell.
* **[k8shell CLI](../k8shell-cli/)** – Command-line tool for operating and managing the k8shell platform.

## Core Platform Services

* **[Identity](../identity/)** – Authenticates and authorizes users against external providers (OAuth, OIDC). JWT issuer.
* **[Authz](../authz/)** – Applies OPA policies across onboarding, authentication, SSH, and provisioning.
* **[Session](../session/)** – Tracks active sessions, and records sessions for audit and replay.
* **[Provisioner](../provisioner/)** – Creates and tears down workspace pods in Kubernetes based on workspace blueprints.
* **[k8shelld](../workspace/)** – In-workspace daemon exposing gRPC services for shell, PTY, port forwarding, SFTP.

## Security

* **[SSH Shield](../ssh-shield/)** – Evaluates SSH authentication failures and requests IP address blocks at the firewall level.
* **[nfgate](../ssh-shield/nfgate)** – Blocks IP addresses on request using Linux nftables.
* **[Worktrace](../worktrace/)** – Captures and analyzes activities inside workspaces using eBPF.

## Infrastructure

* **Postgres** – Persistent store for user data.
* **NATS** – Async messaging backbone for event propagation across services.
* **HashiCorp Vault** – Manages service secrets and acts as a certificate authority for internal TLS.
* **Harbor** – Private container registry for workspace images.
* **zfs-csi** – CSI driver for dynamic provisioning of ZFS-backed persistent volumes.
* **ZFS API Server** – REST API for ZFS dataset management.
