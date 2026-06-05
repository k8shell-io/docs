---
sidebar_position: 1
title: k8shell Chart
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# k8shell Chart

The `k8shell` Helm chart is the base deployment for k8shell. It includes default configuration for all services and acts as the foundation for any k8shell installation. For the open-source edition, only OSS services are enabled by default. Services that require Early Access — such as the frontend console, API server, and session recording — are present in the chart but disabled; enabling them requires a valid license file.

## Configuration reference

The sections below document every parameter accepted by the chart's `values.yaml`. Parameters are grouped by service. All parameters are optional unless noted otherwise.

### Top-level

Top-level fields in `values.yaml`.

<StandardInlineTable data={`
columns:
  - header: Parameter
    width: 220px
  - header: Description
rows:
  - - "\`authEnabled\`"
    - "Enable JWT authentication for all inter-service communication. Default: \`true\`"
  - - "\`tokenExpiration\`"
    - "Lifetime of issued JWT tokens, in seconds. Default: \`600\`"
  - - "\`grpc.roundRobin\`"
    - "Enable client-side round-robin load balancing for gRPC connections between services. Services that expose a gRPC API will use a headless Service so clients can resolve all pod IPs. Default: \`true\`"
`} />

### imageRegistry 

Private container registry to pull service images.

<StandardInlineTable data={`
columns:
  - header: Parameter
    width: 220px
  - header: Description
rows:
  - - "\`host\`"
    - 'Hostname of a private container registry. Used to create an image pull secret (\`regcred\`) for all pods. Default: \`""\`'
  - - "\`username\`"
    - 'Username for the private registry. Set either this with \`password\`, or \`existingSecret\`. Default: \`""\`'
  - - "\`password\`"
    - 'Password for the private registry. Default: \`""\`'
  - - "\`existingSecret\`"
    - 'Name of a pre-existing Kubernetes pull-secret to use. Default: \`""\`'
`} />


### certManager

TLS certificate issuance via [cert-manager](https://cert-manager.io). When disabled, all services communicate over plaintext. 

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable cert-manager integration. Requires cert-manager to be installed and a ClusterIssuer configured. Default: \`false\`"
  - - "\`issuer.name\`"
    - "Name of the cert-manager Issuer or ClusterIssuer to use. Default: \`vault-root-issuer\`"
  - - "\`issuer.kind\`"
    - "Kind of the issuer resource. One of \`Issuer\` or \`ClusterIssuer\`. Default: \`ClusterIssuer\`"
  - - "\`duration\`"
    - "Requested certificate lifetime. Default: \`24h\`"
  - - "\`renewBefore\`"
    - "How far ahead of expiry cert-manager will attempt renewal. Default: \`12h\`"
`} />

### sshProxy

The SSH proxy service handles all inbound SSH connections and brokers workspace provisioning. 

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`replicas\`"
    - "Number of SSH proxy pod replicas. Default: \`1\`"
  - - "\`image.repository\`"
    - "Container image repository. Default: \`ghcr.io/k8shell-io/ssh-proxy\`"
  - - "\`image.tag\`"
    - "Container image tag. Default: \`v0.13.4\`"
  - - "\`proxyProtocol\`"
    - "Enable PROXY protocol support for preserving client IPs when behind a load balancer. Default: \`false\`"
  - - "\`serverKey\`"
    - "SSH host key. See [secret fields](#secret-fields)."
  - - "\`writeOptions\`"
    - "SSH banner display options. See [sshProxy.writeOptions](#sshproxywriteoptions)."
  - - "\`publishSshFailures\`"
    - "NATS publishing of SSH authentication failures. See [sshProxy.publishSshFailures](#sshproxypublishsshfailures)."
  - - "\`recording\`"
    - "Session recording for SSH connections. See [sshProxy.recording](#sshproxyrecording)."
  - - "\`loadBalancer\`"
    - "LoadBalancer Service exposure settings. See [sshProxy.loadBalancer](#sshproxyloadbalancer)."
  - - "\`nodePort\`"
    - "NodePort Service exposure settings. See [sshProxy.nodePort](#sshproxynodeport)."
`} />

