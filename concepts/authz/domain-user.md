---
sidebar_position: 3
title: User Domain
---

# User Domain

The user domain covers identity lifecycle decisions — who may be admitted to the platform, how they authenticate, and what user data they can read. The Identity service is the sole caller for contracts in this domain.

## Contracts

All contracts include **Subject**, see [Subject claims](./policy-domains.md#subject-claims).

### `user:onboard`

Evaluated when a user logs in for the first time via an identity provider. The decision controls whether onboarding is permitted at all, and the obligations carry the initial account configuration the backend must apply.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`id\`"
    - "Username being onboarded. Required."
  - - "\`idp\`"
    - "Identity provider name (e.g. \`idp.k8shell.io/github\`). Required."
  - - "\`org\`"
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
    - "Comma-separated blueprint names or \`*\` for all. Blueprints the user is permitted to use."
`} />

### `user:auth`

Evaluated on every SSH authentication attempt, before a session is opened. The decision controls whether the authentication method and key are accepted.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`id\`"
    - "Username authenticating. Required."
  - - "\`idp\`"
    - "Identity provider the user was onboarded from. Required."
  - - "\`org\`"
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

Evaluated when a caller requests access to a specific category of user data. Policies can restrict which data types a user may read about themselves or others.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`id\`"
    - "Username whose data is being requested. Required."
`} />

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`data_type\`"
    - "\`profile\`, \`sessions\`, \`credentials\`, or \`blueprints\`. Required."
`} />

**Obligations** — none; allow/deny only.

### `user:list`

Evaluated when a caller requests the full list of platform users. There is no resource id or context — the decision is based solely on the subject's identity.

**Obligations** — none; allow/deny only.

## Example policy

```rego
package user

import rego.v1
import data.common

default allow := false

# admins can perform any user action
allow if input.subject.username in common.admin_users

# any authenticated user can onboard or authenticate via SSH
allow if input.action in {"user:onboard", "user:auth"}

# users can read their own data (profile, sessions, credentials, blueprints)
allow if {
    input.action == "user:read"
    input.subject.username == input.resource.id
}

# user:list is admin-only — covered by the admin rule above

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
```

This example demonstrates the following patterns:

- **Any authenticated user** may onboard (`user:onboard`) and authenticate via SSH (`user:auth`).
- **Users** can read their own data (`user:read`) when `input.subject.username` matches the resource `id`. No user may read another user's data unless they are an admin.
- **`user:list`** is implicitly admin-only — there is no explicit allow rule for it, so only the top-level admin catch-all grants access.
- **Admins** (usernames listed in `common.admin_users`) are granted `sudo` and the `admin` role in addition to the baseline `user` role on onboarding.
