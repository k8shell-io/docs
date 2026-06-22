---
sidebar_position: 4
title: Container Images
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Container Images

A blueprint's `image` field accepts any OCI-compatible container image. The workspace runs as that image, so its available tooling is entirely determined by what is installed inside it. See [Init and Bootstrap](/architecture/workspace/init-bootstrap) for details on how the image is used when a workspace starts.

## Image requirements

k8shell imposes minimal requirements on workspace images. For full functionality, the image should include:

- **A shell** (`sh`, `bash`, etc.) — used to run init scripts and as the user's login shell inside the workspace.
- **`sudo`** — required when the user has `sudo: true`. 

Beyond that, the image can be any base you choose — a minimal distro, a language runtime, or a fully pre-configured development environment.

## k8shell images

For convenience, k8shell publishes a set of ready-to-use workspace images at `ghcr.io/k8shell-io/images`. See [Images Repository](https://github.com/k8shell-io/images) for details.

<StandardInlineTable data={`
columns:
  - header: Image
    width: 160px
  - header: Description
rows:
  - - "\`dev-base\`"
    - "Foundation image with common utilities (\`curl\`, \`wget\`, \`git\`, etc.) and Kubernetes tooling: \`kubectl\`, \`helm\`, and \`k9s\`. Use this when users need cluster access from within the workspace."
  - - "\`dev-go\`"
    - "Go development environment, layered on \`dev-base\`."
  - - "\`dev-python\`"
    - "Python development environment, layered on \`dev-base\`."
  - - "\`dev-web\`"
    - "Web / Node.js development environment, layered on \`dev-base\`."
`} />

All language-specific images inherit the full `dev-base` toolset.

To pin a specific version, use the image tag:

```yaml
blueprints:
  - name: go-dev
    template: base
    image: ghcr.io/k8shell-io/images/dev-go:latest
```

## Custom images

When you have a specific tooling requirements, you can build your image on top of a k8shell image:

```dockerfile
FROM ghcr.io/k8shell-io/images/dev-base:latest

RUN apt-get update && apt-get install -y \
    your-tool \
    && rm -rf /var/lib/apt/lists/*
```

Push the image to your registry and reference it in a blueprint using the fully qualified image name.

### Default registry

When blueprint `image` fields use a relative path (no hostname), the provisioner resolves them against `provisioner.defaultRegistry.host`:

```yaml
provisioner:
  defaultRegistry:
    host: registry.example.com
```

```yaml
blueprints:
  - name: python-dev
    template: base
    image: workspaces/python:3.12   # resolved as registry.example.com/workspaces/python:3.12
```

Fully qualified image references (including a hostname) are used as-is and are not affected by `defaultRegistry`.

### Private registry

When workspace images require authentication, configure credentials under `provisioner.privateRegistry`:

```yaml
provisioner:
  privateRegistry:
    host: registry.example.com
    username: my-user
    password: my-password
```

The provisioner passes these credentials when pulling images for workspace pods. `defaultRegistry` and `privateRegistry` are independent — you can set one without the other, or point them at different registries.

:::tip Secrets in production
In production deployments, avoid placing registry credentials directly in `values.yaml`. Use the `provisioner.privateRegistry` secret fields via the Vault Secrets chart or another secrets management mechanism. See [Common Fields](../helm-charts/common-fields#secret-fields) for the secret field reference.
:::

### Self-signed registry certificate

When the private registry uses a self-signed or internally issued TLS certificate, two separate trust configurations are required:

**Kubernetes nodes** — the CA certificate must be installed on every node that runs workspace pods so that the container runtime can pull images. This is a node-level operating system configuration; the exact steps depend on the Linux distribution and container runtime in use. Typically this means adding the CA cert to the system trust store and restarting the container runtime.

**Workspace sidecars (podman)** — workspaces that pull images internally using [Podman](/architecture/workspace/podman-sidecar) (e.g. for building or running containers inside the workspace) require the CA cert to be configured separately, as podman does not use the system trust store by default. Provide the CA certificate via the `cert` field of `provisioner.privateRegistry`:

```yaml
provisioner:
  privateRegistry:
    host: registry.example.com
    username: my-user
    password: my-password
    cert: |
      -----BEGIN CERTIFICATE-----
      ...
      -----END CERTIFICATE-----
```

The provisioner injects the certificate into workspace pods so that podman inside the workspace can pull from the registry without certificate errors.
