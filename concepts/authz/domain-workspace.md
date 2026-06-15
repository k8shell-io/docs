---
sidebar_position: 6
title: Workspace Domain
---

# Workspace Domain

The workspace domain controls the full workspace lifecycle — who can provision, create, list, read, delete, and connect to workspaces — as well as fine-grained access to file transfer and in-workspace app operations. Each action below indicates the service that calls it.

## Contracts

All contracts include **Subject**, see [Subject claims](./policy-domains.md#subject-claims).

### `workspace:provision`

<CallerBadge services="Provisioner" />

Evaluated before a workspace is provisioned. The full blueprint is carried in context as a YAML-encoded struct. The policy may return patch obligations that the enforcer applies to the blueprint before provisioning proceeds.

**Resource**

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
    - "Username of the user provisioning the workspace. Required."
  - - "\`attributes.blueprint\`"
    - "Blueprint name. Optional."
`} />

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`blueprint\`"
    - "Full blueprint struct encoded as YAML. Required."
  - - "\`mode\`"
    - "\`standalone\` or \`inject\`. Required."
  - - "\`workload_name\`"
    - "Target workload name. Required when \`mode\` is \`inject\`."
  - - "\`workload_namespace\`"
    - "Target workload namespace. Required when \`mode\` is \`inject\`."
  - - "\`workload_kind\`"
    - "Target workload kind. Required when \`mode\` is \`inject\`."
`} />

**Obligations**

<StandardInlineTable data={`
columns:
  - header: Key
    width: 220px
  - header: Description
rows:
  - - "\`patch:<json-pointer>\`"
    - "String value to write at the given [JSON Pointer (RFC 6901)](https://www.rfc-editor.org/rfc/rfc6901) path in the blueprint. The enforcer applies all patch obligations to the blueprint before provisioning proceeds. Example: \`patch:/resources/cpu\` → \`2000m\`."
`} />

### `workspace:list`

<CallerBadge services="API Server" />

Evaluated when a user requests the list of workspaces for a given owner. There is no specific workspace yet, so `id` is empty.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Description
rows:
  - - "\`id\`"
    - "Empty — no specific workspace."
  - - "\`type\`"
    - "Resource type. The value is \`workspace\`."
  - - "\`attributes.owner\`"
    - "Owner username whose workspaces are being listed. Required."
`} />

No contract-specific context fields. **Obligations** — none; allow/deny only.

### `workspace:create`

<CallerBadge services="API Server" />

Evaluated when a user requests to create a new workspace. There is no workspace name yet, so `id` is empty.

**Resource**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Description
rows:
  - - "\`id\`"
    - "Empty — no specific workspace yet."
  - - "\`type\`"
    - "Resource type. The value is \`workspace\`."
  - - "\`attributes.owner\`"
    - "Owner username for whom the workspace is being created. Required."
`} />

No contract-specific context fields. **Obligations** — none; allow/deny only.

### `workspace:read`

<CallerBadge services="API Server" />

Evaluated when a user requests the details of a specific workspace.

**Resource**

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
`} />

No contract-specific context fields. **Obligations** — none; allow/deny only.

### `workspace:delete`

<CallerBadge services="API Server" />

Evaluated when a user requests to delete a specific workspace.

**Resource**

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
`} />

No contract-specific context fields. **Obligations** — none; allow/deny only.

### `workspace:connect`

<CallerBadge services="API Server" />

Evaluated when a user opens an interactive browser session on a workspace — web shell, file browser, or port forward.

**Resource**

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
`} />

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`type\`"
    - "\`webshell\`, \`webfiles\`, or \`portforward\`. Required."
  - - "\`port\`"
    - "Port number as a string. Required when \`type\` is \`portforward\`."
`} />

**Obligations** — none; allow/deny only.

### `workspace:files`

<CallerBadge services="API Server" />

Evaluated when a user transfers files to or from a workspace via the API server.

**Resource**

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
`} />

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`op\`"
    - "\`download\` or \`upload\`. Required."
`} />

**Obligations** — none; allow/deny only.

### `workspace:app`

<CallerBadge services="API Server" />

Evaluated when a user installs, starts, or stops an in-workspace app.

**Resource**

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
  - - "\`attributes.app\`"
    - "App name. Required."
`} />

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`op\`"
    - "\`install\`, \`start\`, or \`stop\`. Required."
`} />

**Obligations** — none; allow/deny only.

## Example policy

```rego
package workspace

import rego.v1
import data.common

default allow := false

# admins may perform any workspace action
allow if input.subject.username in common.admin_users

# users may perform any workspace action on resources they own
allow if {
    input.action in {"workspace:provision", "workspace:list", "workspace:create",
        "workspace:read", "workspace:delete", "workspace:connect",
        "workspace:files", "workspace:app"}
    input.subject.roles[_] == "user"
    input.resource.owner == input.subject.username
}

# --- workspace:provision obligations ---

# cap CPU for non-admin users
obligations["patch:/resources/cpu"] := "1000m" if {
    input.action == "workspace:provision"
    not input.subject.username in common.admin_users
}

# cap memory for non-admin users
obligations["patch:/resources/memory"] := "2Gi" if {
    input.action == "workspace:provision"
    not input.subject.username in common.admin_users
}
```

This example demonstrates the following patterns:

- **Admins** (usernames in `common.admin_users`) may perform any workspace action.
- **All user-facing actions** carry `resource.owner`, so a single allow rule on `input.resource.owner == input.subject.username` covers the full set. For `workspace:list` and `workspace:create`, `resource.id` is empty — the owner is always in `resource.owner`.
- **`workspace:provision`** is called by the Provisioner service but the subject is still the user from the JWT — so the same `resource.owner` check applies. Only the workspace owner can provision their own workspace.
- **Patch obligations** use JSON Pointer keys (e.g. `patch:/resources/cpu`) to mutate specific fields in the blueprint before provisioning proceeds. Admins are exempt and receive the blueprint unmodified.
