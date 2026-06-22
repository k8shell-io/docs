---
sidebar_position: 3
title: User Domain
---

# User Domain

The user domain covers identity lifecycle decisions — who may be admitted to the platform, how they authenticate, what user data they can read, and who may create or read Personal Access Tokens. Each action below indicates the service that calls it.

## Contracts

All contracts include **Subject**, see [Subject claims](./policy-domains.md#subject-claims).

### `user:onboard`

<CallerBadge services="Identity" />

Evaluated when a user logs in for the first time via an identity provider. The decision controls whether onboarding is permitted at all, and the obligations carry the initial account configuration the backend must apply.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Description
rows:
  - - "\`id\`"
    - "Username being onboarded. Required."
  - - "\`type\`"
    - "Resource type. The value is \`user\`."
  - - "\`attributes.idp\`"
    - "Identity provider name (e.g. \`idp.k8shell.io/github\`). Required."
  - - "\`attributes.org\`"
    - "Organization name, if the provider reports one. Optional."
`} />

**Obligations**

<StandardInlineTable data={`
columns:
  - header: Key
    width: 160px
  - header: Description
rows:
  - - "\`sudo\`"
    - "\`true\` | \`false\`. Whether the user gets sudo access inside workspaces."
  - - "\`roles\`"
    - "JSON array of role name strings. Roles to assign on the user record."
  - - "\`blueprints\`"
    - "JSON array of blueprint names or \`*\` for all. Blueprints the user is permitted to use."
`} />

### `user:auth`

<CallerBadge services="Identity" />

Evaluated on every SSH authentication attempt, before a session is opened. The decision controls whether the authentication method and key are accepted.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Description
rows:
  - - "\`id\`"
    - "Username authenticating. Required."
  - - "\`type\`"
    - "Resource type. The value is \`user\`."
  - - "\`attributes.idp\`"
    - "Identity provider the user was onboarded from. Required."
  - - "\`attributes.org\`"
    - "Organization name, if the provider reports one. Optional."
`} />

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`method\`"
    - "\`publickey\` or \`password\`. Required."
  - - "\`fingerprint\`"
    - "SHA256 fingerprint of the public key being presented. Required for \`publickey\`."
`} />

**Obligations** — none; allow/deny only.

### `user:read`

<CallerBadge services="API Server" />

Evaluated when a caller requests access to a specific category of user data. Policies can restrict which data types a user may read about themselves or others.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Description
rows:
  - - "\`id\`"
    - "Username whose data is being requested. Required."
  - - "\`type\`"
    - "Resource type. The value is \`user\`."
`} />

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`data_type\`"
    - "\`profile\`, \`credentials\`, or \`blueprints\`. Required."
`} />

**Obligations** — none; allow/deny only.

### `user:list`

<CallerBadge services="API Server" />

Evaluated when a caller requests the full list of platform users. There is no context — the decision is based solely on the subject's identity.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Description
rows:
  - - "\`id\`"
    - "Empty — no specific user."
  - - "\`type\`"
    - "Resource type. The value is \`user\`."
`} />

**Obligations** — none; allow/deny only.

### `token:create`

<CallerBadge services="Identity, API Server" />

Evaluated when a PAT is about to be issued. The decision controls whether the caller may create a token for the target user. When allowed, the obligations constrain the token's permitted scopes and lifetime.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Description
rows:
  - - "\`id\`"
    - "Username of the user who will own the new token. Required."
  - - "\`type\`"
    - "Resource type. The value is \`user\`."
`} />

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`source\`"
    - "\`web-flow\` or \`api\`. Required. \`web-flow\` — token issued at the end of an OAuth flow initiated by the CLI. \`api\` — token created via a direct API request."
`} />

**Obligations**

<StandardInlineTable data={`
columns:
  - header: Key
    width: 160px
  - header: Description
rows:
  - - "\`scopes\`"
    - "JSON array of scope strings the issued token is permitted to use."
  - - "\`expires_in\`"
    - "Go duration string for the token lifetime (e.g. \`720h\`) or \`never\` for no expiry."
`} />

### `token:read`

<CallerBadge services="API Server" />

Evaluated when a caller requests the list of PATs belonging to a specific user.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Description
rows:
  - - "\`id\`"
    - "Username whose tokens are being read. Required."
  - - "\`type\`"
    - "Resource type. The value is \`user\`."
`} />

**Obligations** — none; allow/deny only.

## Example policy

```rego
package user

import rego.v1
import data.common

default allow := false

# admins can perform any user action except those explicitly denied
admin_denied_actions := {"token:create"}

allow if {
    input.subject.username in common.admin_users
    not input.action in admin_denied_actions
}

# any authenticated user can onboard or authenticate via SSH
allow if input.action in {"user:onboard", "user:auth"}

# users can read their own data (profile, sessions, credentials, blueprints)
allow if {
    input.action == "user:read"
    input.subject.username == input.resource.id
}

# users can create tokens for themselves
allow if {
    input.action == "token:create"
    input.subject.username == input.resource.id
}

# user:list is admin-only — covered by the admin rule above

# --- token:create obligations ---

obligations["expires_in"] := "24h" if {
    input.action == "token:create"
    input.context.source == "web-flow"
}

# --- user:onboard obligations ---

roles contains "user" if {
    input.action == "user:onboard"
}

roles contains "admin" if {
    input.action == "user:onboard"
    input.subject.username in common.admin_users
}

obligations["roles"] := roles if {
    input.action == "user:onboard"
}

obligations["sudo"] := "true" if {
    input.action == "user:onboard"
    input.subject.username in common.admin_users
} else := "false" if {
    input.action == "user:onboard"
}

obligations["blueprints"] := ["*"] if {
    input.action == "user:onboard"
    input.subject.username in common.admin_users
} else := ["dev", "am2"] if {
    input.action == "user:onboard"
}
```

This example demonstrates the following patterns:

- **Any authenticated user** may onboard (`user:onboard`) and authenticate via SSH (`user:auth`).
- **Users** can read their own data (`user:read`). 
- **Users** can create tokens via web-flow. Such tokens are valid for 24h.
- **Admins** can read all users (`user:list`).
- **Admins** are granted `sudo`, the `admin` role, and access to all blueprints (`*`) on onboarding. Regular users receive the `user` role and are permitted the `dev` and `am2` blueprints.
