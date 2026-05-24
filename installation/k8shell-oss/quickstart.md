---
sidebar_position: 2
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Quick Start

Install k8shell OSS on any Kubernetes cluster in a few minutes using the quickstart script. The script installs the Helm chart with a minimal working configuration — one admin user, one workspace namespace, SSH exposed via NodePort.

## 1. Download and run the script

```bash
curl -sSfL https://get.k8shell.io | bash
```

Or download it first to inspect before running:

```bash
curl -sSfL https://get.k8shell.io -o k8shell-quickstart.sh
chmod +x k8shell-quickstart.sh
./k8shell-quickstart.sh
```

### What the script does

Before making any changes, the script prints a summary and asks for confirmation:

```
  Helm action        : install
  Chart version      : latest
  Release namespace  : k8shell-system  (will be created if absent)
  Target namespace   : k8shell-workspaces  (will be created)
  SSH NodePort       : enabled (port 30022)
  SSH proxy key      : ~/k8shell-quickstart/server-key.pem  (will be generated)
  JWT issuer key     : ~/k8shell-quickstart/issuer-key.pem  (will be generated)
  Admin user         : admin  (sudo enabled, shell: /bin/bash)
  Admin SSH key      : ~/.ssh/id_ed25519.pub

Proceed with installation? [y/N]
```

It then:
1. Generates an EC server key (saved to `~/k8shell-quickstart/`)
2. Uses your existing `~/.ssh` public key, or generates a new Ed25519 pair
3. Creates namespaces and runs `helm install`

:::note Why keys are generated outside the cluster
The SSH server key must be stable across pod restarts and redeployments — if it changes, existing SSH clients will see a host key mismatch. Generating it inside the Helm chart would produce a new key on every fresh install. Instead, the key is generated once, stored locally, and injected into the cluster as Kubernetes Secret. The same key can then be reused across upgrades and reinstalls.
:::

### Options

<StandardInlineTable data={`
columns:
  - header: Flag
    width: 240px
  - header: Default
    width: 140px
  - header: Description
rows:
  - - "\`-v\`, \`--version VERSION\`"
    - "latest"
    - "Helm chart version"
  - - "\`-n\`, \`--namespace NS\`"
    - "\`k8shell-system\`"
    - "Release namespace"
  - - "\`-t\`, \`--target-namespace NS\`"
    - "\`k8shell-workspaces\`"
    - "Workspace target namespace"
  - - "\`--node-port PORT\`"
    - "\`30022\`"
    - "NodePort for SSH access"
  - - "\`--disable-node-port\`"
    - "—"
    - "Disable NodePort (use port-forward instead)"
`} />

## 2. Verify the installation

```bash
kubectl get pods -n k8shell-system
```

All pods should reach `Running` within a minute.

## 3. Connect to a workspace

Once pods are running, SSH into the default `ubuntu` workspace as `admin`:

```bash
# NodePort (default)
ssh -p 30022 -i ~/.ssh/id_ed25519 admin~ubuntu@<node-ip>

# Or find the node IP:
kubectl get nodes -o wide
```

If you disabled NodePort, use port-forwarding:

```bash
kubectl port-forward svc/ssh-proxy 2222:22 -n k8shell-system
ssh -p 2222 -i ~/.ssh/id_ed25519 admin~ubuntu@127.0.0.1
```

:::tip Username format
k8shell uses `user~workspace` as the SSH username. `admin~ubuntu` means: authenticate as `admin` and connect to the `ubuntu` workspace. See [User String](/concepts/overview/user-string) for more details.
:::

## Next steps

- [Configure workspace blueprints](./) — customise storage, Podman, resource limits
- [Add users](./) — add more users with SSH keys or password hashes
- [Expose SSH Proxy](./) — LoadBalancer or ingress setup
- [Values reference](./) — full `values.yaml` documentation
