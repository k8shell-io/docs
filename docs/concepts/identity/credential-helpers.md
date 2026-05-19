---
sidebar_position: 5
---

# Credential Helpers

Identity acts as the credential helper backend for workspaces. When a tool running inside a workspace needs to authenticate against an external service — a Git host, a container registry, or the Kubernetes API — it calls the credential helper endpoint inside the workspace, which in turn calls Identity to resolve the credential. This keeps secrets off the workspace filesystem and out of environment variables.

Identity supports three categories of credential helper:

- **Git** — OAuth tokens for Git hosts such as GitHub or GitLab. Provisioned automatically after onboarding.
- **Docker / registry** — static credentials for container registries. Configured manually via the Identity API.
- **Kubernetes** — short-lived bound service account tokens. Always resolved dynamically via the Kubernetes TokenRequest API. Configured manually via the Identity API.

## Credential record

Each credential is stored as a row in the `identity.user_credentials` table.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Description
rows:
  - - "\`username\`"
    - "The user this credential belongs to."
  - - "\`service_name\`"
    - "The type of service: \`git\`, \`registry\`, or \`kubernetes\`."
  - - "\`service_scope\`"
    - "Scopes the credential to a specific target: a Git or registry URL for \`git\`/\`registry\`; a Kubernetes namespace for \`kubernetes\`."
  - - "\`subject\`"
    - "The principal the credential is valid for — a login name for Git and registry credentials, or a Kubernetes service account name."
  - - "\`credential_source\`"
    - "Controls how the secret is resolved at request time. One of \`stored\`, \`kubernetes\`, or a named IdP (e.g. \`github\`) for dynamic Git credentials."
  - - "\`secret\`"
    - "The stored secret (OAuth token, API key, password). \`NULL\` for dynamic credentials whose secret is resolved at runtime."
  - - "\`is_active\`"
    - "When \`false\` the credential is ignored during resolution."
`} />

### Credential sources

The `credential_source` field controls how Identity resolves the secret when the credential helper is called:

- **`stored`** — the secret is read directly from the database. Used for registry credentials and statically configured Git tokens. Both registry and stored credentials must have a non-null `secret`.
- **`kubernetes`** — no secret is stored. At request time Identity calls the Kubernetes TokenRequest API to issue a fresh bound service account token for the namespace and service account named in `service_scope` and `subject`. Registry credentials cannot use this source.
- **IdP name (e.g. `github`, `gitlab`)** — no secret is stored. At request time Identity fetches a live OAuth token from the named identity provider. Used for Git credentials provisioned during onboarding. Only `git` credentials may use an IdP name as the source.

## Credential resolution

The credential helper backend is surfaced to workspaces via the API Server. When a Git, Docker, or Kubernetes client inside a workspace needs credentials, it calls the workspace credential helper, which calls the API Server's credential proxy endpoint. The API Server in turn calls Identity's `GetUserCredential` RPC, passing the username, service name, and service scope. Identity resolves the credential according to the `credential_source` of the matching row and returns the secret to the caller.

## Kubernetes credentials

Kubernetes credentials are always dynamic. A credential row is created manually via the Identity API with `service_name = 'kubernetes'`, `credential_source = 'kubernetes'`, `service_scope` set to the target namespace, and `subject` set to the service account name. No secret is stored.

At request time Identity calls the Kubernetes TokenRequest API:

* Identity calls `ServiceAccounts.CreateToken` for the specified namespace and service account.
* Kubernetes returns a short-lived bound token with the configured audience (`https://kubernetes.default.svc.cluster.local`) and TTL (default one hour).
* The token and its expiry timestamp are returned to the workspace credential helper. The token is not stored in the database.

## RBAC

To issue service account tokens via the TokenRequest API, Identity requires a `Role` and `RoleBinding` in each namespace where Kubernetes credentials may be requested. This is currently supported for [standalone Pod workspaces](/concepts/workspace/deployment-models). 

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
