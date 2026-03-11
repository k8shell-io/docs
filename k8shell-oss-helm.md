---
title: Install k8shell OSS with Helm
---


| Requirement | Details |
|---|---|
| Kubernetes cluster | 1.26 or later; `kubectl` configured with sufficient permissions to create namespaces, RBAC, and workloads |
| Helm 3 | 3.12 or later |
| Container registry access | Pull access to `registry.k8shell.io` (image pull credentials required) |
| Storage class | An optional `StorageClass` that supports `ReadWriteOnce` PVCs for workspace volumes. Workspaces can also be provisioned without storage. |
| SSH host key | An RSA or Ed25519 private key to use as the SSH Proxy host key. If you do not have one, you can generate it as part of the installation steps. |
| Admin credential | An SSH public key **or** a password hash to bootstrap the initial admin user in Identity. You can also generate one as part of the installation steps. |


## Overview

The **k8shell OSS** Helm chart installs the core services required to provision and access workspaces over SSH:

- **SSH Proxy**: terminates SSH connections and forwards them to workspaces
- **Identity**: authenticates users (admin bootstrap included)
- **Provisioner**: creates and manages workspace Kubernetes resources

The chart is published in the **registry.k8shell.io** registry. You configure the deployment by providing a `values.yaml` override file and/or `--set` flags.

## Prerequisites

- Kubernetes cluster with `kubectl` access
- Helm 3
- A namespace where the k8shell services will be installed (examples below use `k8shell-system`)
- A namespace where workspaces will be created (**required**; configured via `provisioner.targetNamespace`)
- A private SSH server key for the SSH Proxy (**required**; configured via `sshProxy.serverKey`)
- Admin authentication bootstrap (**required**): either an admin SSH public key or an admin password hash

> Note: The chart can run with external dependencies or bundled ones depending on values. At minimum, ensure PostgreSQL and NATS are available either by enabling `postgresql.enabled` / `nats.enabled` or by pointing `postgresql.*` / `nats.*` to existing services.

## Mandatory values (must be set before `helm install`)

| Parameter | What it is | Notes |
|---|---|---|
| `sshProxy.serverKey` | SSH private key used by the SSH Proxy as its host key | Provide via secret-style value object (see examples below). |
| `identity.adminUser.publicKey` **or** `identity.adminUser.passwordHash` | Admin bootstrap auth | Provide **one** method. `passwordHash` expects a hash (not a plaintext password). |
| `provisioner.targetNamespace` | Namespace where workspaces are created | Chart installation fails if empty. Create the namespace first. |

## Install

### 1) Create namespaces

```bash
kubectl create namespace k8shell-system
kubectl create namespace k8shell-workspaces
```

### 2) Prepare required secrets/values

This chart supports two patterns for sensitive values (fields that default to `{}`):

- **Inline value**: set `<field>.value` and the chart creates a Secret
- **Existing Secret**: set `<field>.secretName` + `<field>.secretKey`

Example: create a Secret for the SSH Proxy server key and reference it:

```bash
kubectl -n k8shell-system create secret generic k8shell-ssh-proxy-key \
  --from-file=serverKey=./ssh_proxy_host_key
```

### 3) Create an override values file

Create `values-oss.yaml`:

```yaml
# Minimal example overrides for k8shell OSS

provisioner:
  targetNamespace: k8shell-workspaces

sshProxy:
  serverKey:
    secretName: k8shell-ssh-proxy-key
    secretKey: serverKey

identity:
  adminUser:
    # Option A (SSH): admin public key
    publicKey: "ssh-ed25519 AAAA... your-admin-key"
    # Option B (password): provide a password hash instead of publicKey
    # passwordHash: "$2b$10$..."
```

### 4) Helm install

The chart is stored in `registry.k8shell.io`. Depending on how your registry is set up, you may need to login first:

```bash
helm registry login registry.k8shell.io
```

Install the chart (replace `<CHART_OCI_URI>` with the chart URI published in your registry, for example `oci://registry.k8shell.io/charts/k8shell`):

```bash
helm upgrade --install k8shell <CHART_OCI_URI> \
  --namespace k8shell-system \
  --create-namespace \
  -f values-oss.yaml
```

### 5) Verify

```bash
kubectl -n k8shell-system get pods
kubectl -n k8shell-system get svc
```

## Setting values

### Using `--set`

Use `--set` for simple scalars:

```bash
helm upgrade --install k8shell <CHART_OCI_URI> \
  -n k8shell-system \
  --set provisioner.targetNamespace=k8shell-workspaces
```

For long strings (SSH keys, hashes), prefer `-f values.yaml`. If you must use `--set`, use `--set-string`:

```bash
helm upgrade --install k8shell <CHART_OCI_URI> \
  -n k8shell-system \
  --set provisioner.targetNamespace=k8shell-workspaces \
  --set-string identity.adminUser.publicKey="ssh-ed25519 AAAA..."
```

### Secret-style values (`{}` fields)

