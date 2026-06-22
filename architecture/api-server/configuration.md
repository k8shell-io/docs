---
sidebar_position: 4
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Configuration

The API Server is configured via a YAML file. The path to the file is passed as a command-line argument at startup. String values support `${ENV_VAR}` substitution and `!file <path>` directives that load the value from a file on disk — useful for secrets mounted into the container.

:::info
In a standard k8shell deployment, configuration is managed alongside other k8shell services. This section provides a full reference of all configuration values.
:::

### Top-level fields

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`http\`"
    - "HTTP server configuration. See [HTTP](#http)."
  - - "\`jwtVerifier\`"
    - "JWT verification settings for validating user identity tokens issued by the Identity service. See [JWT verifier](#jwt-verifier)."
  - - "\`nats\`"
    - "NATS connection for reading provisioning job status. See [NATS](#nats)."
  - - "\`session\`"
    - "gRPC client configuration for the Session service. See [Session](#session)."
  - - "\`identity\`"
    - "gRPC client configuration for the Identity service. See [Identity](#identity)."
  - - "\`provisioner\`"
    - "gRPC client configuration for the Provisioner service. See [Provisioner](#provisioner)."
  - - "\`k8shelld\`"
    - "Credentials used when connecting to k8shelld inside each workspace. See [k8shelld](#k8shelld)."
  - - "\`internal\`"
    - "Server-side security settings for the internal API. See [Internal](#internal)."
`} />

## HTTP

The `http` block configures the HTTP server, session cookie behaviour, and access logging.

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
    - "TCP port the HTTP server listens on."
`} />

### Cookie

The `http.cookie` block controls the session cookie issued to browser clients after a successful OAuth login.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`name\`"
    - "\`k8shell-session\`"
    - "Name of the session cookie."
  - - "\`secure\`"
    - "\`false\`"
    - "Set the \`Secure\` attribute on the cookie. Should be \`true\` in production deployments served over HTTPS."
  - - "\`httpOnly\`"
    - "\`true\`"
    - "Set the \`HttpOnly\` attribute on the cookie, preventing JavaScript access."
  - - "\`sameSite\`"
    - "\`Lax\`"
    - "SameSite policy for the cookie: \`Strict\`, \`Lax\`, or \`None\`."
  - - "\`maxAgeSeconds\`"
    - "86400"
    - "Cookie lifetime in seconds. Defaults to one day."
  - - "\`path\`"
    - "\`/\`"
    - "URL path scope of the cookie."
  - - "\`domain\`"
    - "—"
    - "Cookie domain. Set to a leading-dot value (e.g. \`.example.com\`) to allow the cookie to be sent to subdomains, which is required for workspace app reverse proxying."
`} />

### Logging

The `http.logging` block controls structured access logging for inbound HTTP requests.

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
    - "Enable HTTP access logging."
  - - "\`requestHeaders\`"
    - "\`false\`"
    - "Include request headers in log output."
  - - "\`responseHeaders\`"
    - "\`false\`"
    - "Include response headers in log output."
`} />

## JWT verifier

The API Server validates every inbound bearer token and session-cookie-derived token against the Identity service's signing key. The same key pair is used across all k8shell services.

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
  - - "\`privateKeyFile\`"
    - "—"
    - "Path to the ES256 private key file. Required when \`signingMethod\` is \`es256\`."
  - - "\`publicKeyFile\`"
    - "—"
    - "Path to the RS256 public key file. Required when \`signingMethod\` is \`rs256\`."
`} />

Either `privateKeyFile` or `publicKeyFile` must be provided, matching the chosen `signingMethod`.

## NATS

The API Server connects to NATS to read provisioning job status written by the Provisioner. It does not publish to NATS itself.

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
    - "Enable NATS integration. When disabled, provisioning job status endpoints return an error."
  - - "\`url\`"
    - "—"
    - "NATS server URL, e.g. \`nats://nats.k8shell:4222\`."
  - - "\`username\`"
    - "—"
    - "NATS username."
  - - "\`password\`"
    - "—"
    - "NATS password. Supports \`!file <path>\` to load from a mounted secret file."
`} />

## Session

The Session service manages workspace session state. The API Server calls it to create, retrieve, and invalidate sessions on behalf of clients.

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
    - "gRPC address of the Session service, e.g. \`session.k8shell:9010\`."
  - - "\`tokenFilePath\`"
    - "—"
    - "Path to the service token used to authenticate calls to the Session service."
  - - "\`caCertPath\`"
    - "—"
    - "Path to a custom CA certificate for the Session service TLS connection."
  - - "\`serverName\`"
    - "—"
    - "Override the TLS server name used when connecting to the Session service."
`} />

## Identity

The Identity service is the source of truth for user profiles, credentials, and blueprint retrieval. The API Server calls it to resolve user context on authenticated requests.

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

## Provisioner

The API Server forwards workspace provisioning and deletion requests to the Provisioner, and queries it for workspace details and system information.

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
    - "gRPC address of the Provisioner service, e.g. \`provisioner.k8shell:9030\`."
  - - "\`tokenFilePath\`"
    - "—"
    - "Path to the service token used to authenticate calls to the Provisioner."
  - - "\`caCertPath\`"
    - "—"
    - "Path to a custom CA certificate for the Provisioner TLS connection."
  - - "\`serverName\`"
    - "—"
    - "Override the TLS server name used when connecting to the Provisioner."
`} />

## k8shelld

The API Server connects directly to the `k8shelld` daemon running inside each workspace to proxy interactive sessions, file transfers, and workspace app traffic. Unlike the other downstream services, the address is resolved per-workspace at request time from workspace metadata. Only the credential material is configured here.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`tokenFilePath\`"
    - "—"
    - "Path to the service token presented to \`k8shelld\` on each connection."
  - - "\`caCertPath\`"
    - "—"
    - "Path to a custom CA certificate used to verify the \`k8shelld\` TLS certificate."
`} />

## Internal

The `internal` block controls security restrictions on the internal API endpoints (under `/api/v1/internal`), which are called by workspace processes rather than end users.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`allowedPodCIDRs\`"
    - "—"
    - "List of CIDR ranges from which internal endpoint calls are accepted, e.g. \`10.42.0.0/16\`. When omitted, the CIDR check is skipped and any source IP is permitted. Set this to your cluster pod network CIDR to restrict access to workspace pods only."
`} />