#### sshProxy.writeOptions

Defines the information that should be provided on ssh connection to the user. 

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`showProvisionInfo\`"
    - "Show workspace provisioning details in the SSH banner. Default: \`false\`"
  - - "\`showPulse\`"
    - "Show a progress pulse while a workspace is starting. Default: \`true\`"
  - - "\`showPercentage\`"
    - "Show provisioning progress as a percentage. Default: \`true\`"
  - - "\`showErrors\`"
    - "Show user-facing errors in the SSH banner. Default: \`true\`"
  - - "\`showSystemErrors\`"
    - "Show internal system errors in the SSH banner. Default: \`true\`"
`} />

#### sshProxy.publishSshFailures

Defines whether ssh fialures will be published over NATS. This is required when SSH Shield service is present in the architecture to block IP addresses on external access interface. 

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`subject\`"
    - "NATS subject on which failures are published. Default: \`ssh.failures\`"
  - - "\`publicIPOnly\`"
    - "Only publish failures originating from public IP addresses. Default: \`true\`"
`} />

#### sshProxy.recording

Controls session recording for SSH connections. Requires the session service to be enabled.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`recordShell\`"
    - "Record interactive shell sessions. Default: \`false\`"
  - - "\`recordExec\`"
    - "Record exec channel sessions. Default: \`false\`"
  - - "\`recordDirectTCPIP\`"
    - "Record direct-tcpip (port-forward) sessions. Default: \`false\`"
`} />

#### sshProxy.loadBalancer

Expose the SSH proxy via a Kubernetes LoadBalancer Service.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable the LoadBalancer Service. Default: \`false\`"
  - - "\`annotations\`"
    - "Annotations to apply to the LoadBalancer Service (e.g. cloud provider-specific settings). Default: \`{}\`"
  - - "\`port\`"
    - "External port on the LoadBalancer Service. Default: \`22\`"
`} />

#### sshProxy.nodePort

Expose the SSH proxy via a Kubernetes NodePort Service.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable the NodePort Service. Default: \`false\`"
  - - "\`port\`"
    - "NodePort value (30000–32767). Default: \`30022\`"
`} />


### identity

The identity service handles user authentication, JWT issuance, and credential management.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`replicas\`"
    - "Number of identity pod replicas. Default: \`1\`"
  - - "\`image.repository\`"
    - "Container image repository. Default: \`ghcr.io/k8shell-io/identity\`"
  - - "\`image.tag\`"
    - "Container image tag. Default: \`v0.14.3\`"
  - - "\`users\`"
    - "List of statically defined users. Each entry requires \`username\`, \`uid\`, and \`gid\`. See [user fields](#user-fields) below. Default: Single \`admin\` user"
  - - "\`remoteProviders\`"
    - "List of remote identity provider services the identity service can delegate authentication to. Each entry requires \`address\` (host:port) and optionally \`serverName\` for TLS. Default: \`[]\`"
  - - "\`jwtIssuer\`"
    - "JWT token signing and lifetime configuration. See [identity.jwtIssuer](#identityjwtissuer)."
  - - "\`kubernetes\`"
    - "Leader election and service account token issuance. See [identity.kubernetes](#identitykubernetes)."
`} />

#### identity.jwtIssuer

JWT token issuer configuration.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`expiry\`"
    - "Lifetime of JWT tokens issued by the identity service. Default: \`60m\`"
  - - "\`privateKey\`"
    - "RSA/EC private key used to sign JWT tokens. See [secrete fields](#secret-fields). Default: \`{}\`"
  - - "\`signingMethod\`"
    - "JWT signing algorithm (e.g. \`RS256\`, \`ES256\`). See [secrete fields](#secret-fields). Default: \`{}\`"
`} />

#### identity.kubernetes

