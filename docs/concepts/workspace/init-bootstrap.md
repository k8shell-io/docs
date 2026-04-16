---
sidebar_position: 1
title: Init and Bootstrap
---

# Init and Bootstrap

A workspace pod starts through two sequential phases: an init phase that injects tooling into the container filesystem, and a bootstrap phase where `k8shelld` prepares the environment before the user can connect.

## Init phase

Before the main container starts, Kubernetes runs an init container from a k8shell-provided image. The init container copies binaries into a shared `emptyDir` volume mounted at a well-known path inside the workspace:

- `k8shelld` — the in-workspace daemon
- `kbox` — the in-workspace CLI
- SFTP server binary

It also sets ownership on any storage volumes that have `fsOwnerUid` and `fsOwnerGid` configured in the blueprint. This ensures that volume mounts are owned by the correct UID/GID before the main container starts — required when a workload expects a specific owner on its storage. A typical example is the Podman sidecar's graph directory: when backed by a PVC, the volume must be owned by the UID and GID that Podman runs as inside the sidecar.

The main container image itself requires no modification. Any standard or custom image works — the tooling is injected at pod startup regardless of what the image contains.

## Bootstrap phase

`k8shelld` starts as PID 1 inside the main container. Before accepting any connections, it runs the bootstrap sequence in order:

1. **User creation** — creates the workspace user with the UID and GID specified in the blueprint. Supplementary groups are configured at this point, including the Podman socket group if the Podman sidecar is enabled.
2. **Sudo configuration** — if enabled in the blueprint, grants the workspace user passwordless sudo.
3. **Init scripts** — runs shell scripts defined in the blueprint, executed as the workspace user. These run once on first start and are the correct place for repository clones, tool configuration, and module initialization.
4. **App startup** — starts blueprint-defined apps (e.g. VS Code Server). The app manager handles installation on first run, process supervision, and restart on failure.
5. **gRPC server** — once the above steps complete, `k8shelld` opens its gRPC server and the workspace becomes reachable by the SSH Proxy and API Server.

## Init scripts vs. apps

| | Init scripts | Apps |
|---|---|---|
| **When** | Once at bootstrap | Continuously supervised |
| **What** | Shell scripts | Long-running processes |
| **Typical use** | Clone repo, configure env | VS Code Server, language servers |
| **On failure** | Logged, bootstrap continues | Restarted by app manager |
