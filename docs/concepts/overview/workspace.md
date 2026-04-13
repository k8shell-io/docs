---
sidebar_position: 3
---

# Workspace

A workspace is an isolated Linux environment running as a Kubernetes pod, provisioned for a specific user according to a [blueprint](./blueprint.md). Users access it over SSH, through the browser-based Console, or via the API Server. Inside the workspace, users can write and run code, build containers, interact with Git repositories, and use their preferred development tools — exactly as they would on a local machine.

## Pod structure

A workspace pod has one main container and an optional container runtime sidecar.

**Main container** — the primary environment where user processes run. It starts `k8shelld` as PID 1, which bootstraps the container, establishes connectivity with the rest of the platform, and manages the workspace lifecycle. Before the main container starts, an init container runs once to copy the `k8shelld` binary and associated tooling into the workspace filesystem.

**Podman sidecar** — an optional sidecar that provides container build and run capabilities inside the workspace. When enabled by the blueprint, Podman runs as a rootless, daemonless container engine within the sidecar. Users in the main container interact with it through a shared socket, building images, running containers, and using Compose workflows as they would locally.

## Bootstrapping

When the main container starts, k8shelld initializes the environment before handing control to the user:

- Creates the workspace user with the configured UID and GID
- Adds the user to the Podman socket group (when the Podman sidecar is enabled)
- Grants passwordless sudo, if enabled by the blueprint
- Runs init scripts — shell scripts defined in the blueprint that execute once in the workspace. Typical init scripts handle tasks like cloning a repository, setting up git configuration, running module initializations, and configuring tool environments.

## Connectivity

k8shelld is the in-workspace counterpart to the SSH Proxy and API Server. It exposes a gRPC API over which SSH channels and API Server sessions are tunnelled:

- **SSH channels** — shell sessions, exec, port forwarding, SFTP, and SSH agent forwarding are all implemented as gRPC calls from the SSH Proxy to k8shelld.
- **API Server** — proxies the same gRPC interface to provide terminal access (CloudShell) and reverse-proxy forwarding to in-workspace apps.

In addition to the gRPC server, k8shelld exposes a local REST API over a Unix socket (`k8shelld.sock`) accessible only from within the pod. This API surfaces session information, k8shelld logs, and running app state, and proxies requests to the API Server for Docker and Git credential helpers. It is primarily used by the `kbox` CLI — a small command-line tool distributed into the workspace alongside k8shelld during the init phase.

## kbox CLI

`kbox` is the in-workspace command-line interface. It communicates with k8shelld over the local Unix socket and provides several workspace management functions:

- **Session management** — list and inspect current and last sessions
- **Credential helpers** — transparently provides Git and Docker credentials retrieved from the API Server.
- **Workspace control** — utilities such as `uptime` and `shutdown`.

:::tip Security
Because credentials flow through the API Server rather than being injected as secrets or environment variables, the workspace container never holds long-lived credentials at rest.
:::

## Apps

A blueprint can define lightweight in-workspace apps managed by k8shelld's app manager. An app is any process that k8shelld can install, start, stop, and supervise — for example VS Code Server, a language server, or a custom HTTP tool.

Apps are primarily intended to be accessed from the Console: the API server can act as a reverse proxy and proxies requests to a running app inside the workspace, making it accessible without any manual SSH tunnel setup. The app manager handles automatic installation (if the binary is absent), start on workspace launch, restart on failure, and version tracking.

## Storage

A workspace has two kinds of storage.

**Ephemeral storage** is the container filesystem itself. It exists for the lifetime of the pod and is lost when the workspace is deleted. It is suitable for temporary files, build caches, and anything that does not need to persist.

**Persistent storage** is backed by Kubernetes PersistentVolumes, mounted into the workspace at paths defined in the blueprint. Persistent volumes survive pod restarts and can be retained even after a workspace is deleted, allowing the same data to be re-attached when the workspace is re-provisioned. Two scopes are supported:

- **Local** — a per-workspace volume provisioned exclusively for that workspace. Depending on the StorageClass, it can be NFS-backed (accessible from any node) or node-local (pinned to a specific node for better I/O performance or functional requirements).
- **Shared** — a single volume shared across multiple workspaces, identified by a common `id`. Useful for team-wide assets, shared build caches, or common toolchains mounted at the same path in every workspace.

:::tip
A typical use of node-local storage is the Podman graph directory: mounting the Podman storage root as a bounded persistent volume gives the sidecar durable, size-controlled storage for images and layers.
:::

Storage is configured in the blueprint. For the full field reference see [Blueprint Reference — storages](../../reference/blueprint.md#storages).

## Lifecycle

A workspace pod exists for as long as it is needed. It can be stopped and restarted — persistent volumes are retained across restarts so the user's files and state are preserved. When a workspace is deleted via `kbox shutdown --delete` or through the Console, the workspace is deleted. Depending on the storage configuration, volumes may be retained for later re-provisioning or cleaned up.

For deeper technical detail on k8shelld's internals — gRPC service structure, the process reaper, the HTTP server, and the app manager — see [Workspace](../workspace/index.md).