Kubernetes integration for service account token issuance. See [credential helpers](/concepts/identity/credential-helpers#kubernetes-credentials).

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`saToken.enabled\`"
    - "Enable on-demand Kubernetes service account token issuance via the TokenRequest API. Default: \`true\`"
  - - "\`saToken.ttl\`"
    - "Requested lifetime for issued service account tokens. Kubernetes enforces a minimum of 10 minutes. Default: \`1h\`"
  - - "\`saToken.audiences\`"
    - "Audiences embedded in issued service account tokens. Default: \`[https://kubernetes.default.svc.cluster.local]\`"
`} />

#### User fields

Each entry in `identity.users` supports the following fields:

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Required
    width: 90px
  - header: Description
rows:
  - - "\`username\`"
    - "Yes"
    - "Login name for the user."
  - - "\`uid\`"
    - "Yes"
    - "POSIX user ID (minimum 1)."
  - - "\`gid\`"
    - "Yes"
    - "POSIX group ID (minimum 1)."
  - - "\`fullname\`"
    - "No"
    - "Display name."
  - - "\`email\`"
    - "No"
    - "Email address."
  - - "\`blueprints\`"
    - "No"
    - 'List of blueprint names the user may access. Use \`["*"]\` to allow all.'
  - - "\`sudo\`"
    - "No"
    - "Grant the user passwordless sudo inside the workspace."
  - - "\`shell\`"
    - "No"
    - "Default login shell (e.g. \`/bin/bash\`)."
  - - "\`roles\`"
    - "No"
    - "List of k8shell roles assigned to the user (e.g. \`admin\`, \`workspace-user\`)."
  - - "\`organization\`"
    - "No"
    - "Logical organization or tenant the user belongs to."
  - - "\`password\`"
    - "No"
    - "Password for SSH password authentication."
  - - "\`publicKey\`"
    - "No"
    - "SSH public key for public-key authentication."
`} />

### provisioner

The provisioner manages the full lifecycle of workspace pods.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`replicas\`"
    - "Number of provisioner pod replicas. Default: \`1\`"
  - - "\`image.repository\`"
    - "Container image repository. Default: \`ghcr.io/k8shell-io/provisioner\`"
  - - "\`image.tag\`"
    - "Container image tag. Default: \`v0.14.9\`"
  - - "\`k8shelld.image.repository\`"
    - "Image repository for the k8shelld sidecar injected into workspace pods. Default: \`ghcr.io/k8shell-io/k8shelld\`"
  - - "\`k8shelld.image.tag\`"
    - "Image tag for k8shelld. Default: \`v0.15.6\`"
  - - "\`targetNamespace\`"
    - "**Required.** Namespace in which workspace pods are created."
  - - "\`includeBlueprintSamples\`"
    - "Include the sample blueprints (\`samples.yaml\`) alongside the base blueprints (\`base.yaml\`). The base blueprints are always included. Default: \`true\`"
  - - "\`defaultCustomBlueprint\`"
    - "Blueprint name used when a repository does not define a custom blueprint. Default: \`base\`"
  - - "\`blueprintFilesConfigMaps\`"
    - "List of ConfigMap names whose files are mounted into \`/app/blueprints\` alongside the built-in blueprint files. Default: \`[]\`"
  - - "\`injectNamespaces\`"
    - 'Namespaces where workspace injection is permitted. Use \`["*"]\` for cluster-wide injection (grants a ClusterRole). Omit or leave empty to disable injection. Default: disabled'
  - - "\`workspaceStorageClass\`"
    - 'Storage class used for workspace persistent volumes. Default: \`""\`'
  - - "\`nats.provisionBucketTTL\`"
    - "TTL for entries in the NATS KV provisioning bucket. Default: \`48h\`"
  - - "\`extraEnv\`"
    - "Extra environment variables injected into the provisioner pod. Names must not conflict with reserved variables (\`DEFAULT_REGISTRY_HOST\`, \`NATS_K8SHELL_PASSWORD\`, \`JWT_SIGNING_METHOD\`, \`DEFAULT_K8SHELLD_IMAGE\`, etc.). Default: \`[]\`"
  - - "\`defaultRegistry\`"
    - "Default container registry for workspace image pulls. See [provisioner.defaultRegistry](#provisionerdefaultregistry)."
  - - "\`shells\`"
    - "Shell session behavior for provisioned workspaces. See [provisioner.shells](#provisionershells)."
  - - "\`saToken\`"
    - "SA token credential helper configuration. See [provisioner.saToken](#provisionersatoken)."
`} />

