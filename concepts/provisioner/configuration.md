---
sidebar_position: 6
---

# Configuration

This page covers two areas of Provisioner configuration: the main configuration file the Provisioner uses to perform its operations, and the Kubernetes RBAC roles and cluster roles required for the Provisioner to manage Kubernetes resources as part of the provisioning process.

## Main configuration

The Provisioner is configured via a YAML file. The path to the file is passed as a command-line argument at startup. String values support `${ENV_VAR}` substitution and `!file <path>` directives that load the value from a file on disk — useful for secrets mounted into the container.

:::info
In a standard k8shell deployment, configuration is managed alongside other k8shell services. This section provides a full reference of all configuration values.
:::

### Top-level fields

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`targetNamespace\`"
    - "required"
    - "Kubernetes namespace where standalone workspace pods are provisioned."
  - - "\`injectNamespaces\`"
    - "—"
    - "List of namespaces where workload injection is permitted. See [Injection namespaces](#injection-namespaces)."
  - - "\`clusterDomain\`"
    - "\`cluster.local\`"
    - "Kubernetes cluster domain used to construct workspace pod FQDNs."
  - - "\`defaultRegistry\`"
    - "required"
    - "Default container registry for workspace images. See [Default registry](#default-registry)."
  - - "\`k8shellCapabilities\`"
    - "—"
    - "Capabilities propagated to \`k8shelld\` inside each workspace. See [k8shell capabilities](#k8shell-capabilities)."
  - - "\`certManager\`"
    - "—"
    - "cert-manager integration for workspace TLS certificates. See [Cert-manager](#cert-manager)."
  - - "\`grpc\`"
    - "required"
    - "Provisioner gRPC server configuration. See [gRPC](#grpc)."
  - - "\`nats\`"
    - "—"
    - "NATS connection and KV store configuration for provisioning job tracking. See [NATS](#nats)."
  - - "\`identity\`"
    - "—"
    - "Address and credentials for the Identity service. See [Identity](#identity)."
  - - "\`jwtVerifier\`"
    - "required"
    - "JWT verification settings for validating workspace identity tokens. See [JWT verifier](#jwt-verifier)."
  - - "\`blueprints\`"
    - "—"
    - "Local blueprint directory and fallback settings. See [Blueprints](#blueprints)."
`} />

### Injection namespaces

`injectNamespaces` controls which namespaces the Provisioner is permitted to [inject workspaces](workload-injection.md) into:

- **Omitted or empty** — injection is fully disabled; all inject requests are rejected.
- **Explicit list** — injection is allowed only in the listed namespaces. 
- **`["*"]`** — injection is allowed in any namespace. 

### Default registry

The default registry is the container registry the Provisioner uses for workspace images. When `username` and `password` are both set, the Provisioner automatically creates an `imagePullSecret` in each workspace namespace and references it in the pod spec.
<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`host\`"
    - "required"
    - "Registry hostname, e.g. \`registry.example.com\`. Supports \`\${ENV_VAR}\` substitution."
  - - "\`certCA\`"
    - "—"
    - "Path to a custom CA certificate for the registry TLS connection. Use \`!file <path>\` to load from disk."
  - - "\`username\`"
    - "—"
    - "Registry username. The Provisioner creates an \`imagePullSecret\` in each workspace namespace automatically."
  - - "\`password\`"
    - "—"
    - "Registry password. Use \`!file <path>\` to load from a mounted secret file."
`} />

### k8shell capabilities

Settings under `k8shellCapabilities` are propagated into the `k8shelld` configuration inside each provisioned workspace.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 80px
  - header: Description
rows:
  - - "\`apiServerEnabled\`"
    - "\`true\`"
    - "Whether \`k8shelld\` connects to the API Server for credential helpers and user context calls."
  - - "\`saToken.enabled\`"
    - "\`false\`"
    - "Enable the Kubernetes service account token credential helper inside workspaces."
  - - "\`saToken.cacheTokens\`"
    - "\`false\`"
    - "Cache retrieved service account tokens to reduce API Server calls."
  - - "\`shells.detachedTTL\`"
    - "\`30m\`"
    - "How long a detached PTY shell session is kept alive with no attached client. Accepts Go duration strings (e.g. \`30m\`, \`1h\`). Set to \`0s\` to disable automatic termination."
  - - "\`shells.allowUnlimittedTTL\`"
    - "\`false\`"
    - "Allow clients to set an unlimited TTL for detached sessions."
  - - "\`shells.allowSessionDetach\`"
    - "\`false\`"
    - "Allow clients to detach from PTY shell sessions."
