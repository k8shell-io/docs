---
sidebar_position: 7
title: Podman Sidecar
---

# Podman Sidecar

The Podman sidecar is an optional second container in the workspace pod that runs a rootless Podman daemon alongside the main workspace container. It gives users the ability to pull images, build images, and run containers as part of their development workflow — without requiring any changes to the main workspace image. By default, Podman runs rootless inside the sidecar and no additional Linux capabilities are required. The main container reaches the daemon via a shared Podman socket.

## Configuration

The sidecar is configured in the blueprint under the `podman` key:

```yaml
podman:
  enabled: true
  image: quay.io/podman/stable:v5.8.1
  securityContext:
    runAsUser: 1000
    runAsGroup: 1000
    appArmorProfile:
      type: Unconfined
  resources:
    cpu: 2
    memory: 2Gi
  parentStorages: true
  createDockerSockSymlink: true
```

### Fields

<StandardInlineTable data={`
columns:
  - header: Field
    width: 240px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Whether the Podman sidecar is added to the workspace pod."
  - - "\`image\`"
    - "Container image for the sidecar. Should be a stable Podman image."
  - - "\`securityContext\`"
    - "Security context for the sidecar container. Controls UID/GID, privilege level, and AppArmor profile. Default is rootless (UID/GID 1000, unprivileged)."
  - - "\`extFiles\`"
    - "Additional files to inject into the sidecar container. Commonly used to customize Podman configuration."
  - - "\`resources.cpu\`"
    - "CPU limit for the sidecar container."
  - - "\`resources.memory\`"
    - "Memory limit for the sidecar container."
  - - "\`parentStorages\`"
    - "When true, storage volumes defined for the main container are also mounted into the sidecar at the same paths."
  - - "\`createDockerSockSymlink\`"
    - "Creates \`/var/run/docker.sock\` as a symlink to the Podman socket in the main container. Allows Docker-native tools to work without reconfiguration."
`} />

### Namespace isolation

By default, containers launched by Podman inside the sidecar do not get their own fully isolated set of namespaces. This behavior is determined by the default security context shown in the listing above. 

With this configuration, Podman starts containers in the "host" namespaces of the sidecar itself:

- **Network** — containers share the network namespace of the main workspace container. They can reach and be reached by processes in the main container directly on localhost, without any port publishing. From the container's perspective, the network looks like the workspace's network.
- **PID** — containers share the PID namespace of the Podman sidecar. They are not isolated from each other or from the Podman daemon process at the PID level.
- **Resource limits** — all containers running inside the sidecar are subject to the CPU and memory limits configured for the sidecar itself. There is no per-container resource accounting beyond what Podman can enforce within those bounds.

### Privileged mode for full isolation

It is possible to configure the sidecar to run in privileged mode, which allows Podman to provide full namespace isolation across all namespaces for each container:

```yaml
securityContext:
  runAsUser: 0
  runAsGroup: 0
  privileged: true
extFiles:
  /etc/containers/containers.conf: |
    [containers]
    log_driver = "k8s-file"
    [engine]
    cgroup_manager = "cgroupfs"
    events_logger="file"
    runtime="crun"
```

:::warning
This configuration is insecure and can be used by an attacker to escape the container and gain root access to the node. Use only when full namespace isolation is required and control access through security policies that restrict this configuration to specific users or roles.
:::

## Graph storage

By default, Podman writes pulled image layers and container data to the sidecar's ephemeral filesystem. This is unbounded and counts against the ephemeral storage limit of the sidecar container. For any serious use, you should back the graph root with a dedicated PVC.

The Podman graph root is `/home/podman/.local/share/containers`. Mounting a PVC there gives you a hard size cap and keeps the data off the ephemeral filesystem:

```yaml
storages:
  graphdb:
    enabled: true
    path: "/home/podman/.local/share/containers"
    fsOwnerUid: 1000
    fsOwnerGid: 1000
    readonly: false
    claimSpec:
      storageClassName: zfs-localpv
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: 5Gi
```

`fsOwnerUid` and `fsOwnerGid` tell the init container to chown the volume root to UID/GID 1000 before the sidecar starts — the UID/GID Podman runs as inside the sidecar. Without this, Podman cannot write to the volume.

Using a node-local storage class (like `zfs-localpv`) is recommended here. Image layer writes are I/O-intensive and benefit from local disk, and `ReadWriteOnce` access is all that is needed since the volume is used by a single pod at a time. See [Storage](./storage.md) for more detail on node-local storage.
