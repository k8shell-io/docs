---
sidebar_position: 1
title: Deployment Models
---

# Deployment Models

A workspace can run in two different configurations, each offering different runtime capabilities to the user.

## Standalone pod

In the standalone model the workspace runs as a dedicated Kubernetes pod created entirely from the blueprint. It has full access to all blueprint-defined capabilities: persistent storage, network policies, the Podman sidecar, and the complete security context. The workspace is completely isolated from other workloads at the pod boundary.

## Injection into an existing workload

In the injection model the workspace container runs inside a pod owned by an existing workload — a Deployment, StatefulSet, or DaemonSet. The workspace shares the pod's network and PID namespaces with the workload's own containers, enabling direct interaction with running services.

### Shared namespaces

The workspace container shares both the **network namespace** and the **PID namespace** with all other containers in the pod.

The shared network namespace means the workspace sees the same network interfaces and loopback as the workload containers. The user can reach any port exposed by those containers directly over `localhost`, and SSH port forwarding and in-workspace apps operate against the pod's local network.

The shared PID namespace exposes the full process tree of all containers in the pod to the workspace. Every process running in the workload is visible and accessible from the workspace shell.

### Debugging

The combination of shared network and PID namespaces makes injection workspaces well suited for live debugging of running services — without modifying the application container image or restarting the workload. From the workspace the user can:

- attach a debugger such as `gdb` or `dlv` directly to a running process in another container;
- inspect `/proc/<pid>/` entries (open file descriptors, memory maps, environment, etc.);
- inspect a container's root filesystem via `/proc/<pid>/root/`;
- send signals to workload processes;
- connect to any port the workload exposes over `localhost`.

:::info
Attaching a debugger to a process in another container requires the `SYS_PTRACE` Linux capability in the workspace container. This is not granted by default and must be explicitly enabled in the blueprint's security context configuration.
:::

### Workload scaling and multiple instances

Because the workspace container is part of the workload's pod template, it scales with the workload. When a Deployment is scaled to multiple replicas, each replica runs an independent workspace instance. The SSH Proxy routes each connection to a specific pod — users connected to different replicas are in completely separate environments.

This means there is no single canonical workspace associated with an injection target: the number of live workspace instances equals the number of running replicas at any given time.

### Limitations

Three workspace capabilities are unavailable in injection mode.

**No home directory storage.** Blueprint-defined persistent volumes for the user home directory are not available. Because the workload may scale to multiple replicas, multiple workspace instances would share the same volume simultaneously, risking data corruption.

**No Podman sidecar.** Container build capabilities are not available. Injection workspaces are designed for debugging running services, not for building images.

**Network policies not applied.** Blueprint-defined network policies are not enforced. The workspace joins the workload's existing network namespace, and network access is governed by the workload's own policies in the cluster.

For details on the provisioning mechanics see the [Standalone Pod](/concepts/provisioner/standalone-pod) and [Workload injection](/concepts/provisioner/workload-injection).