For fields that are objects (default `{}`), the chart supports:

- `<field>.value`: chart creates a Secret
- `<field>.secretName` + `<field>.secretKey`: use an existing Secret

Example (inline value; chart creates the Secret):

```yaml
sshProxy:
  serverKey:
    value: |-
      -----BEGIN OPENSSH PRIVATE KEY-----
      ...
      -----END OPENSSH PRIVATE KEY-----
```

## Values reference

The table below describes the `values.yaml` parameters.

### Global

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `imageRegistry.host` | string | `registry.k8shell.io` | Image registry host for all k8shell service images. |
| `imageRegistry.username` | string | `""` | Registry username. Set only if not using `imageRegistry.existingSecret`. |
| `imageRegistry.password` | string | `""` | Registry password. Set only if not using `imageRegistry.existingSecret`. |
| `imageRegistry.existingSecret` | string | `""` | Name of an existing image pull secret. Mutually exclusive with `username/password`. |
| `authEnabled` | bool | `true` | Enables JWT auth for all services. |
| `tokenExpiration` | int | `600` | JWT token expiration in seconds. |

### cert-manager (TLS)

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `certManager.enabled` | bool | `false` | If `true`, chart requests TLS certs via cert-manager. If `false`, services use plaintext. |
| `certManager.issuer.name` | string | `vault-root-issuer` | Issuer name used by cert-manager. |
| `certManager.issuer.kind` | string | `ClusterIssuer` | Issuer kind (`Issuer` or `ClusterIssuer`). |
| `certManager.duration` | string | `24h` | Certificate duration (Go-style, e.g. `24h`, `720h`). |
| `certManager.renewBefore` | string | `12h` | Renewal window before expiry (Go-style duration). |

### Capabilities

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `k8shellCapabilities.apiServerEnabled` | bool | `false` | Feature flag used by services (kept for compatibility). |

### PostgreSQL

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `postgresql.enabled` | bool | `false` | Enable a bundled PostgreSQL (if supported by the chart). If `false`, use external connection details. |
| `postgresql.host` | string | `postgresql` | PostgreSQL hostname (service DNS) when using external DB. |
| `postgresql.port` | int | `5432` | PostgreSQL port. |
| `postgresql.database` | string | `""` | Database name. |
| `postgresql.username` | object | `{}` | Secret-style value for DB username (`value` or `secretName/secretKey`). |
| `postgresql.password` | object | `{}` | Secret-style value for DB password (`value` or `secretName/secretKey`). |

### NATS

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `nats.enabled` | bool | `false` | Enable a bundled NATS (if supported by the chart). If `false`, use external connection details. |
| `nats.host` | string | `nats` | NATS hostname (service DNS) when using external NATS. |
| `nats.port` | int | `4222` | NATS port. |
| `nats.user` | string | `""` | NATS username (if required by your NATS). |
| `nats.password` | string | `""` | NATS password (if required by your NATS). |

### SSH Proxy

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `sshProxy.replicas` | int | `1` | Number of SSH Proxy replicas. |
| `sshProxy.image.name` | string | `k8shell-base/ssh-proxy` | Container image name (without registry host). |
| `sshProxy.image.tag` | string | `pr-14-2f22db2` | Container image tag. |
| `sshProxy.proxyProtocol` | bool | `false` | Enables PROXY protocol v1 support (when behind a supporting LB). |
| `sshProxy.writerOptions.showProvisionInfo` | bool | `false` | Show provisioning info in SSH session output. |
| `sshProxy.writerOptions.showPulse` | bool | `true` | Show progress pulse. |
| `sshProxy.writerOptions.showPercentage` | bool | `true` | Show percentage progress. |
| `sshProxy.writerOptions.showErrors` | bool | `true` | Show provisioning errors. |
| `sshProxy.writerOptions.showSystemErrors` | bool | `true` | Show system errors. |
| `sshProxy.serverKey` | object | `{}` | **Required.** Secret-style SSH private host key for the proxy (`value` or `secretName/secretKey`). |
| `sshProxy.publishSshFailures.enabled` | bool | `false` | Publish SSH auth/session failures to NATS. |
| `sshProxy.publishSshFailures.subject` | string | `ssh.failures` | NATS subject to publish failures to. |
| `sshProxy.publishSshFailures.publicIPOnly` | bool | `true` | If `true`, only publish public client IPs. |
| `sshProxy.loadBalancer.enabled` | bool | `false` | If `true`, expose SSH Proxy via a LoadBalancer Service. |
| `sshProxy.loadBalancer.annotations` | object | `{}` | Service annotations for the LoadBalancer. |
| `sshProxy.loadBalancer.port` | int | `22` | External service port. |
| `sshProxy.nats.username` | string | `sshproxy` | NATS username for SSH Proxy service account. |
| `sshProxy.nats.password` | object | `{}` | Secret-style NATS password for SSH Proxy (`value` or `secretName/secretKey`). |

