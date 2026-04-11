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
* **k8shell CLI** – Command-line tool for operating and managing the k8shell platform.
* **Browser** – Web browser for accessing the k8shell Console.

## Access

* **SSH Proxy** – Entry point for SSH connections. Authenticates users via Identity, translates SSH protocol into gRPC, and forwards channels to the workspace's k8shelld.
* **API Server** – REST API gateway for CLI, Console, and automation. Routes requests to Identity, Provisioner, and other backend services.
* **Console** – Web UI for managing workspaces, sessions, and users. Includes an integrated CloudShell terminal.

## Core Platform Services

* **Identity** – Authenticates and authorizes users against external providers (OAuth, OIDC). Issues and renews JWT tokens used across services.
* **Session** – Tracks active sessions, records metadata, and optionally captures session content for audit and replay.
* **Provisioner** – Creates and tears down workspace pods in Kubernetes based on workspace blueprints.
* **k8shelld** – In-workspace daemon exposing gRPC services for shell, PTY, port forwarding, file transfer, and SSH agent.

## Security

* **SSH Shield** – Listens to failed authentication events from SSH Proxy via NATS and dynamically blocks offending IP addresses at the firewall level.
* **Worktrace** – Captures and analyzes runtime activity inside workspaces using eBPF for observability and security analytics.

## Infrastructure

* **Postgres** – Persistent store for configuration, user data, and workspace metadata.
* **NATS** – Async messaging backbone for event propagation across services.
* **HashiCorp Vault** – Manages service secrets and acts as a certificate authority for internal mTLS.
* **Harbor** – Private container registry for workspace images.
* **zfs-csi** – CSI driver for dynamic provisioning of ZFS-backed persistent volumes.
* **ZFS API Server** – REST API for ZFS dataset management.
