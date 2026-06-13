---
sidebar_position: 4
title: SSH Domain
---

# SSH Domain

The SSH domain controls individual SSH channel types and requests. Each contract maps to a distinct SSH operation — interactive shell, command execution, file transfer, TCP/Unix forwarding, or agent forwarding. The SSH Proxy is the caller for contracts in this domain.

All contracts share the same resource shape. Context fields differ per contract.

## Contracts

All contracts include **Subject**, see [Subject claims](./policy-domains.md#subject-claims).

**Resource** — workspace being accessed.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`id\`"
    - "Workspace name. Required."
  - - "\`type\`"
    - "Resource type. The value is \`workspace\`"
  - - "\`owner\`"
    - "Username of the workspace owner. Required."
  - - "\`blueprint\`"
    - "Blueprint the workspace was launched from. Optional."
`} />

**Obligations** — none for all contracts; allow/deny only.

### `ssh:shell`

An interactive PTY session — a session channel with a shell request. The most common SSH operation.

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`pty\`"
    - "\`true\` if a pseudo-terminal was requested. Optional."
  - - "\`as_user\`"
    - "Linux user to run as inside the workspace. Optional; defaults to the workspace user."
`} />

### `ssh:exec`

A non-interactive command execution — a session channel with an exec request. Also covers SCP transfers, which use exec internally.

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`command\`"
    - "The exact command string to execute. Required."
  - - "\`pty\`"
    - "\`true\` if a pseudo-terminal was requested. Optional."
  - - "\`as_user\`"
    - "Linux user to run as inside the workspace. Optional."
`} />

:::info
`as_user` is populated from the `user=` parameter in the SSH user string — for example `john~dev+user=root@host`. See [User String — Override container user](../overview/user-string.md#override-container-user).
:::

### `ssh:sftp`

An SFTP subsystem request on a session channel. Evaluated separately from exec so policies can allow file transfer without permitting arbitrary command execution.

No contract-specific context fields.

### `ssh:direct-tcpip`

A client-initiated TCP port forward (`direct-tcpip` channel). Allows the SSH client to tunnel TCP connections through the workspace.

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`host\`"
    - "Destination host for the forwarded connection. Required."
  - - "\`port\`"
    - "Destination port for the forwarded connection. Required."
`} />

### `ssh:direct-streamlocal`

A Unix domain socket forward (`direct-streamlocal@openssh.com` channel). Used to proxy connections to Unix sockets inside the workspace, such as Docker or container runtime sockets.

**Context**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`socket_path\`"
    - "Unix socket path inside the workspace. Required."
`} />

### `ssh:agent-forward`

SSH agent forwarding (`auth-agent-req@openssh.com` session request). Allows the SSH client's agent to be used for authentication from within the workspace.

No contract-specific context fields.

## Example policy

```rego
package ssh

import rego.v1
import data.common

default allow := false

allow if {
    input.resource.type == "workspace"
    input.subject.username in common.admin_users
}

_ssh_user_actions := {"ssh:shell", "ssh:exec", "ssh:sftp",
    "ssh:direct-tcpip", "ssh:direct-streamlocal", "session:start"}

allow if {
    input.action in _ssh_user_actions
    input.resource.type == "workspace"
    input.subject.roles[_] == "user"
}

deny if {
    input.action in {"ssh:shell", "ssh:exec"}
    input.context.as_user == "root"
    not input.subject.sudo == true
}
```

This example demonstrates the following patterns:

- **Admins** (usernames in `common.admin_users`) may perform any SSH action on any workspace.
- **Users** with the `user` role may open shells, execute commands, use SFTP, and forward TCP/Unix connections. `ssh:agent-forward` is denied.
- **Root access** via `as_user` is denied for `ssh:shell` and `ssh:exec` unless the subject has `sudo` set to `true` on their user record. The `deny` rule overrides a matching `allow`.
