---
sidebar_position: 6
---

# Configuration

This page covers two areas of Identity configuration: the main configuration file used to run the service, and the Kubernetes RBAC roles required for Identity to issue service account tokens on behalf of users.

## Main configuration

The Identity service is configured via a YAML file. String values support `${ENV_VAR}` substitution and `!file <path>` directives that load the value from a file on disk — useful for secrets mounted into the container.

:::info
In a standard k8shell deployment, configuration is managed alongside other k8shell services. This section provides a full reference of all configuration values.
:::

## Top-level fields

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`grpc\`"
    - "required"
    - "gRPC server configuration. See [gRPC](#grpc)."
  - - "\`nats\`"
    - "—"
    - "NATS client configuration for event publishing. See [NATS](#nats)."
  - - "\`db\`"
    - "—"
    - "Database connection. See [Database](#database)."
  - - "\`organizations\`"
    - "—"
    - "Organization auto-creation rules. See [Organizations](#organizations)."
  - - "\`localProviders\`"
    - "—"
    - "Local file-based identity provider. See [Local providers](#local-providers)."
  - - "\`remoteProviders\`"
    - "—"
    - "List of remote identity provider clients. See [Remote providers](#remote-providers)."
  - - "\`jwtIssuer\`"
    - "required"
    - "JWT token issuance configuration. See [JWT issuer](#jwt-issuer)."
  - - "\`kubernetes\`"
    - "required"
    - "Kubernetes namespace and token management. See [Kubernetes](#kubernetes)."
`} />

## gRPC

Identity exposes its API over gRPC. This section configures the server and controls which callers are authorized to connect.

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

## NATS

NATS is used for publishing events from Identity to other k8shell services.

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
    - "NATS password. Use \`!file <path>\` or \`\${ENV_VAR}\` for secrets."
`} />

## Database

The database stores user records, credentials, and SSH public keys. When disabled, Identity operates in file-provider-only mode and all state is ephemeral.

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
    - "Enable the database connection."
  - - "\`hostname\`"
    - "required"
    - "PostgreSQL hostname."
  - - "\`port\`"
    - "\`5432\`"
    - "PostgreSQL port."
  - - "\`database\`"
    - "required"
    - "Database name."
  - - "\`username\`"
    - "required"
    - "Database username."
  - - "\`password\`"
    - "required"
    - "Database password."
`} />

## Organizations

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`autoCreate\`"
    - "—"
    - "List of organization names to create automatically when a user with that organization is first seen."
`} />

## Local providers

The local provider reads user definitions from one or more YAML files on disk. It is the built-in fallback provider and does not require a remote process.

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
    - "Enable the local file provider."
  - - "\`files\`"
    - "—"
    - "List of paths to user definition YAML files. Paths are resolved relative to the configuration file directory."
`} />

## Remote providers

`remoteProviders` is a list of remote identity providers that Identity connects to over gRPC. Each entry configures the connection to one provider implementing `IdentityProviderService`. See [Providers](./providers.md) for details on how providers are resolved.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`address\`"
    - "required"
    - "gRPC address of the provider, e.g. \`idp-github.k8shell:9030\`."
  - - "\`tokenFilePath\`"
    - "—"
    - "Path to a token file used to authenticate calls to the provider."
  - - "\`caCertPath\`"
    - "—"
    - "Path to a custom CA certificate for the provider's TLS connection."
  - - "\`serverName\`"
    - "—"
    - "Override the TLS server name used when connecting to the provider."
`} />

## JWT issuer

Configures the JWT tokens that Identity issues to authenticated users. Issued tokens are used by the API Server, SSH Proxy, and other k8shell services to verify user identity. See [Tokens](./tokens.md) for details on token contents and signing.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`issuer\`"
    - "required"
    - "Value of the \`iss\` claim embedded in every token, e.g. \`identity.k8shell\`."
  - - "\`audience\`"
    - "—"
    - "Value of the \`aud\` claim. Must match the audience configured in verifying services. When omitted, no audience claim is included."
  - - "\`expiry\`"
    - "\`1h\`"
    - "Token lifetime. Accepts Go duration strings, e.g. \`30m\`, \`2h\`."
  - - "\`signingMethod\`"
    - "required"
    - "Signing algorithm: \`es256\` or \`rs256\`."
  - - "\`privateKeyFile\`"
    - "—"
    - "Path to the PEM-encoded private key. Required for \`es256\` and \`rs256\`."
`} />

## Kubernetes

Identity uses the Kubernetes API to request tokens for users.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`saToken.enabled\`"
    - "\`true\`"
    - "Enable on-demand Kubernetes service account token issuance via the TokenRequest API. When disabled, \`GetUserCredential\` requests for Kubernetes credentials are rejected."
  - - "\`saToken.ttl\`"
    - "\`1h\`"
    - "Requested lifetime for issued service account tokens. Kubernetes enforces a minimum of 10 minutes."
  - - "\`saToken.audiences\`"
    - ""
    - "Audiences embedded in issued service account tokens."
`} />

## RBAC

To issue service account tokens via the Kubernetes TokenRequest API, Identity requires a `Role` and `RoleBinding` in each namespace where Kubernetes credentials may be requested. This is currently supported for [standalone Pod workspaces](../workspace/deployment-models.md).

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: identity
  namespace: <target-namespace>
rules:
  - apiGroups: [""]
    resources: ["serviceaccounts/token"]
    verbs: ["create"]
```

One `Role` and `RoleBinding` pair is required per namespace. The namespace corresponds to the `service_scope` value on the Kubernetes credential row. 
