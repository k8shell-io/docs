# k8shell Daemon (k8shelld)

At the core of every workspace is the `k8shelld` process, which runs as **PID 1** inside the main workspace container. `k8shelld` acts as the workspace “control plane” and exposes a set of **gRPC services** that implement (and enforce) the SSH functionality provided to the user.

The diagram below shows a high-level architecture with `k8shelld` as the core component.

![SSH Architecture](svg-gen:drawings/workspace-architecture.excalidraw.svg)

The following sequence outlines the high-level lifecycle and interaction points for a workspace.

:::NumberedList
* **Init Phase.** Before the main container starts, an init container runs once to copy the `k8shelld` binary, `kbox` CLI, and SFTP server into the workspace filesystem. The main container image itself requires no modification — the tooling is injected at startup.
* **Bootstrapping.** `k8shelld` starts as PID 1 and initializes the environment: creates the workspace user, configures groups and optional sudo, runs blueprint-defined init scripts, and starts any blueprint-defined apps.
* **SSH Connectivity via SSH Proxy.** Users connect to the workspace over SSH through the SSH Proxy. Shell sessions, exec, port forwarding, SFTP, and SSH agent forwarding are all implemented as gRPC calls from the SSH Proxy to `k8shelld`'s gRPC server running inside the workspace.
* **Browser Connectivity via API Server.** Users can also connect through the browser-based Console. The API Server proxies the same `k8shelld` gRPC interface to provide terminal access and acts as a reverse proxy for in-workspace apps, making them accessible without any manual tunnel setup.
* **Workloads & kbox CLI.** Users run workloads in the main container and interact with `k8shelld` through the `kbox` CLI, which communicates over a local Unix socket (`k8shelld.sock`) accessible only from within the pod. 
* **App Management.** Apps defined in the blueprint (for example, VS Code Server or custom HTTP tools) are managed by `k8shelld`'s app manager. It handles installation on first start, launching apps at workspace startup, supervising and restarting them on failure, and version tracking.
* **Storage.** Persistent volumes defined in the blueprint are mounted into the workspace and retained across pod restarts, preserving the user's files and state. Ephemeral storage — the container filesystem itself — exists for the lifetime of the pod and is used for temporary files and build caches.
:::

<!-- ## Workspace containers

A workspace runs in Kubernetes as a **Pod** with multiple containers. Each container has a specific responsibility and they cooperate through shared volumes and local (Pod-internal) networking.

* **Init container**. The init container runs once before the main container starts and prepares the workspace filesystem. It initializes the workspace filesystem layout and required directories, and copies the `k8shelld` and SFTP server binaries into the workspace filesystem. 

* **Main container**. The main workspace container is where the user workload runs. It runs `k8shelld` as PID 1, it exposes `k8shelld` gRPC services. It also exposes an internal HTTP REST service used for workspace-internal communication by `kbox` CLI. 

* **DinD container (Docker-in-Docker)** A workspace pod can include an optional DinD container that runs `dockerd` to provide Docker support. It is integrated with the main container via the Docker Unix domain socket shared inside the Pod. This allows users to run Docker commands from inside the workspace using the Docker CLI, including workflows that rely on **Docker Compose**.

### Container images

* **k8shelld images (init container).** The `k8shelld` and SFTP server binaries are provided by k8shelld container images (used by the init container), independent of which image is used for the main workspace container.

* **Main workspace image.** The main container image can be a purpose-built image for a specific development workload, or any standard image from a public registry (for example, Docker Hub).

* **DinD image.** When Docker-in-Docker is enabled, the DinD container uses the standard Docker-provided DinD image (`docker:dind`), which runs `dockerd` and exposes the Docker Unix socket to the main container.

## k8shelld components

`k8shelld` is structured as a small set of internal components, each responsible for a specific part of workspace functionality.

* **gRPC server.** Exposes the gRPC API used by SSH Proxy and Cloudshell. It implements services that correspond to SSH channel/request types, including shell/session channels, port forwarding, streamlocal forwarding, and exec.

* **System.** Provides core system functions for the workspace container: it creates users and groups (including supplementary groups), optionally enables sudo for the workspace user, runs init scripts when the main container starts, acts as PID 1 (process reaper) to clean up orphaned processes, and reads container cgroups information to expose CPU/memory utilization and uptime information.

* **HTTP server.** Provides an internal REST API for workspace operations such as last sessions, Git and Docker credential helper endpoints, uptime/health information, and workspace shutdown. Some endpoints call the external API server to retrieve user context and credentials.

* **App manager.** Manages workspace apps by installing them using defined scripts, starting them, retrieving app versions, and supervising them to restart when they fail.

* **Logger.** Writes logs to the container standard output and keeps a log history for internal inspection.



 -->