`} />

### Cert-manager

When `certManager.enabled` is `true`, the Provisioner creates a cert-manager `Certificate` resource for each workspace. When disabled, TLS is not configured on the workspace `k8shelld` gRPC server.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 80px
  - header: Description
rows:
  - - "\`enabled\`"
    - "\`false\`"
    - "Enable cert-manager certificate provisioning for workspaces."
  - - "\`issuer.name\`"
    - "—"
    - "Name of the cert-manager \`Issuer\` or \`ClusterIssuer\` to use. Required when enabled."
  - - "\`issuer.kind\`"
    - "—"
    - "Issuer kind: \`Issuer\` or \`ClusterIssuer\`. Required when enabled."
  - - "\`duration\`"
    - "\`24h\`"
    - "Requested certificate lifetime."
  - - "\`renewBefore\`"
    - "\`12h\`"
    - "How long before expiry cert-manager should renew the certificate."
`} />


### gRPC

The Provisioner exposes a gRPC server consumed by the [SSH Proxy](../ssh-proxy/index.md) and [API Server](../api-server/index.md).

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`port\`"
    - "required"
    - "Port the gRPC server listens on."
  - - "\`enableTLS\`"
    - "\`false\`"
    - "Enable TLS on the gRPC server."
  - - "\`certFile\`"
    - "—"
    - "Path to the TLS certificate file. Required when \`enableTLS\` is \`true\`."
  - - "\`keyFile\`"
    - "—"
    - "Path to the TLS private key file. Required when \`enableTLS\` is \`true\`."
  - - "\`authEnabled\`"
    - "\`false\`"
    - "Require JWT authentication on inbound gRPC calls."
  - - "\`audience\`"
    - "—"
    - "Expected JWT audience claim. Required when \`authEnabled\` is \`true\`."
  - - "\`allowed\`"
    - "—"
    - "List of allowed callers identified by Kubernetes service account and optional namespace. Each entry may specify \`serviceAccount\` and/or \`namespace\`."
`} />


### NATS

NATS is used to store provisioning job progress and stream status updates to API clients.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`enabled\`"
    - "\`false\`"
    - "Enable NATS integration."
  - - "\`url\`"
    - "—"
    - "NATS server URL, e.g. \`nats://nats.k8shell:4222\`."
  - - "\`username\`"
    - "—"
    - "NATS username."
  - - "\`password\`"
    - "—"
    - "NATS password. Supports \`\${ENV_VAR}\` substitution."
  - - "\`kv.provisionBucketTTL\`"
    - "\`48h\`"
    - "Retention period for provisioning job data in the NATS KV store. Accepts Go duration strings."
`} />


### Identity

The Identity service is the source of truth for user authentication and custom blueprint retrieval. The Provisioner connects to it on every provisioning request to verify the user and fetch their blueprint if applicable.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`address\`"
    - "—"
    - "gRPC address of the Identity service, e.g. \`identity.k8shell:9020\`."
  - - "\`tokenFilePath\`"
    - "—"
    - "Path to the service token used to authenticate calls to the Identity service."
  - - "\`caCertPath\`"
    - "—"
    - "Path to a custom CA certificate for the Identity service TLS connection."
  - - "\`serverName\`"
    - "—"
    - "Override the TLS server name used when connecting to the Identity service."
`} />

### JWT verifier

The JWT verifier is used to validate the identity tokens issued by the Identity service and carried inside each workspace.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`signingMethod\`"
    - "required"
    - "JWT signing algorithm. Must be \`es256\` or \`rs256\`."
  - - "\`publicKeyFile\`"
    - "—"
    - "Path to the public key file for verifying tokens signed with RS256."
  - - "\`privateKeyFile\`"
    - "—"
    - "Path to the private key file for verifying tokens signed with ES256."
`} />

