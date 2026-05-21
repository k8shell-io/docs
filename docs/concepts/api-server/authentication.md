---
sidebar_position: 1
---

# Authentication

The API Server authenticates every inbound HTTP request before routing it to a backend service. Two credential types are accepted: a **session cookie** issued to web clients, and a **bearer token** supplied by CLI or API clients. The mechanism is the same in both cases — the API Server resolves the credential to a known user identity held in memory.

## Request authentication

On each request the API Server inspects the `Authorization` header for a bearer token, or a session cookie set on a previous login. If neither is present, or if the token or cookie cannot be resolved to a known identity, the request is rejected and the client is redirected to the login page.

:::NumberedList
* **Credential check.** The API Server checks whether the bearer token or session cookie maps to a user identity it already holds in memory. If it does, the request proceeds with that identity attached.
* **Login redirect.** When no valid credential is found, the API Server redirects the client to the login page, where the user selects an identity provider (e.g. GitHub, GitLab).
* **OAuth web flow.** The API Server forwards the authentication request to the [Identity service](/concepts/identity), which performs the OAuth web flow with the chosen provider. Identity handles the provider redirect, token exchange, and user profile retrieval.
* **Token storage.** On successful authentication, the API Server retrieves the user's JWT from Identity and stores it in memory, keyed by the token value. All subsequent requests that present this token are resolved to the same identity without a round-trip to Identity.
* **Cookie issuance (web clients).** For browser-based clients, the API Server issues a session cookie, sets it on the response, and stores the mapping between cookie and user identity in the NATS KV store so it survives API Server restarts and is available across replicas.
* **Token refresh.** When a stored JWT approaches expiry, the API Server automatically requests a refreshed token from Identity. The in-memory and NATS KV entries are updated transparently — the client session continues without interruption.
:::

## Token lifetime and expiry

JWTs issued by Identity carry a finite lifetime. The API Server tracks expiry for every stored token and initiates a refresh with Identity before the token expires. If a refresh fails — for example because the user's session with the upstream provider has been revoked — the stored credential is invalidated and the user is redirected to log in again.

For web clients, the session cookie lifetime is independent of the JWT lifetime. The cookie remains valid as long as the underlying JWT can be successfully refreshed.
