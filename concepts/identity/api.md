---
sidebar_position: 7
title: API Reference
---

# API Reference

Identity exposes two gRPC services. `IdentityService` is the public-facing API consumed by the rest of the k8shell platform. `IdentityProviderService` is the contract that each identity provider plugin must implement; Identity calls it when it needs to delegate user lookup, onboarding, or authentication to a provider. 

## Authentication

All callers of `IdentityService` are internal k8shell services — primarily the API Server and SSH Proxy. There is no direct user-facing exposure; user requests are always routed through those services first. Service-to-service calls are authorized using Kubernetes-issued OIDC tokens presented in request metadata.

## Services

### IdentityService

The single service that covers all Identity operations.

#### User lookup

**`FindUser`** — retrieves a user record by username. Returns the full `common.v1.User` struct including UID, GID, email, roles, and organization. Used by the API Server and SSH Proxy to resolve a username to a user before issuing a token or opening a workspace session.

**`GetUsers`** — returns a paginated list of all known users. Intended for administrative tooling and the k8shell console.

#### Token issuance

**`IssueUserToken`** — issues a signed JWT for the given username and source (provider name). The token is returned as a compact JWT string and is not persisted. The caller is responsible for caching it for its TTL duration. See [JWT Issuer](./jwt-issuer.md) for the full set of claims embedded in the token.

#### Onboarding

**`GetUserOnboardCapability`** — checks whether the configured identity provider supports onboarding and returns the available flow types (device or web). Clients call this before initiating an onboarding flow to discover which options to offer the user.

**`OnboardUserDeviceFlow`** — initiates an OAuth device flow onboarding. Returns a `UserOnboardDeviceFlow` containing the verification URI and user code to display to the user. The client polls `CompleteUserDeviceFlow` until the user completes authorization on the provider side.

**`CompleteUserDeviceFlow`** — called after the user has authorized the device on the provider's side. Provisions the user record and credentials from the provider response and returns a success indicator.

**`OnboardUserWebFlow`** — initiates an OAuth web flow onboarding. Returns a redirect URI and a state token that the client embeds in the browser redirect.

**`CompleteUserWebFlow`** — called with the `state` and `code` returned by the provider callback. Completes the OAuth exchange, provisions the user record, and returns a newly issued JWT so the user can immediately proceed without a separate `IssueUserToken` call.

#### Authentication

**`AuthUserPublicKey`** — authenticates a user by SSH public key. The caller provides the public key in OpenSSH wire format; Identity evaluates it against the user's stored keys and provider-retrieved keys (in that order) and returns the authenticated user record on success. This is the primary path by which SSH Proxy authenticates inbound SSH connections. See [User Management — SSH public key authentication](./user-management.md#ssh-public-key-authentication) for evaluation order details.

#### Credential management

**`ListUserCredentials`** — returns all stored credentials for the given username. Each credential is a `common.v1.UserCredential` containing the service name, scope, username, token/password, and expiry.

**`GetUserCredential`** — retrieves a single credential identified by service name and optional scope. This is the RPC called by the workspace credential helper backend when a workspace requests a Git or Docker credential. See [Credential Helpers](./credential-helpers.md) for the full resolution flow.

**`AddUserCredential`** — stores a new credential for a user. Returns the created record including its assigned ID. Credentials added via this RPC are of the `stored` source.

**`UpdateUserCredential`** — replaces an existing credential with updated values. Returns the updated record.

**`DeleteUserCredential`** — removes a stored credential by its numeric ID.

#### Provider discovery

**`GetAvailableIdentityProviders`** — returns the list of identity providers currently registered with the Identity service, including their names, type, and supported capabilities. Used by client tooling to determine which providers are available and which flow types they expose.

#### Workspace resolution

**`GetBlueprintByUserStr`** — retrieves a custom blueprint stored in the repository referenced by the user string (see [User String](../overview/user-string.md)). The Provisioner calls this during workspace provisioning to retrieve a repo-level blueprint and compose it into the final blueprint.

### IdentityProviderService

Each identity provider — whether remote or the built-in local file provider — implements `IdentityProviderService`. Identity connects to a provider over gRPC and calls these RPCs when it needs to delegate to the provider.

**`ProviderInfo`** — returns provider metadata: name, capabilities (e.g. `device_flow`, `web_flow`, `public_key`), maximum user record age, and the provider's address. Identity queries this on startup to discover what each provider supports.

**`FindUser`** — looks up a user by username directly on the provider. Identity calls this when refreshing a stale user record or resolving a user not yet stored in the local database.

**`OnboardUserCapability`** — equivalent to `IdentityService.GetUserOnboardCapability`; returns the onboarding flow types the provider supports for a given user.

**`OnboardUserDeviceFlow`** / **`OnboardUserWebFlow`** / **`CompleteUserWebFlow`** — provider-side halves of the onboarding flows. `IdentityService` calls these after handling its own bookkeeping (state storage, user record provisioning) and forwards the result upstream to the caller.

**`AuthUserPublicKey`** — authenticates a public key against the provider's key store. Identity calls this after exhausting its own stored keys for the user.

**`GetUserGitToken`** — retrieves a live Git token for the user from the provider. Used by the credential helper resolution path when the credential source is an IdP name rather than `stored` or `kubernetes`.

**`GetBlueprintByUserStr`** — forwarded verbatim to the provider, which fetches the blueprint from the repository via its own API (e.g. GitHub API).

## Proxy model summary

The table below shows which `IdentityService` RPCs delegate to a provider via `IdentityProviderService`:

<StandardInlineTable data={`
columns:
  - header: Identity Service
    width: 220px
  - header: IdP  Service
    width: 220px
  - header: Notes
rows:
  - - "\`FindUser\`"
    - "\`FindUser\`"
    - "Called when the local record is missing or stale."
  - - "\`GetUserOnboardCapability\`"
    - "\`OnboardUserCapability\`"
    - "Proxied directly."
  - - "\`OnboardUserDeviceFlow\`"
    - "\`OnboardUserDeviceFlow\`"
    - "Identity stores state; provider initiates OAuth."
  - - "\`CompleteUserDeviceFlow\`"
    - "—"
    - "Identity handles completion using stored state."
  - - "\`OnboardUserWebFlow\`"
    - "\`OnboardUserWebFlow\`"
    - "Proxied directly."
  - - "\`CompleteUserWebFlow\`"
    - "\`CompleteUserWebFlow\`"
    - "Provider exchanges code; Identity issues JWT."
  - - "\`AuthUserPublicKey\`"
    - "\`AuthUserPublicKey\`"
    - "Fallback after local key check."
  - - "\`GetUserCredential\` (IdP source)"
    - "\`GetUserGitToken\`"
    - "When credential source is an IdP name."
  - - "\`GetBlueprintByUserStr\`"
    - "\`GetBlueprintByUserStr\`"
    - "Provider fetches blueprint from the repo."
`} />

## Transport

Both services are served over gRPC on in-cluster addresses. Communication is TLS-encrypted, with certificates issued by the cluster CA via cert-manager. Provider connections are established at startup using the address returned by `ProviderInfo`.
