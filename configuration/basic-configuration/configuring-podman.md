---
sidebar_position: 6
title: Configuring Podman
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Configuring Podman

The Podman sidecar is an optional second container added to the workspace pod alongside the main workspace container. It runs a Podman daemon that users can reach via a shared socket, giving them the ability to pull, build, and run containers as part of their development workflow — without modifying the main workspace image.

See [Podman Sidecar](/architecture/workspace/podman-sidecar) for the full concept reference and field documentation.

## Modes of operation

Podman in a workspace can be configured in two modes, each with a different security and isolation profile:

- **Rootless (default)** — Podman runs as an unprivileged user inside the sidecar. No additional Linux capabilities or privileged mode are required. Containers launched by Podman share the network and PID namespaces of the sidecar — they cannot have their own fully isolated namespaces, but they run safely within the workspace boundary.

- **Privileged** — The sidecar runs as root with `privileged: true`. Podman can provide full namespace isolation (network, PID, mount) for each container it runs, behaving more like a standalone container runtime. This comes with a security trade-off.

## Rootless mode

Rootless is the recommended starting point. It requires no special node configuration and poses no container escape risk.

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

`createDockerSockSymlink: true` creates `/var/run/docker.sock` as a symlink to the Podman socket in the main container. This means standard Docker CLI tooling works out of the box without any reconfiguration:

```bash
# inside the workspace — using Docker CLI transparently via Podman
docker build -t my-app .
docker run --rm my-app echo "hello"
docker images
```

**Trade-offs of rootless mode:**
- Containers share the sidecar's network namespace — they are reachable on localhost from within the workspace, but cannot bind their own interfaces or have isolated network stacks.
- No per-container PID isolation.
- All containers run within the CPU/memory limits of the sidecar itself.

## Privileged mode

Privileged mode allows full namespace isolation. Use it when workloads inside the workspace require their own network interfaces, isolated PIDs, or when the image build process requires elevated kernel capabilities.

```yaml
podman:
  enabled: true
  image: quay.io/podman/stable:v5.8.1
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
  resources:
    cpu: 2
    memory: 2Gi
  parentStorages: true
  createDockerSockSymlink: true
```

The `containers.conf` override is required to switch Podman to the `cgroupfs` cgroup manager and `file`-based event logging, both of which work correctly inside a Kubernetes pod without systemd.

**Trade-offs of privileged mode:**
- Full namespace isolation per container — each `docker run` gets its own network stack, PID namespace, and mount points.
- Behaves like a local Docker daemon from the developer's perspective.
- A compromised or malicious workload running inside the sidecar can potentially escape to the node.

:::warning
`privileged: true` grants the sidecar root-level access to the node kernel. Use only when the use case explicitly requires full isolation and when access is controlled via roles. The [Worktrace](/architecture/worktrace) service can be used to monitor workspace activity and detect anomalous behaviour indicative of a container escape.
:::

## Docker credential helpers

k8shell automatically installs Docker-compatible credential helpers inside workspace pods. When a user runs `docker pull` or `docker build` (via the Podman socket), credentials for configured registries are resolved transparently — no manual `docker login` is required. 

## Graph storage

By default Podman writes image layers and container data to the sidecar's ephemeral filesystem. For any non-trivial use, back the graph root with a PVC to avoid hitting ephemeral storage limits. The correct path depends on the mode:

<StandardInlineTable data={`
columns:
  - header: Mode
    width: 200px
  - header: Graph root path
rows:
  - - "Rootless (UID 1000)"
    - "\`/home/podman/.local/share/containers\`"
  - - "Privileged (UID 0)"
    - "\`/var/lib/containers/storage\`"
`} />

Example PVC for rootless mode:

```yaml
storages:
  graphdb:
    enabled: true
    path: /home/podman/.local/share/containers
    fsOwnerUid: 1000
    fsOwnerGid: 1000
    claimSpec:
      storageClassName: openebs-zfs
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: 20Gi
```

For privileged mode, you need to change `path` to `/var/lib/containers/storage` and set `fsOwnerUid` and`fsOwnerGid` to `0`.
