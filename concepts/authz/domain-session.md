---
sidebar_position: 5
title: Session Domain
---

# Session Domain

The session domain controls whether a session may be established and, if so, what recording obligations apply to it. It is evaluated before a shell, exec, direct-tcpip, or sftp subsystem is started. The obligation returned by the policy instructs the enforcer which recording backends to activate for that session. Each action below indicates the service that calls it.

## Contracts

All contracts include **Subject**, see [Subject claims](./policy-domains.md#subject-claims).

### `session:start`

<CallerBadge services="SSH Proxy, API Server" />

Evaluated when a new session is being established, before any channel is opened. The decision controls whether the session is permitted at all.

**Resource** — workspace being accessed.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Description
rows:
  - - "\`id\`"
    - "Workspace name. Required."
  - - "\`type\`"
    - "Resource type. The value is \`workspace\`."
  - - "\`attributes.owner\`"
    - "Username of the workspace owner. Required."
  - - "\`attributes.blueprint\`"
    - "Blueprint the workspace was launched from. Optional."
`} />

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`session_type\`"
    - "\`shell\`, \`tcpip\`, \`exec\`, or \`sftp\`. Required."
  - - "\`session_source\`"
    - "\`ssh-proxy\` or \`api-server\`. Required."
`} />

**Obligations**

<StandardInlineTable data={`
columns:
  - header: Key
    width: 160px
  - header: Description
rows:
  - - "\`record\`"
    - "Name of the session to record: \`shell\`, \`exec\`, \`direct-tcpip\`, or \`sftp\`. Use \`none\` to disable recording."
`} />

## Example policy

```rego
package session

import rego.v1
import data.common

default allow := false

# admins may start any session
allow if input.subject.username in common.admin_users

# users may start sessions on workspaces they own or are permitted to access
allow if {
    input.action == "session:start"
    input.subject.roles[_] == "user"
}

# --- session:start obligations ---

# record the session for non-admin users; the obligation value names the session type
obligations["record"] := input.context.session_type if {
    input.action == "session:start"
    not input.subject.username in common.admin_users
}

# explicitly disable recording for admin sessions
obligations["record"] := "none" if {
    input.action == "session:start"
    input.subject.username in common.admin_users
}
```

This example demonstrates the following patterns:

- **Admins** (usernames in `common.admin_users`) may start any session and are explicitly exempted from recording via `record: none`.
- **Users** with the `user` role may start sessions on any workspace. The `record` obligation is set to the `session_type` value, naming the session to be recorded.
- **Recording obligations** name the session to record (`shell`, `exec`, `direct-tcpip`, `sftp`) or use `"none"` to disable recording entirely. When the `record` key is absent from the result the session is not recored.
- **`session_source`** is available in context and can be used to apply stricter rules to API-server-initiated sessions versus SSH-proxy-initiated ones.