Either `publicKeyFile` or `privateKeyFile` must be provided.

### Blueprints

[Platform blueprints](blueprint.md) are YAML files loaded from a local directory at startup. The Provisioner merges them with any custom blueprints retrieved from the Identity service via the [Blueprint Manager](blueprint-manager.md).

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`directory\`"
    - "required"
    - "Path to the directory containing platform blueprint YAML files. Relative paths are resolved from the config file location."
  - - "\`defaultCustomBlueprint\`"
    - "—"
    - "Blueprint name to use as a fallback when a custom blueprint is requested but the Identity service returns not-found. If omitted, a not-found error is returned to the caller instead."
`} />

## RBAC

The Provisioner requires Kubernetes RBAC permissions to create and manage workspace resources during provisioning. Permissions are scoped to specific namespaces — there are no cluster-wide role requirements.

### Standalone pod provisioning

A `Role` and `RoleBinding` are created in `targetNamespace` to allow the Provisioner to manage workspace pods and their associated resources.

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: provisioner-inject-<injectNamespace>
  namespace: <injectNamespace>
rules:
  - apiGroups: ["", "apps", "metrics.k8s.io"]
    resources:
      - pods
      - pods/resize
      - pods/exec
      - pods/log
      - pods/portforward
      - pods/attach
      - pods/proxy
      - pods/binding
      - configmaps
      - endpoints
      - persistentvolumeclaims
      - secrets
      - events
      - services
      - services/proxy
      - serviceaccounts
    verbs: ["create", "delete", "deletecollection", "get", "list", "patch", "update", "watch"]
  - apiGroups: ["coordination.k8s.io"]
    resources: ["leases"]
    verbs: ["create", "get", "list", "delete", "watch", "update", "patch"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["networkpolicies"]
    verbs: ["create", "delete", "get", "list", "watch", "update", "patch"]
  # Added when Cilium is installed:
  - apiGroups: ["cilium.io"]
    resources: ["ciliumnetworkpolicies"]
    verbs: ["create", "delete", "get", "list", "watch", "update", "patch"]
  # Added when certManager.enabled is true:
  - apiGroups: ["cert-manager.io"]
    resources: ["certificates"]
    verbs: ["create", "delete", "get", "list", "watch", "update", "patch"]
```

The `cilium.io` rule is added only when a `CiliumNetworkPolicy` CRD is detected in the cluster. The `cert-manager.io` rule is added only when `certManager.enabled` is `true`.

### Injection namespaces

A `Role` and `RoleBinding` are created in each namespace listed in `injectNamespaces`, granting the Provisioner the permissions it needs to inject and eject workspaces in that namespace.

:::warning
Injection namespaces are often owned by third-party applications that manage their own desired state. If such a tool has sync or reconciliation enabled, it may delete or overwrite the `Role` and `RoleBinding` that the Provisioner creates, causing injection to fail silently or with permission errors.

For example, if the namespace is managed by [Argo CD](https://argo-cd.readthedocs.io/) with automated sync enabled, Argo CD will treat the Provisioner-created resources as out-of-band and prune them on the next sync cycle. To avoid this, either exclude the Provisioner-managed resources from Argo CD's sync scope (e.g. using resource exclusions or the `argocd.argoproj.io/managed-by` annotation) or disable automated pruning for the affected namespace.
:::

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: provisioner-inject
  namespace: <injectNamespace>
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
  - apiGroups: ["apps"]
    resources: ["replicasets"]
    verbs: ["get"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "patch"]
  - apiGroups: [""]
    resources: ["configmaps", "secrets", "services"]
    verbs: ["get", "create", "update", "delete"]
  - apiGroups: [""]
    resources: ["persistentvolumeclaims"]
    verbs: ["get", "create"]
  - apiGroups: ["networking.k8s.io"]
    resources: ["networkpolicies"]
    verbs: ["get", "create", "update", "delete", "patch"]
  - apiGroups: ["cert-manager.io"]
    resources: ["certificates"]
    verbs: ["get", "create", "update", "delete"]
```

One `Role` and `RoleBinding` pair is created per namespace. Namespaces are determined by the `injectNamespaces` configuration field.
