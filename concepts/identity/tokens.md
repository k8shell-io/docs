---
sidebar_position: 4
---

# Tokens

k8Shell uses two types of tokens: **JWTs** issued by the Identity service for authenticated sessions, and **Personal Access Tokens (PATs)** for long-lived programmatic access with explicit permission scopes.

## JWT

JWTs represent authenticated users and are presented to k8Shell services — such as the API Server and SSH Proxy — to authorize access to resources. They are short-lived by design (default TTL: 1 hour) and are not stored in the database. When a token expires, callers obtain a new one via the `IssueUserToken` RPC.

### Claims

Each token is a standard signed JWT. The following claims are embedded in every token:

<StandardInlineTable data={`
columns:
  - header: Claim
    width: 160px
  - header: JWT field
    width: 100px
  - header: Description
rows:
  - - "Token ID"
    - "\`jti\`"
    - "Unique identifier for this token. A randomly generated value, used to distinguish tokens issued at different times for the same user."
  - - "Subject"
    - "\`sub\`"
    - "The user's username."
  - - "Issuer"
    - "\`iss\`"
    - "The configured Identity issuer name (e.g. \`identity.k8shell\`)."
  - - "Issued At"
    - "\`iat\`"
    - "Timestamp when the token was minted."
  - - "Expires At"
    - "\`exp\`"
    - "Timestamp after which the token is no longer valid. Determined by \`jwtIssuer.expiry\` (default 1 hour)."
  - - "Audience"
    - "\`aud\`"
    - "Intended audience of the token (e.g. \`k8shell\`)."
  - - "Email"
    - "\`email\`"
    - "User's email address from the identity provider."
  - - "Name"
    - "\`name\`"
    - "User's full name."
  - - "UID"
    - "\`uid\`"
    - "User's POSIX UID."
  - - "GID"
    - "\`gid\`"
    - "User's primary POSIX GID."
  - - "Roles"
    - "\`roles\`"
    - "List of RBAC roles assigned to the user."
  - - "Organization"
    - "\`organization\`"
    - "The organization the user belongs to."
  - - "Source"
    - "\`source\`"
    - "Name of the identity provider that owns the user record. Used by Identity when resolving a user from a token."
`} />

### Signing

Identity supports two signing algorithms, configured via `jwtIssuer.signingMethod`:

- **`es256`** — ECDSA with P-256. Requires a private key file (`jwtIssuer.privateKeyFile`). The corresponding public key is derived from the private key for verification.
- **`rs256`** — RSA with SHA-256. Requires a private key file for signing. Verifiers use the corresponding public key file.

The signing key never leaves the Identity process. Services that only need to verify tokens — such as the API Server and SSH Proxy — are configured with the public key only.

