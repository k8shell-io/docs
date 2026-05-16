---
sidebar_position: 1
title: Deployment Models
---

# Deployment Models

A workspace can be provisioned in two fundamentally different ways, each with distinct provisioning mechanics and capabilities.

## Standalone pod

In the standalone model the provisioner creates a new Kubernetes Pod whose spec is derived entirely from the blueprint. The pod contains:

- an **init container** that copies `k8shelld`, `kbox`, and the SFTP server into a shared `emptyDir` volume mounted at a well-known path;
- the **main workspace container**, which runs `k8shelld` as PID 1;
- an optional **Podman sidecar** container, when container build capabilities are requested by the blueprint.

The provisioner creates the pod and its associated resources via the Kubernetes API. The pod spec is derived entirely from the blueprint — network policies, persistent volume claims, and container configuration are all applied at creation time. The workspace is completely isolated from other workloads at the pod boundary.

## Injection into an existing workload

In the injection model the provisioner patches a running workload — a Deployment, StatefulSet, or DaemonSet — rather than creating a new pod. The workspace runs inside the workload's pods alongside its own containers, sharing their network and PID namespaces.

### Inject

The provisioner appends an init container and a workspace container to the workload's pod template, along with any required volumes. ConfigMaps and PVCs defined in the blueprint are created in the workload's namespace (home-directory volumes and secret-backed volumes are excluded). All injected container and volume names are prefixed with the workspace canonical ID to avoid conflicts. `shareProcessNamespace: true` is set on the pod spec.

The injection state (container names, volume names, original `shareProcessNamespace` value) is recorded in a `k8shell.io/injection` annotation on the workload object. The workload controller rolls out updated pods, and from that point `k8shelld` is reachable via the standard SSH Proxy and API Server paths.

:::warning
`k8shelld` listens on TCP port **2822**. If the workload has network policies that restrict ingress, they must explicitly allow ingress on port 2822, otherwise the workspace will be unreachable.
:::

### Eject

Ejecting reverses the injection. The provisioner reads the `k8shell.io/injection` annotation, removes all injected containers, init containers, and volumes from the pod template, restores the original `shareProcessNamespace` value, and deletes associated ConfigMaps and PVCs. The workload controller rolls out clean pods. Shared PVCs are retained and must be cleaned up separately.


### Shared namespaces

The workspace container shares both the **network namespace** and the **PID namespace** with all other containers in the pod.

The shared network namespace means the workspace sees the same network interfaces and loopback as the workload containers. The user can reach any port exposed by those containers directly over `localhost`, and SSH port forwarding and in-workspace apps operate against the pod's local network.

The shared PID namespace exposes the full process tree of all containers in the pod to the workspace. Every process running in the workload is visible and accessible from the workspace shell.

### Debugging

The combination of shared network and PID namespaces makes injection workspaces well suited for live debugging of running services — without modifying the application container image or restarting the workload. From the workspace the user can:

- attach a debugger such as `gdb` or `dlv` directly to a running process in another container;
- inspect `/proc/<pid>/` entries (open file descriptors, memory maps, environment, etc.);
- inspect container's root filesystem via `/proc/<pid>/root/`;
- send signals to workload processes;
- connect to any port the workload exposes over `localhost`.

:::info
Attaching a debugger to a process in another container requires the `SYS_PTRACE` Linux capability in the workspace container. This is not granted by default and must be explicitly enabled in the blueprint's security context configuration.
:::

### Workload scaling and multiple instances

Because the workspace container is part of the workload's pod template, it scales with the workload. When a Deployment is scaled to multiple replicas, each replica runs an independent workspace instance. The SSH Proxy routes each connection to a specific pod — users connected to different replicas are in completely separate environments.

This also means there is no single canonical "workspace" associated with an injection target: the number of live workspace instances equals the number of running replicas at any given time.

### Limitations

Three workspace capabilities are unavailable in injection mode, each for a structural reason tied to how injection works.

**No home directory storage mount.** Blueprint-defined persistent volumes scoped to the user home directory are not mounted in injection mode. A persistent volume can only be exclusively owned by a single writer at a time — in a standalone pod this is guaranteed because the pod is unique. In an injection scenario the workload may scale to multiple replicas, meaning multiple workspace instances would share the same volume simultaneously with no coordination mechanism, risking data corruption. To avoid this, home directory volume mounts are disabled entirely.

**Network policies not applied.** Network policies defined in the blueprint are not enforced. The workspace container joins the existing pod's network namespace, and that pod's network posture is governed by the workload and whatever policies already apply to it in the cluster. The blueprint has no authority to modify or extend those policies after the fact.

**No Podman sidecar.** Injection workspaces are designed for debugging running workloads — container build and run capabilities serve a different purpose and add little value in that context. Additionally, the Podman sidecar may rely on a node-local persistent volume for its graph directory, which cannot be reliably managed across the replicas of a workload the provisioner does not control.
