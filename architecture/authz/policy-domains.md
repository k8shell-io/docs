---
sidebar_position: 2
title: Policy Domains
---

# Policy Domains

Policies are organized into **domains** — logical groupings of related enforcement contracts. Each domain covers a distinct area of the platform and defines the contracts that callers must satisfy when requesting an authorization decision.

<StandardInlineTable data={`
columns:
  - header: Domain
    width: 160px
  - header: Description
rows:
  - - "**User**"
    - "Controls user lifecycle events — initial onboarding (with sudo, role, and blueprint obligations), authentication method checks, read or list access to user data, and Personal Access Token lifecycle."
  - - "**SSH**"
    - "Controls each SSH channel type individually after a session has been admitted, letting policies allow or deny specific operations such as exec, file transfer, or TCP forwarding."
  - - "**Session**"
    - "Determines whether a new workspace session may be opened and which channel types (shell, exec, direct TCP/IP) must be recorded."
  - - "**Workspace**"
    - "Controls the full workspace lifecycle — who can provision, create, list, read, delete, and connect to workspaces — as well as fine-grained access to file transfer and in-workspace app operations."
`} />

## Input structure

Every authorization request is evaluated against a structured `input` document. All contracts share the same top-level shape:

**`input.resource`** — the entity being acted on. Always has a `type` field (`"user"` or `"workspace"`) plus contract-specific fields such as `id`, `owner`, and `blueprint`.

**`input.context`** — additional details about the request that are not part of the resource identity, such as the SSH channel type, authentication method, or provisioning mode. The available fields are contract-specific.

**`input.action`** — the contract name being evaluated (e.g. `user:onboard`, `ssh:exec`).

**`input.subject`** — the authenticated user making the request. Injected by the backend from the JWT issued by Identity; policies never receive unverified caller input here. Present in every contract.

**`obligations`** — a map of key-value strings the backend must act on when `allow` is true. Obligation keys and their semantics are contract-specific.

:::info
The k8shell uses the **attribute-based authorization model (ABAC)**. Policies evaluate any combination of subject, resource, and context attributes. Contracts that return obligations mandate side-effects the backend must enforce (e.g. assign roles, grant sudo, patch a blueprint, record a session). There is no implicit role-to-permission mapping; all logic lives in Rego.
:::

## Subject claims

The subject is derived from the JWT issued by the [Identity service](../identity/tokens.md) and is identical across all contracts.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Description
rows:
  - - "\`input.subject.username\`"
    - "The user's username (\`sub\` claim)."
  - - "\`input.subject.email\`"
    - "User's email address."
  - - "\`input.subject.name\`"
    - "User's full name."
  - - "\`input.subject.uid\`"
    - "User's POSIX UID."
  - - "\`input.subject.gid\`"
    - "User's primary POSIX GID."
  - - "\`input.subject.roles\`"
    - "Roles assigned to the user."
  - - "\`input.subject.organization\`"
    - "Organization the user belongs to."
  - - "\`input.subject.source\`"
    - "Identity provider that owns the user record."
`} />