#### provisioner.defaultRegistry

Default container registry for workspace image pulls.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable a default container registry for workspace image pulls. Default: \`true\`"
  - - "\`host\`"
    - "Default registry hostname. See [secrete fields](#secret-fields). Default: \`{}\`"
  - - "\`username\`"
    - "Default registry username. Default: \`{}\`"
  - - "\`password\`"
    - "Default registry password. Default: \`{}\`"
  - - "\`cert\`"
    - "CA certificate for the default registry (for private registries with self-signed TLS). Default: \`{}\`"
`} />

#### provisioner.shells

Shell session behavior within provisioned workspaces.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`allowSessionDetach\`"
    - "Allow clients to detach from an active PTY shell session without terminating it. Default: \`false\`"
  - - "\`detachedTTL\`"
    - "How long a detached session is kept alive before automatic termination. Default: \`30m\`"
  - - "\`allowUnlimittedTTL\`"
    - "Allow clients to set an unlimited TTL for detached sessions. Default: \`false\`"
`} />

#### provisioner.saToken

SA token credential helper for Kubernetes API access inside workspaces.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable the SA token credential helper, which provides workspaces with Kubernetes API access. Default: \`true\`"
  - - "\`cacheTokens\`"
    - "Cache retrieved service account tokens to reduce Kubernetes API server load. Default: \`false\`"
`} />


### frontend

The web console for k8shell. Disabled by default — requires Early Access. 

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable the frontend service. Default: \`false\`"
  - - "\`replicas\`"
    - "Number of frontend pod replicas. Default: \`1\`"
  - - "\`image.repository\`"
    - "Container image repository. Default: \`ghcr.io/k8shell-io/frontend\`"
  - - "\`scheme\`"
    - "URL scheme used for the frontend. One of \`http\` or \`https\`. Default: \`http\`"
  - - "\`host\`"
    - "Hostname at which the frontend is reachable. Default: \`localtest.me\`"
  - - "\`sessionCookie\`"
    - "HTTP session cookie configuration. See [frontend.sessionCookie](#frontendsessioncookie)."
`} />

#### frontend.sessionCookie

HTTP session cookie settings for the web console.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`secure\`"
    - "Set the \`Secure\` flag on the session cookie. Default: \`false\`"
  - - "\`httpOnly\`"
    - "Set the \`HttpOnly\` flag on the session cookie. Default: \`true\`"
  - - "\`sameSite\`"
    - "SameSite policy for the session cookie. One of \`Strict\`, \`Lax\`, or \`None\`. Default: \`Strict\`"
  - - "\`maxAgeSeconds\`"
    - "Session cookie lifetime in seconds. Default: \`86400\`"
  - - "\`path\`"
    - "Cookie path scope. Default: \`/api/v1\`"
  - - "\`domain\`"
    - 'Cookie domain scope. Default: \`""\`'
`} />


### apiServer

The k8shell REST API. Disabled by default — requires Early Access. 

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable the API server. Default: \`false\`"
  - - "\`replicas\`"
    - "Number of API server pod replicas. Default: \`1\`"
  - - "\`image.repository\`"
    - "Container image repository. Default: \`ghcr.io/k8shell-io/api-server\`"
  - - "\`image.tag\`"
    - "Container image tag. Default: \`v0.15.1\`"
  - - "\`logging.requestHeaders\`"
    - "Log incoming request headers. Default: \`false\`"
  - - "\`logging.responseHeaders\`"
    - "Log outgoing response headers. Default: \`false\`"
`} />

### session

