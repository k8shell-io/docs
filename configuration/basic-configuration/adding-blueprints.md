---
sidebar_position: 3
title: Adding Blueprints
---

# Adding Blueprints

Blueprints define how workspaces are created — which container image to use, what resources to allocate, which init scripts to run, and more. The provisioner loads blueprints from Kubernetes ConfigMaps, allowing them to be managed independently of the chart and updated without a Helm release.

## Creating a blueprint ConfigMap

Organise blueprint definitions as `.yaml` files in a local directory, then create the ConfigMap with `kubectl`:

```bash
kubectl create configmap my-blueprints \
  --from-file=blueprints/ \
  --namespace k8shell-system \
  --dry-run=client -o yaml | kubectl apply -f -
```

The blueprint ConfigMap must be created in the same namespace as the k8shell services, i.e. provisioner, ssh-proxy, identity, etc.

:::info
Using `--dry-run=client -o yaml | kubectl apply` rather than a plain `create` makes the operation idempotent — safe to re-run whenever the blueprint files change.
:::

A directory layout:

```
blueprints/
  python-dev.yaml
  node-dev.yaml
```

Each file contains a `blueprints` list. For example, `blueprints/python-dev.yaml`:

```yaml
blueprints:
  - name: python-dev
    template: base
    image: docker.io/python:3.12-slim
```

### Blueprint Hierarchy

Every blueprint must reference a `template`. The built-in `base` template is the standard starting point. For more complex setups you can define your own template blueprints — set `isTemplate: true` on a blueprint and use its name as the `template` value in others. This lets you build a reusable hierarchy where shared configuration is defined once and inherited by multiple concrete blueprints. 

See [Blueprint](/architecture/overview/blueprint) for general concepts and [Blueprint Reference](/architecture/provisioner/blueprint) for the full field reference.

### Container Images

Any OCI-compatible container image can be used — for example `python:3.12-slim` or a custom internal image. The workspace environment is bounded by what is installed in that image. 

See [Container Images](/configuration/basic-configuration/container-images) for more details.

## Referencing the ConfigMap

Add the ConfigMap name to `provisioner.blueprintFilesConfigMaps` in `values.yaml` and apply the chart:

```yaml
provisioner:
  blueprintFilesConfigMaps:
    - my-blueprints
```

The provisioner mounts and reads the ConfigMap at startup. To apply blueprint changes after the initial deployment, update the ConfigMap (re-run the `kubectl apply` above) and restart the provisioner pod — no Helm upgrade required.
