---
sidebar_position: 4
---

# JWT Issuer

The Identity service issues signed JWTs that represent authenticated users. These tokens are presented to k8shell services — such as the API Server and SSH Proxy — to authorize access to resources. Tokens are short-lived by design, with a default TTL of one hour. When a token expires, callers obtain a new one via the `IssueUserToken` RPC. The tokens are not stored in the DB.

## Token contents

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

## Signing

Identity supports two signing algorithms, configured via `jwtIssuer.signingMethod`:

- **`es256`** — ECDSA with P-256. Requires a private key file (`jwtIssuer.privateKeyFile`). The corresponding public key is derived from the private key for verification.
- **`rs256`** — RSA with SHA-256. Requires a private key file for signing. Verifiers use the corresponding public key file.

The signing key never leaves the Identity process. Services that only need to verify tokens — such as the API Server and SSH Proxy — are configured with the public key only.

See [Configuration — JWT issuer](./configuration.md#jwt-issuer) for all available fields.