Session state and terminal recording service. Disabled by default — requires Early Access. 

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable the session service. Default: \`false\`"
  - - "\`replicas\`"
    - "Number of session pod replicas. Default: \`1\`"
  - - "\`image.repository\`"
    - "Container image repository. Default: \`ghcr.io/k8shell-io/session\`"
  - - "\`image.tag\`"
    - "Container image tag. Default: \`v0.13.1\`"
  - - "\`janitor\`"
    - "Expired session cleanup settings. See [session.janitor](#sessionjanitor)."
  - - "\`recording\`"
    - "Terminal session recording configuration. See [session.recording](#sessionrecording)."
`} />

#### session.janitor

Background process that sweeps expired sessions.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`ttl\`"
    - "How long after the last heartbeat a session is considered dead and swept by the janitor. Default: \`5m\`"
  - - "\`interval\`"
    - "How often the janitor sweep runs. Default: \`1m\`"
  - - "\`batchSize\`"
    - "Maximum number of sessions the janitor processes per sweep. Default: \`100\`"
`} />

#### session.recording

Terminal session recording configuration.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable terminal session recording (asciinema v2 format). Default: \`false\`"
  - - "\`gzip\`"
    - "Compress recording files with gzip. Default: \`false\`"
  - - "\`persistentVolumeClaim\`"
    - "A PersistentVolumeClaim for recording storage. See: [session.recording.persistentVolumeClaim](#sessionrecordingpersistentvolumeclaim)."
`} />

#### session.recording.persistentVolumeClaim

Pesrsistent volume claim to store recording data.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`install\`"
    - "Create a PersistentVolumeClaim for recording storage. Default: \`false\`"
  - - "\`storageClassName\`"
    - 'Storage class for the recordings PVC. Default: \`""\`'
  - - "\`size\`"
    - "Size of the recordings PVC. Default: \`10Gi\`"
  - - "\`annotations\`"
    - "Annotations to apply to the recordings PVC. Default: \`{}\`"
`} />


### postgresql

PostgreSQL backend used by the identity, session, and provisioner services. Disabled by default — requires Early Access.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable PostgreSQL integration. Default: \`false\`"
  - - "\`host\`"
    - "PostgreSQL hostname. Default: \`postgresql\`"
  - - "\`port\`"
    - "PostgreSQL port. Default: \`5432\`"
  - - "\`database\`"
    - 'Database name. Default: \`""\`'
  - - "\`username\`"
    - "Database username. See [secrete fields](#secret-fields). Default: \`{}\`"
  - - "\`password\`"
    - "Database password. See [secrete fields](#secret-fields). Default: \`{}\`"
`} />

### nats

NATS message broker used for inter-service communication and KV storage. Disabled by default — requires Early Access. 

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable NATS integration. Default: \`false\`"
  - - "\`host\`"
    - "NATS server hostname. Default: \`nats\`"
  - - "\`port\`"
    - "NATS server port. Default: \`4222\`"
  - - "\`username\`"
    - "NATS username. Default: \`k8shell-service\`"
  - - "\`password\`"
    - "NATS password. See [secrete fields](#secret-fields). Default: \`{}\`"
`} />

## Secret fields

Unless otherwise noted, all secret-valued parameters accept a `secretRef` object instead of a plain string. There are two forms:

**Inline value** — set `value` to the literal secret. The chart will create a Kubernetes Secret containing that value. Useful for development and simple deployments.

```yaml
password:
  value: "my-password"
```

**External secret** — set `secretName` and `secretKey` to reference a pre-existing Kubernetes Secret. The chart will read the value from `secretName[secretKey]` at runtime without storing it in the chart's own Secret. This form is required when secrets are injected by an external secrets operator such as [HashiCorp Vault](https://www.vaultproject.io/) via the Vault Secrets Operator or External Secrets Operator, and is the mechanism used by the k8shell bundle chart.

```yaml
password:
  secretName: my-vault-synced-secret
  secretKey: password
```

**Fields**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`value\`"
    - "The literal value. The chart creates a Kubernetes Secret containing this value."
  - - "\`secretName\`"
    - "Name of an existing Kubernetes Secret."
  - - "\`secretKey\`"
    - "Key within the existing Secret to read the value from."
`} />
