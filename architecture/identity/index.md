# Identity Service

The Identity service manages k8shell user identities across the platform. It integrates with downstream identity providers such as GitHub and GitLab, onboards users via OAuth web and device flows, and stores user information. Once a user is authenticated, Identity issues JWT tokens used throughout the platform and provides backends for credential helpers inside workspaces.

The diagram below shows a high-level architecture of the Identity service and its integration points.

![Identity Architecture](svg-gen:drawings/identity-architecture.excalidraw.svg)

The following sequence outlines the high-level interaction points for the Identity service.

:::NumberedList
* **User Onboarding.** The SSH Proxy onboards users via the OAuth device flow when the configured identity provider supports it. The API Server uses the OAuth web flow for browser-based onboarding. All services can search for existing users via the Identity find API.
* **User Lookup and Refresh.** Identity resolves user requests against its internal database. When a cached user record has expired, Identity transparently refreshes the user's profile from the upstream identity provider before returning the result.
* **Authorization.** Identity enforces authorization policies for some calls it initiates such as user onboarding and SSH authentication. See [User domain](../authz/domain-user.md) policy for more details.
* **User Storage.** Identity persists user profiles and associated credentials — such as provider tokens — in its internal database, making them available to credential helpers and other platform services.
* **Token Issuance.** Identity acts as a [token issuer](./tokens.md) and mints tokens for authenticated user identities. The API Server uses these tokens to authorize API requests originating from external clients and from workspaces.
* **Identity Provider Integration.** Configured [identity providers](./providers.md) act as proxies to downstream services such as GitHub and GitLab, using their APIs to complete authentication and retrieve repository details. Retrieved credentials such as access tokens are stored by the provider for subsequent use.
* **Credential Helper Backend.** Identity provides [credential helper backends](./credential-helpers.md) for Git, Docker, and Kubernetes clients running inside workspaces. For Kubernetes, Identity requests tokens from the Kubernetes API for a specified service account and returns them to the client.
:::
