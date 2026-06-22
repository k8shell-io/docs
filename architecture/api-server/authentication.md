---
sidebar_position: 1
---

# Authentication

The API Server authenticates every inbound HTTP request before routing it to a backend service. Requests follow one of two paths depending on the client type.

## Web path

Browser clients authenticate through an OAuth web flow and then present a session cookie on every subsequent request.

:::NumberedList
* **Login redirect.** When no valid session cookie is present, the API Server redirects the client to the login page, where the user selects an identity provider (e.g. GitHub, GitLab).
* **OAuth web flow.** The API Server forwards the authentication request to the [Identity service](/architecture/identity), which performs the OAuth web flow with the chosen provider — handling the provider redirect, token exchange, and user profile retrieval.
* **Session creation.** On successful login, the JWT received from Identity is stored in the NATS JetStream KV store as a session blob keyed by a randomly generated session ID. The session ID is issued to the browser as an HTTP cookie.
* **Session cookie.** On each subsequent request, the session ID is read from the cookie, the blob is loaded from NATS KV, and the JWT is extracted. Because sessions live in NATS, they survive API Server restarts and are shared across replicas.
* **Token refresh.** When the JWT in the session blob is expired, the API Server calls `IssueUserToken` on Identity to obtain a fresh JWT, updates the blob in NATS KV, and continues the request transparently. Refresh is reactive — triggered after expiry, not before.
:::

## API path

API clients supply a bearer token in the `Authorization: Bearer` header. Two token types are accepted — exactly one must be present.

:::NumberedList
* **Bearer JWT** (workspace and internal clients). The JWT is verified locally using the configured public key. No call is made to the Identity service. The verified claims are stored in the request context for the duration of the request.
* **Bearer PAT** (external clients). A `k8sh_`-prefixed token is forwarded to the Identity service via `ResolveAccessToken` on every request. Identity returns a short-lived JWT and the token's scope list, both stored in the request context. The scope list restricts what the request may do on top of the user's policy — see [Tokens](/architecture/identity/tokens#personal-access-token-pat) for the scope reference.
:::

## Token lifetime and expiry

JWTs issued by Identity carry a finite lifetime. On the session path, the API Server detects expiry reactively — when a request arrives with an expired JWT in the session blob, it calls `IssueUserToken` on Identity to obtain a fresh one and writes it back to NATS KV before continuing. Bearer JWTs are not refreshed; callers are responsible for obtaining a new token before the current one expires.

The session cookie lifetime is independent of the JWT lifetime. The cookie remains valid as long as the session blob exists in NATS KV.