See [Configuration — JWT issuer](./configuration.md#jwt-issuer) for all available fields.

### Authorization

A JWT is the primary input to the authorization layer. When the API Server or SSH Proxy receives a request, it extracts the user identity and roles from the JWT and submits an authorization decision to the [Authorization service](../authz/). The Authz service evaluates the request against declarative [OPA](https://www.openpolicyagent.org/) policies written in Rego, organized into four policy domains — **User**, **Workspace**, **Session**, and **SSH** — each covering a distinct area of the platform.

For details on how policies are structured and evaluated, see the [Authorization service](../authz/) documentation.

## Personal Access Token (PAT)

PATs are opaque tokens issued through the Identity API for programmatic access. A PAT is always linked to a specific user — it acts on that user's behalf and is subject to the same OPA policy rules as a JWT. A PAT may have a fixed expiry or may be valid indefinitely until explicitly revoked. PATs are accepted as bearer tokens by the API Server — see [Authentication](/concepts/api-server/authentication#api-path) for how they are handled at the request layer.

Access is further constrained by **scopes**, which map to the authorization action strings evaluated by the policy engine. Scopes can only narrow the actions a PAT is permitted to perform — they cannot grant access that the user's policy would otherwise deny.

### Scope grammar

A scope is a colon-separated string. The following forms are recognized:

```
scope     = "*"
          | domain ":" action
          | domain ":" action ":" qualifier
          | domain ":" action ":" "*"
          | domain ":" "*"
```

- The bare **`*`** wildcard grants unrestricted access to all actions.
- A **`:*` suffix** expands to all recognized qualifiers within the prefix (e.g. `workspace:connect:*` covers all connection types).
- A scope without a wildcard is **exact** — it matches only that specific action string. For example, `workspace:connect:webshell` does not implicitly cover `workspace:connect:webfiles`.

### Available scopes

#### `workspace`

<StandardInlineTable data={`
columns:
  - header: Scope
    width: 240px
  - header: Description
rows:
  - - "\`workspace:provision\`"
    - "Provision a workspace."
  - - "\`workspace:list\`"
    - "List workspaces."
  - - "\`workspace:create\`"
    - "Create a new workspace."
  - - "\`workspace:read\`"
    - "Read workspace details."
  - - "\`workspace:delete\`"
    - "Delete a workspace."
  - - "\`workspace:files\`"
    - "Access workspace file browser."
  - - "\`workspace:connect:webshell\`"
    - "Open a web shell connection to a workspace."
  - - "\`workspace:connect:webfiles\`"
    - "Open a web file manager connection to a workspace."
  - - "\`workspace:connect:portforward\`"
    - "Open a port-forward connection to a workspace."
  - - "\`workspace:app:install\`"
    - "Install an app in a workspace."
  - - "\`workspace:app:start\`"
    - "Start a workspace app."
  - - "\`workspace:app:stop\`"
    - "Stop a workspace app."
`} />

Wildcard shortcuts: `workspace:*` (all workspace actions), `workspace:connect:*` (all connect types), `workspace:app:*` (all app operations).

#### `user`

<StandardInlineTable data={`
columns:
  - header: Scope
    width: 240px
  - header: Description
rows:
  - - "\`user:list\`"
    - "List users."
  - - "\`user:onboard\`"
    - "Onboard a new user."
  - - "\`user:auth\`"
    - "Authenticate a user via SSH."
  - - "\`user:read:profile\`"
    - "Read a user's profile."
  - - "\`user:read:sessions\`"
    - "Read a user's sessions."
  - - "\`user:read:credentials\`"
    - "Read a user's stored credentials."
  - - "\`user:read:blueprints\`"
    - "Read a user's workspace blueprints."
`} />

Wildcard shortcuts: `user:*` (all user actions), `user:read:*` (all readable data types).

#### `session`

<StandardInlineTable data={`
columns:
  - header: Scope
    width: 240px
  - header: Description
rows:
  - - "\`session:start\`"
    - "Start a terminal session."
`} />

Wildcard shortcut: `session:*` (all session actions).

#### `ssh`

<StandardInlineTable data={`
columns:
  - header: Scope
    width: 240px
  - header: Description
rows:
  - - "\`ssh:shell\`"
    - "Open an interactive SSH shell."
  - - "\`ssh:exec\`"
    - "Execute a command over SSH."
  - - "\`ssh:sftp\`"
    - "Access files over SFTP."
  - - "\`ssh:direct-tcpip\`"
    - "Forward TCP connections over SSH."
  - - "\`ssh:direct-streamlocal\`"
    - "Forward Unix socket connections over SSH."
  - - "\`ssh:agent-forward\`"
    - "Forward an SSH agent."
`} />

Wildcard shortcut: `ssh:*` (all SSH actions).

### Authorization

When the API Server receives a request with a PAT, authorization is evaluated in two sequential steps:

1. **Policy check** — the API Server evaluates the OPA policy using the linked user's identity and roles, exactly as it would for a JWT. The request is denied if policy does not permit the action for that user.
2. **Scope check** — `ScopeAllows` checks the token's scope list against the action string. The request is denied if no scope covers the action.

Both checks must pass. Because policy is evaluated first against the user's full permissions, scopes can only define a **subset** of what the user is allowed to do — they can never grant access that policy would otherwise deny.

Scope matching rules (applied in order):

1. A scope of `*` matches any action.
2. A scope ending with `:*` matches any action that starts with the scope's prefix (e.g. `workspace:connect:*` matches `workspace:connect:webshell`).
3. Any other scope is exact — it matches only when the action string is identical.
