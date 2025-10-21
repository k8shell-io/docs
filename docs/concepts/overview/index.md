---
sidebar_position: 1
---

# Overview

K8shell platform connects developers to Kubernetes-based workspaces through a lightweight SSH proxy. A k8shell workspace runs as an isolated pod in Kubernetes, providing users with full Linux environments where they can code, build, and debug using their preferred tools.

The system is composed of independent microservices responsible for identity management, workspace provisioning, access control, and observability — all communicating through well-defined APIs and event streams.

The following figure shows the k8shell components.

![Architecture](svg-gen:drawings/k8shell-architecture.excalidraw.svg)

:::note
Components shown in yellow are part of the K8shell.io ecosystem — purpose-built services developed specifically for K8shell. Components shown in blue represent standard infrastructure services that K8shell integrates with.
:::

## Clients

* **SSH Client** – Any client that supports the SSH protocol, such as the SSH CLI or an IDE with SSH remote development.
* **kbox CLI** – The kbox command-line tool used to operate and manage the K8shell platform directly from the terminal.
* **Browser** – Web browser for accessing the K8shell Dashboard and managing workspaces through a graphical interface.

## Access 

* **SSH Proxy** – The entry point for SSH traffic. It authenticates users, translates SSH protocol streams into internal gRPC calls, and securely forwards them to the workspace processes managed by K8shelld.
* **API Server** – Unified API gateway that exposes REST endpoints for clients (CLI, dashboard, automation tools) and routes requests to backend services like Identity, Provisioner, and others.
* **Dashboard** – Web-based interface that provides visibility into users, workspaces, and platform activity. Enables non-technical and technical users to manage sessions and monitor resource usage.
* **CloudShell** – A browser-based terminal that provides direct access to K8shell workspaces through the web interface.

## Core Platform Services 

* **Operator** - Controls the lifecycle of workspaces and their underlying Kubernetes resources. It watches for custom Workspaces resources, applies the desired state, and ensures consistency across provisioning, updates, and teardown. 
* **Identity** – Handles user authentication, authorization, and mapping between external identity providers (OAuth, OIDC, LDAP) and K8shell accounts.
* **Session** - Manages user access sessions, including session creation, tracking, and expiration. It coordinates with the Identity service to validate active sessions, and records activity metadata for audit and observability purposes. 
* **Provisioner** – Creates and managing user workspaces within the Kubernetes cluster based on defined blueprints.
* **k8shelld** – The in-workspace daemon that exposes gRPC-based services to handle shell sessions, port-forwards, file transfers, and SSH agent communication within each workspace.

## Security

* **SSH Shield** – A security enforcement component that integrates with the SSH Proxy via NATS. It dynamically creates firewall rules to block IP addresses associated with failed authentication attempts.
* **Worktrace** - An observability and analytics service that captures and analyzes runtime activities inside user workspaces using eBPF.

## Infrastructure

* **zfs-csi** – CSI driver providing dynamic provisioning for ZFS-backed storage volumes used by workspaces.
* **ZFS API Server** – Management interface for ZFS volumes, providing REST APIs to handle dataset management.
* **Image Builder** - A service that builds workspace container images. 
* **NATS** – Messaging middleware enabling asynchronous communication and event propagation across K8shell services.
* **Postgres** – Relational database used to persist configuration, user data, and workspace metadata.
* **Harbor** – A private container registry that stores workspace images.
* **Memcached** – In-memory caching layer used to speed up frequent lookups and reduce load on backend services.