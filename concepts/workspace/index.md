# Workspace

At the core of every workspace is the `k8shelld` process, which runs as **PID 1** inside the main workspace container. `k8shelld` exposes a set of **gRPC services** that implement the SSH functionality provided to the user. 

A workspace runs either as a **standalone pod** — its own dedicated Kubernetes pod — or **injected into an existing workload**, where k8shell adds the workspace container into a pod already managed by a Deployment, StatefulSet, or DaemonSet. The behaviour of `k8shelld` is the same in both cases; the differences are in how the workspace is provisioned and what capabilities are available. 

The diagram below shows a high-level architecture with `k8shelld` as the core component.

![SSH Architecture](svg-gen:drawings/workspace-architecture.excalidraw.svg)

The following sequence outlines the high-level lifecycle and interaction points for a workspace.

:::NumberedList
* **Init Phase.** Before the main container starts, an init container runs once to copy the `k8shelld` binary, `kbox` CLI, and SFTP server into the workspace filesystem. The main container image itself requires no modification — the tooling is injected at startup.
* **Bootstrap.** `k8shelld` starts as PID 1 and initializes the environment: creates the workspace user, configures groups and optional sudo, runs blueprint-defined init scripts, and starts apps.
* **App Management.** Apps defined in the blueprint (for example, VS Code Server or custom HTTP tools) are managed by `k8shelld`'s app manager. It handles installation on first start, launching apps at workspace startup, supervising and restarting them on failure, and version tracking.
* **SSH Connectivity via SSH Proxy.** Users connect to the workspace over SSH through the SSH Proxy. Shell sessions, exec, port forwarding, SFTP, and SSH agent forwarding are all implemented as gRPC calls from the SSH Proxy to `k8shelld`'s gRPC server running inside the workspace.
* **Browser Connectivity via API Server.** Users can also connect through the browser-based Console. The API Server proxies the same `k8shelld` gRPC interface to provide terminal access and acts as a reverse proxy for in-workspace apps, making them accessible without any manual tunnel setup.
* **Workloads & kbox CLI.** Users run workloads in the main container and interact with `k8shelld` through the `kbox` CLI, which communicates over a local Unix socket accessible only from within the pod.
* **Podman sidecar.** Users can build images and run nested containers via an optional Podman sidecar. Containers share the pod's namespaces — the isolation boundary is the Kubernetes pod.
* **Storage.** Persistent volumes defined in the blueprint are mounted into the workspace and retained across pod restarts, preserving the user's files and state. Ephemeral storage — the container filesystem itself — exists for the lifetime of the pod and is used for temporary files and build caches.
:::

