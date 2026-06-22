---
sidebar_position: 3
---

# Standalone Pod

In the standalone model the Provisioner provisions the workspace by running `helm install` with the `k8shell-workspace` chart against the resolved blueprint. The chart creates the following Kubernetes resources:

<StandardInlineTable data={`
columns:
  - header: Resource
    width: 200px
  - header: Description
rows:
  - - Pod
    - "The workspace pod containing an init container, the main workspace container running \`k8shelld\` as PID 1, and an optional [Podman sidecar](blueprint#podman)."
  - - Service
    - "A ClusterIP service exposing the \`k8shelld\` gRPC port for SSH Proxy and API Server connectivity."
  - - Headless Service
    - "A headless service that allocates a stable DNS name for the workspace pod. See [DNS allocation](#dns-allocation) below."
  - - ConfigMaps
    - "Workspace configuration and any external files defined in the blueprint."
  - - PersistentVolumeClaims
    - "One PVC per [storage volume](blueprint#storage) defined in the blueprint."
  - - NetworkPolicy
    - "The [network policy](blueprint#network) variant selected by the blueprint (\`workspace\`, \`system\`, \`isolated\`, \`user\`, or \`organization\`)."
  - - Certificate
    - "A TLS certificate for the \`k8shelld\` gRPC server."
`} />

## Pod metadata

The Provisioner sets annotations and labels on the workspace pod at creation time. These are used by the provisioner to inspect, filter, and audit workspaces. The Pod name is the workspace [canonical ID](../overview/user-string.md#canonical-id).

### Annotations

<StandardInlineTable data={`
columns:
  - header: Annotation
    width: 240px
  - header: Description
rows:
  - - "\`k8shell.io/identity\`"
    - "The identity provider and organization used to authenticate the workspace owner, in the form \`<provider>/<organization>\`."
  - - "\`k8shell.io/manifest-hash\`"
    - "SHA-256 hash of the resolved blueprint manifest used to create the workspace. Changes when the blueprint is modified."
  - - "\`k8shell.io/userstr\`"
    - "Base64-encoded canonical user string used for workspace provisioning."
`} />

### Labels

<StandardInlineTable data={`
columns:
  - header: Label
    width: 240px
  - header: Description
rows:
  - - "\`k8shell.io/blueprint\`"
    - "Name of the blueprint used to provision the workspace."
  - - "\`k8shell.io/canonical-id\`"
    - "[Canonical ID](../overview/user-string#canonical-id) of the workspace in the form \`<username>-<short-hash>\`. Matches the Helm release name and pod name."
  - - "\`k8shell.io/job-id\`"
    - "UUID of the [provisioning job](provisioning-flow#job-tracking) that created the workspace."
  - - "\`k8shell.io/k8shelld-version\`"
    - "Version of the \`k8shelld\` binary running inside the workspace container."
  - - "\`k8shell.io/network-policy\`"
    - "Network policy class applied to the workspace pod."
  - - "\`k8shell.io/organization\`"
    - "Organization the workspace owner belongs to."
  - - "\`k8shell.io/subdomain\`"
    - "Subdomain used for DNS routing, derived from the identity provider organization."
  - - "\`k8shell.io/username\`"
    - "Username of the workspace owner."
`} />

## Namespace prerequisites

Before workspaces can be provisioned into a namespace, the namespace must have the following resources in place. The Provisioner creates these automatically the first time it provisions a workspace into a namespace if they are not already present.

### Registry credentials

When the Provisioner's default registry is configured with a `username` and `password`, it automatically creates an image pull secret of type `kubernetes.io/dockerconfigjson` in each workspace namespace and passes it to the Helm chart, which sets it as `imagePullSecrets` on the pod spec. This allows workspace images to be pulled from a private registry without any manual secret management.

If the default registry is configured without credentials or is not configured at all, no pull secret is created and the pod relies on the node's existing pull access.

### DNS allocation

Each workspace pod is allocated a stable DNS name derived from its [canonical ID](../overview/user-string#canonical-id):

```
<canonical-id>.<target-namespace>.svc.cluster.local
```

For example, a workspace with canonical ID `alice-3b6e5f4` provisioned into the `workspaces-staging` namespace is reachable at:

```
alice-3b6e5f4.workspaces-staging.svc.cluster.local
```

This is achieved via a **headless Service** (`clusterIP: None`) per workspace namespace. In Kubernetes, a headless service causes each pod selected by the service to receive its own DNS A record in the form `<pod-name>.<service-name>.<namespace>.svc.cluster.local`. The Provisioner creates this service automatically when provisioning the first workspace into a namespace.

The stable DNS name allows users to reach a workspace — or another user's workspace — by a predictable address without needing to look up the pod IP. This is useful when accessing workspaces directly from within the cluster, for example from scripts, tooling, or cross-workspace communication.

## Helm

The `k8shell-workspace` chart is embedded directly in the Provisioner binary and versioned together with it. The chart cannot be used independently — a successful installation requires provisioner-side logic that runs before and after the Helm operation (identity resolution, secret injection, annotation management, and status reporting). Attempting to install the chart manually without the Provisioner will produce an incomplete workspace.

Because each workspace is a standard Helm release, it is fully visible and manageable with standard Helm tooling independently of k8shell. The Provisioner installs and uninstalls releases via the Helm SDK — no `helm` CLI invocation is involved at runtime.

Platform operators can inspect, audit, or forcibly remove workspaces using the Helm CLI:

```
$ helm list -n workspaces-staging
NAME             NAMESPACE          REVISION  UPDATED                    STATUS    CHART                     APP VERSION
alice-3b6e5f4    workspaces-staging 1         2026-05-16 22:16:55 UTC    deployed  k8shell-workspace-1.2.0   0.13.0
alice-85a782e    workspaces-staging 1         2026-05-15 22:02:39 UTC    deployed  k8shell-workspace-1.2.0   0.13.0
bob-bd7395d      workspaces-staging 1         2026-05-16 22:19:47 UTC    deployed  k8shell-workspace-1.2.0   0.13.0
```

Each row is one active workspace. The release name is the workspace canonical ID (username + short hash). The chart version reflects the `k8shell-workspace` chart version, and the app version identifies the k8shell platform build the workspace was created from.

Useful operations:

- `helm get all <name> -n <namespace>` — inspect the full rendered manifest and values;
- `helm uninstall <name> -n <namespace>` — forcibly remove a workspace and all its resources; useful for recovery when the normal k8shell deletion flow is unavailable.
