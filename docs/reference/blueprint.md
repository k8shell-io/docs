---
sidebar_position: 1
---

# Blueprint Reference

Full field reference for platform blueprints and custom blueprints (`.k8shell.yaml`).

For a conceptual overview see [Blueprint](../concepts/overview/blueprint.md).

## Core fields

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | string | — | Required. Unique name, 1–40 characters. |
| `description` | string | — | Human-readable description, max 500 characters. |
| `isTemplate` | bool | `false` | Marks the blueprint as a base template; cannot be used directly to provision workspaces. |
| `template` | string | — | Parent blueprint to inherit settings from. Required for concrete blueprints that extend a template. |
| `splash` | string | — | Login banner shown at SSH connect. Supports Go template variables `{{.Version}}` and `{{.Commit}}`. |
| `image` | string | — | Required. Container image for the workspace pod. |
| `imagePullSecret` | string | — | Kubernetes image pull secret name. |
| `imagePullPolicy` | string | `IfNotPresent` | `Always`, `Never`, or `IfNotPresent`. |
| `hostname` | string | — | Pod hostname. Supports [CEL expressions](#cel-expressions). |
| `subdomain` | string | — | Pod subdomain. Supports [CEL expressions](#cel-expressions). |
| `env` | map | `{}` | Environment variables injected into the workspace container. |
| `portForwarding` | []string | `[localnetworks:0]` | Allowed port-forwarding rules. |
| `capabilities` | []string | — | Linux capabilities granted to the workspace container. Allowed values: `NET_ADMIN`, `NET_BIND_SERVICE`, `NET_RAW`, `SYS_ADMIN`, `SYS_TIME`, `SYS_MODULE`, `SYS_RAWIO`, `DAC_OVERRIDE`, `FOWNER`, `SETUID`, `SETGID`, `KILL`, `CHOWN`. |
| `extFiles` | map | `{}` | External files to mount into the workspace container. |
| `enableApps` | bool | `false` | Enable in-workspace app management. |

## `k8shelld`

Configures the k8shelld sidecar running inside the workspace pod.

| Field | Default | Description |
|---|---|---|
| `image` | — | Required. k8shelld container image. |
| `imagePullPolicy` | `IfNotPresent` | `Always`, `Never`, or `IfNotPresent`. |
| `ignoreOrphans` | `[]` | Glob patterns for processes k8shelld should not track as orphaned sessions (e.g. `.*JetBrains.*`). |
| `connection.allowAnyNS` | `false` | Allow connections from pods in any namespace. |
| `connection.allowAnySA` | `false` | Allow connections from any service account. |

## `network`

| Field | Default | Description |
|---|---|---|
| `networkPolicy` | `workspace` | Predefined network policy applied to the pod. Options: `workspace`, `system`, `isolated`, `user`, `organization`. |
| `allowEgress` | `[]` | Additional CIDR ranges permitted for egress regardless of the active policy. |

## `resources`

CPU and memory limits for the workspace container.

| Field | Example | Description |
|---|---|---|
| `cpu` | `4`, `500m` | CPU limit in cores or millicores. |
| `memory` | `4Gi`, `512Mi` | Memory limit. |

## `storages`

A named map of persistent volumes. Each key is an arbitrary storage name (e.g. `home`, `shared`).

| Field | Default | Description |
|---|---|---|
| `enabled` | `false` | Mount this volume into the workspace. |
| `id` | — | Identifier for shared volumes. Used to resolve the same PVC across multiple workspaces. Supports CEL. |
| `type` | `local` | `local` — a per-workspace PVC; `shared` — a shared PVC resolved by `id`. |
| `storageClass` | — | Kubernetes StorageClass name. |
| `size` | — | Required when `enabled`. Volume capacity (e.g. `10Gi`). |
| `path` | — | Required when `enabled`. Absolute mount path inside the workspace. Supports CEL. |
| `readonly` | `false` | Mount the volume read-only. |
| `annotations` | `{}` | Annotations added to the PVC. Values support CEL expressions. |

## `docker`

Configures a Docker-in-Docker (DinD) sidecar for workspaces that need to build or run containers.

| Field | Default | Description |
|---|---|---|
| `enabled` | `false` | Enable the DinD sidecar. |
| `image` | — | Required when `enabled`. DinD container image. |
| `resources` | `{cpu:500m,memory:512Mi}` | CPU/memory limits for the DinD container. |
| `groupId` | — | Required when `enabled`. GID used to create the Docker socket. |
| `subgid` | `0` | Subordinate GID. Set to `100000` for rootless DinD images. |
| `parentStorages` | `true` | Mount the workspace's storage volumes into the DinD container. |
| `extFiles` | `{}` | External files to mount into the DinD container. |
| `storages` | `{}` | Additional volumes for DinD (e.g. graph storage at `/var/lib/docker`). Same fields as [`storages`](#storages). |

## `initScripts`

A list of named shell scripts executed once when the workspace starts. The key prefix determines execution context:

| Key format | Runs in |
|---|---|
| `workspace@` | Workspace container, as the workspace user. |
| `docker@` | DinD container, as the workspace user. |

Example:

```yaml
initScripts:
  - workspace@: |
      ln -s /opt/shared $HOME/shared
  - docker@: |
      mkdir -p $HOME/.docker
      echo '{"credsStore":"k8shell"}' > $HOME/.docker/config.json
```

## `apps`

A named map of in-workspace services managed by k8shelld. Each key is an arbitrary app name.

| Field | Default | Description |
|---|---|---|
| `enabled` | `false` | Enable this app. |
| `name` | — | Required when `enabled`. Display name. |
| `binary` | — | Required when `enabled`. Absolute path to the executable. |
| `versionCmd` | — | Command array to retrieve the installed version. |
| `versionRegex` | — | Regex to extract the version string from `versionCmd` output. |
| `install` | — | Shell script to install the app if the binary is absent. |
| `installAsRoot` | `false` | Run the install script as root. |
| `start` | — | Required when `enabled`. Command array to start the app. |
| `listen` | — | Port the app listens on inside the workspace. |
| `protocol` | — | App protocol: `http`, `https`, `ws`, `wss`, `tcp`, or `udp`. |
| `restartPolicy` | — | `always`, `on-failure`, or `never`. |
| `maxRestartBackoff` | — | Maximum backoff duration between restart attempts (Go duration string, e.g. `30s`). |
| `autoStart` | `false` | Start automatically when the workspace launches. |

## Custom blueprint fields

When writing a `.k8shell.yaml`, the `blueprint` section supports all fields above plus:

| Field | Default | Description |
|---|---|---|
| `template` | — | Required. Platform blueprint to inherit from. |
| `shell` | — | Override the default shell (e.g. `/bin/zsh`). |
| `sudo` | `false` | Grant the workspace user passwordless sudo. |

## CEL expressions

Fields marked as supporting CEL use the `!cel` YAML tag. Expressions are evaluated at provisioning time by the Provisioner.

Available variables:

| Variable | Type | Description |
|---|---|---|
| `user.username` | string | Authenticated username. |
| `user.organization` | string | User's organization slug. |
| `user.uid` | int | User's numeric UID. |
| `user.gid` | int | User's primary GID. |
| `metadata.name` | string | Blueprint name. |
| `metadata.repoOwner` | string | Repository owner. |
| `workspaceName` | string | Provisioned workspace name. |

Example:

```yaml
hostname: !cel "user.username + '-' + metadata.name"
subdomain: !cel "user.organization"
storages:
  home:
    path: !cel "'/home/' + user.username"
    annotations:
      zfs-csi.k8shell.io/squash-uid: !cel "user.uid"
      zfs-csi.k8shell.io/squash-gid: !cel "user.gid"
```

## Examples

### Template blueprint

```yaml
blueprints:
  - name: base
    isTemplate: true
    image: registry.example.com/workspace:latest
    imagePullPolicy: IfNotPresent
    subdomain: !cel "user.organization"
    hostname: !cel "user.username + '-' + metadata.name"
    splash: |
      Welcome to k8shell!
      Connected to k8shelld {{.Version}}-{{.Commit}}
    k8shelld:
      image: k8shell/k8shelld:latest
      imagePullPolicy: IfNotPresent
    resources:
      cpu: "4"
      memory: 4Gi
    network:
      networkPolicy: workspace
    portForwarding:
      - localnetworks:0
```

### Development blueprint (extends template, Docker enabled)

```yaml
blueprints:
  - name: development
    template: base
    description: Development workspace with Docker and persistent storage

    capabilities:
      - NET_ADMIN
      - NET_RAW

    resources:
      cpu: "8"
      memory: 8Gi

    docker:
      enabled: true
      image: docker:29.3.0-dind
      resources:
        cpu: "8"
        memory: 8Gi
      groupId: 999
      subgid: 0
      parentStorages: true
      storages:
        graphdb:
          enabled: true
          storageClass: zfs-localpv
          size: 5Gi
          path: /var/lib/docker

    storages:
      home:
        enabled: true
        type: local
        storageClass: zfs-csi
        size: 10Gi
        path: !cel "'/home/' + user.username"
        annotations:
          zfs-csi.k8shell.io/squash-uid: !cel "user.uid"
          zfs-csi.k8shell.io/squash-gid: !cel "user.gid"

      shared:
        enabled: true
        id: !cel "metadata.repoOwner"
        type: shared
        storageClass: zfs-csi
        size: 50Gi
        path: /opt/shared

    initScripts:
      - workspace@: |
          ln -s /opt/shared $HOME/shared
      - docker@: |
          [ -f $HOME/.docker/config.json ] && exit 0
          mkdir -p $HOME/.docker
          echo '{"credsStore":"k8shell"}' > $HOME/.docker/config.json
```

### Custom blueprint (`.k8shell.yaml`)

```yaml
blueprint:
  template: base
  resources:
    cpu: "2"
    memory: 2Gi
  storages:
    home:
      enabled: true
      storageClass: zfs-csi
      size: 10Gi
      path: !cel "'/home/' + user.username"
```
