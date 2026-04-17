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

`k8shelld` starts as PID 1 inside the main container. The bootstrap sequence has a synchronous phase followed by an asynchronous phase:

**Synchronous — servers start after these complete:**

1. **User creation** — creates the main group and workspace user with the UID and GID specified in the blueprint. Sudo is configured here if enabled.
2. **Docker socket symlink** — if the Podman sidecar is enabled, creates `/var/run/docker.sock` as a symlink to the Podman socket (`/var/run/podman/podman.sock`). This allows tools that expect a Docker socket to work transparently with the Podman sidecar.
3. **Tool wrappers** — installs wrapper scripts that replace standard Linux utilities that don't behave correctly in a container (`uptime`, `shutdown`, and others). These wrap the equivalent `kbox` commands.
4. **Server startup** — `k8shelld` starts two servers: the gRPC server (used by SSH Proxy and API Server) and a Unix socket REST server at `/var/run/k8shelld.sock` (used by `kbox` and in-workspace tooling). The workspace becomes reachable at this point.

**Asynchronous — run after servers are up:**

5. **Podman socket ownership** — if the Podman sidecar is enabled, the Podman socket ownership is updated to the workspace user's UID/GID so the user can access it without elevated privileges.
6. **Init scripts** — shell scripts defined in the blueprint, executed as the workspace user in sequence. These run once on first start.
7. **App startup** — blueprint-defined apps are started by the app manager after init scripts complete.

This means a user can connect over SSH or Console as soon as the servers are ready, while init scripts and apps complete in the background.

## Init scripts

Init scripts are shell scripts defined in the blueprint and executed as the workspace user during the asynchronous phase of bootstrap. They run **in sequence** — each script runs to completion before the next one starts. This ordering is intentional: scripts may have dependencies on each other.

Each script runs **once**. After a script completes successfully, `k8shelld` creates a flag file in `~/.k8shell/flags/` named after the script. On subsequent workspace restarts, if the flag file exists the script is skipped. Since the flag directory lives in the user's home directory — which is backed by persistent storage and survives pod restarts — init scripts are not re-run on restart.

Scripts have access to workspace tooling, including credential helpers that proxy requests to the API Server. This means an init script can authenticate with Git or a container registry without any credentials being stored in the workspace.

### Example: separate scripts with dependencies

```yaml
initScripts:
  - name: git-config
    script: |
      git config --global user.name "$(kbox user name)"
      git config --global user.email "$(kbox user email)"
      git config --global credential.helper "k8shell"

  - name: clone-repo
    script: |
      # Runs after git-config
      git clone https://github.com/my-org/my-repo ~/workspace
```

### Example: tool environment setup followed by dependency install

```yaml
initScripts:
  - name: setup-node
    script: |
      export NVM_DIR="$HOME/.nvm"
      curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
      . "$NVM_DIR/nvm.sh"
      nvm install 20

  - name: install-deps
    script: |
      export NVM_DIR="$HOME/.nvm"
      . "$NVM_DIR/nvm.sh"
      cd ~/workspace && npm install
```

### Failure behaviour

If a script exits with a non-zero status, the error is logged and the next script in the sequence still runs. A failed init script does not block the workspace — the user can connect and investigate.
