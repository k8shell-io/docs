---
sidebar_position: 3
---

# User Management

Identity manages the full lifecycle of a k8shell user — admitting new users via OAuth flows, keeping their profiles in sync with upstream identity providers, issuing JWTs for platform-wide authentication, and provisioning the credentials their workspaces need at runtime.

## Capability negotiation

Before initiating either flow, callers can query `GetUserOnboardCapability` to determine which onboarding methods are available for a given username. Identity iterates over its configured providers in deterministic order and returns the first capability result it finds. This allows the SSH Proxy and API Server to select the appropriate flow without hard-coding IDP-specific logic.

## Onboarding flows

Identity supports two OAuth 2.0-based onboarding flows. The choice of flow depends on the calling service and the capabilities of the configured IdP.

### Device flow

Device flow does not require browser redirect handling. This is used by SSH Proxy that initiates the device flow when a user connects over SSH. The flow works as follows:

:::NumberedList
* The SSH Proxy calls `OnboardUserDeviceFlow` RPC, specifying the username and the target IdP.
* Identity forwards the request to the IdP, which returns a device code and a verification URI.
* The SSH Proxy presents the verification URI and user code to the user in the terminal. The user opens the URI in a browser and authorises the request on the IDP's site.
* Once the user has authorised, the SSH Proxy calls `CompleteUserDeviceFlow`. Identity resolves the user via the IdP and, if a database is configured, provisions a dynamic [Git credential](./credential-helpers.md) for the user.
:::

### Web flow

Web flow is used by API Server that provide OAuth capability for the Console App. The API Server initiates the web flow for browser-based onboarding. The flow works as follows:

:::NumberedList
* The API Server calls `OnboardUserWebFlow`, specifying the IdP and a redirect URI. Identity forwards the request to the IdP, which returns an authorization URL.
* The API Server redirects the user's browser to the authorization URL. The user authenticates and consents on the IDP's site.
* The IdP redirects the browser back to the API Server's redirect URI with an authorization code and an opaque state token. The API Server calls `CompleteUserWebFlow`, passing the code and state. 
* Identity decodes the state to identify the IdP, calls the IdP to exchange the code for the user's profile, resolves or creates the user record in the database, issues a [JWT](./jwt-issuer.md), and provisions a dynamic [Git credential](./credential-helpers.md).
:::

## OAuth scopes

The OAuth scopes requested during onboarding are fixed and cannot be configured externally. They are determined by the capabilities k8shell requires from the provider and cannot be reduced without breaking platform functionality.

For IdP providers that integrate with a Git hosting service — such as GitHub or GitLab — the following categories of access are required:

- **User profile.** Identity needs to read the user's account information to populate the user record.
- **SSH public keys.** Identity retrieves the public keys registered on the user's account.
- **Repository access.** Workspaces need read and write access to the repositories the user has access to.

For GitHub the required scopes are:

```yaml
scopes:
  - "read:user"
  - "user:email"
  - "read:public_key"
  - "repo"
```

For GitLab the required scopes are:

```yaml
scopes:
  - "read_user"
  - "api"
  - "read_repository"
```

### IdP application registration

Each IdP provider must be registered as an OAuth application on the provider's side. The registration produces a **client ID** and **client secret** that are supplied in the IdP's configuration alongside a **callback URL** pointing back to the IdP service. These values are part of the IdP plugin configuration and are not managed by Identity directly.

## User resolution and refresh

After onboarding completes — and on every subsequent lookup — Identity first checks its database for an existing record matching the username. If the record is missing, expired, or marked invalid, Identity queries the provider that originally onboarded the user to refresh the profile. When the provider returns an updated profile, Identity upserts the record and resets the expiry window; if the provider can no longer find the user, the record is marked invalid. In either case the resolved record is returned to the caller.

This means the database acts as a short-lived cache of provider data rather than a permanent store of truth — the upstream IDP remains authoritative.

## User record

Each user is represented by a single row in the `identity.users` table. The record is created on first login and refreshed from the configured identity provider whenever the cached record expires.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Description
rows:
  - - "\`username\`"
    - "Primary key. The login name as returned by the identity provider."
  - - "\`organization\`"
    - "The organization the user belongs to. References the organizations table."
  - - "\`is_valid\`"
    - "When \`false\` the account is disabled and all logins are rejected."
  - - "\`locked\`"
    - "When \`true\` all logins are blocked regardless of other account state."
  - - "\`expires_at\`"
    - "Timestamp after which the record is considered stale and re-fetched from the provider."
  - - "\`uid\` / \`gid\`"
    - "POSIX user and primary group IDs assigned to the user inside workspace containers."
  - - "\`fullname\`"
    - "Display name. May be empty depending on what the provider returns."
  - - "\`email\`"
    - "User email address as retrieved from the provider."
  - - "\`password\`"
    - "Bcrypt-hashed password."
  - - "\`auths\`"
    - "List of permitted authentication methods for this user (e.g. \`publickey\`, \`password\`)."
  - - "\`auth_keys\`"
    - "SSH public keys that may be used to authenticate this user."
  - - "\`source\`"
    - "Name of the identity provider that owns this record. "
  - - "\`roles\`"
    - "RBAC roles of the user, used for authorization decisions across platform services."
`} />

## SSH public key authentication

Identity supports two sources of SSH public keys for a user:

- **Provider-retrieved keys.** Identity providers that expose a public key API — such as GitHub and GitLab, which publish a user's registered SSH keys. Identity retrieves these keys dynamically.
- **Internally registered keys.** Keys can also be registered directly in Identity, independent of any provider. These are stored in the same `auth_keys` field and are available for authentication.

When the SSH Proxy authenticates a connection, it calls Identity's `AuthUserPublicKey` RPC with the presented key. Identity evaluates the key first against the internally registered keys in `auth_keys`, and if no match is found, falls back to the keys retrieved from the user's provider.