### Identity

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `identity.replicas` | int | `1` | Number of Identity replicas. |
| `identity.image.name` | string | `k8shell-base/identity` | Container image name (without registry host). |
| `identity.image.tag` | string | `pr-13-6490f1e` | Container image tag. |
| `identity.nats.username` | string | `identity` | NATS username for Identity service account. |
| `identity.nats.password` | object | `{}` | Secret-style NATS password for Identity (`value` or `secretName/secretKey`). |
| `identity.adminUser.username` | string | `admin` | Admin username. |
| `identity.adminUser.passwordHash` | string | `""` | Admin password **hash** (format depends on Identity). Leave empty when using `publicKey`. |
| `identity.adminUser.publicKey` | string | `""` | Admin SSH public key (OpenSSH format). Leave empty when using `passwordHash`. |
| `identity.fileProviders.identityFilesConfigMap` | string | *(unset)* | Optional ConfigMap providing user files (when `fileProviders` is enabled). |
| `identity.fileProviders.files` | string[] | *(unset)* | Optional list of filenames mounted into `/app/files`. |
| `identity.remoteProviders` | object[] | *(unset)* | Optional list of remote identity providers (`address`, `serverName`). |

### Provisioner

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `provisioner.replicas` | int | `1` | Number of Provisioner replicas. |
| `provisioner.image.name` | string | `k8shell-base/provisioner` | Container image name (without registry host). |
| `provisioner.image.tag` | string | `pr-26-8811ecc` | Container image tag. |
| `provisioner.blueprintFilesConfigMap` | string | `""` | Optional ConfigMap with extra blueprint files (mounted into `/app/blueprints`). |
| `provisioner.targetNamespace` | string | `""` | **Required.** Namespace where workspaces are created. |
| `provisioner.workspaceStorageClass` | string | `""` | StorageClass used for workspace PVCs (empty = cluster default). |
| `provisioner.defaultRegistry.enabled` | bool | `true` | If `true`, Provisioner sets a default image registry for workspace images. |
| `provisioner.defaultRegistry.host` | object | `{}` | Secret-style default registry host override (`value` or `secretName/secretKey`). |
| `provisioner.defaultRegistry.username` | object | `{}` | Secret-style default registry username (`value` or `secretName/secretKey`). |
| `provisioner.defaultRegistry.password` | object | `{}` | Secret-style default registry password (`value` or `secretName/secretKey`). |
| `provisioner.defaultRegistry.cert` | object | `{}` | Secret-style registry CA cert (PEM) used by workspaces, if needed. |

### Frontend (optional)

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `frontend.enabled` | bool | `false` | Enables the web UI service. |
| `frontend.replicas` | int | `1` | Number of Frontend replicas. |
| `frontend.image.name` | string | `k8shell-base/frontend` | Container image name (without registry host). |
| `frontend.image.tag` | string | `v0.12.15` | Container image tag. |
| `frontend.scheme` | string | `http` | External scheme (`http` or `https`). |
| `frontend.host` | string | `localtest.me` | External host DNS name. |
| `frontend.sessionCookie.secure` | bool | `false` | Cookie `Secure` flag. Set `true` when using HTTPS. |
| `frontend.sessionCookie.httpOnly` | bool | `true` | Cookie `HttpOnly` flag. |
| `frontend.sessionCookie.sameSite` | string | `Lax` | `Lax`, `Strict`, or `None`. |
| `frontend.sessionCookie.maxAgeSeconds` | int | `86400` | Cookie max age in seconds. |
| `frontend.sessionCookie.path` | string | `/api/v1` | Cookie path. |

### API Server (optional)

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `apiServer.enabled` | bool | `false` | Enables the API Server service. |
| `apiServer.replicas` | int | `1` | Number of API Server replicas. |
| `apiServer.image.name` | string | `k8shell-base/api-server` | Container image name (without registry host). |
| `apiServer.image.tag` | string | `v0.12.47` | Container image tag. |
| `apiServer.nats.username` | string | `apiserver` | NATS username for API Server service account. |
| `apiServer.nats.password` | object | `{}` | Secret-style NATS password for API Server (`value` or `secretName/secretKey`). |
| `apiServer.logging.requestHeaders` | bool | `false` | If `true`, log request headers (may include sensitive data). |
| `apiServer.logging.responseHeaders` | bool | `false` | If `true`, log response headers (may include sensitive data). |

### Session (optional)

| Parameter | Type | Default | Description / allowed values |
|---|---:|---:|---|
| `session.enabled` | bool | `false` | Enables the Session service. |
| `session.replicas` | int | `1` | Number of Session replicas. |
| `session.image.name` | string | `k8shell-base/session` | Container image name (without registry host). |
| `session.image.tag` | string | `v0.12.28` | Container image tag. |
| `session.nats.username` | string | `session` | NATS username for Session service account. |
| `session.nats.password` | object | `{}` | Secret-style NATS password for Session (`value` or `secretName/secretKey`). |
