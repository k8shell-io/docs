---
sidebar_label: Users and Sessions
---

# Users and Sessions

## Users

The `user` command (alias `usr`) lets you view users registered in k8shell. What you see depends on your role: regular users typically see only themselves, while admins see all users.

```bash
k8shell user list
```

```
USERNAME  FULLNAME  EMAIL                   ORG     ROLES       BLUEPRINTS  SUDO  SOURCE                 STATUS
alice               alice@example.com       github  admin,user  *           yes   idp.k8shell.io/github  active
john                john@example.com        github  user        *           no    idp.k8shell.io/github  active
peter               peter@example.com       github  user        dev         no    idp.k8shell.io/github  active
```

<StandardInlineTable data={`
columns:
  - header: Column
    width: 140px
  - header: Description
rows:
  - - "USERNAME"
    - "Login username."
  - - "FULLNAME"
    - "Display name."
  - - "EMAIL"
    - "Email address."
  - - "ORG"
    - "Organization."
  - - "ROLES"
    - "Assigned roles (comma-separated)."
  - - "BLUEPRINTS"
    - "Blueprints the user is permitted to use (comma-separated)."
  - - "SUDO"
    - "Whether the user has sudo access inside workspaces (\`yes\`/\`no\`)."
  - - "SOURCE"
    - "Identity source (e.g. \`github\`, \`google\`)."
  - - "STATUS"
    - "\`active\`, \`locked\`, or \`invalid\`."
`} />

Sort by any column using `--sort`, for example to find locked accounts:

```bash
k8shell user list --sort status
```

## Sessions

The `session` command (alias `ses`) shows SSH session history. By default it lists your own past and active sessions.

```bash
# list your sessions
k8shell session list

# list sessions for another user (admin only)
k8shell session list --user alice
```

```
SESSION_ID    USERNAME  WORKSPACE      CLIENT_IP    CHANNELS  START             END               BYTES_IN  BYTES_OUT
dfjc7-16-pj   alice     alice-aa9095a  10.42.2.127  af,pt,sh  2026-06-17 09:14  2026-06-17 09:14  9 B       781 B
ws-jegav5bt   alice     alice-99db5ed  10.42.2.127            2026-06-17 09:38  2026-06-17 09:39  0 B       0 B
ws-wpovcy7x   alice     alice-99db5ed  10.42.2.127            2026-06-17 09:39  2026-06-17 09:40  6 B       713 B
ws-6dbjwmr6   alice     alice-aa9095a  10.42.2.127  pt,sh     2026-06-17 10:01  2026-06-17 10:01  0 B       0 B
ws-y7nmppi3   alice     alice-aa9095a  10.42.2.127  pt,sh     2026-06-17 10:01  2026-06-17 10:03  9 B       1003 B
ws-6wemwi6k   alice     alice-99db5ed  10.42.2.127  pt,sh     2026-06-17 22:39  2026-06-17 22:40  19 B      3.4 KB
dfjc7-85-dv   alice     alice-aa9095a  10.42.2.127  af,pt,sh  2026-06-17 22:43  2026-06-17 22:43  0 B       0 B
dfjc7-104-cs  alice     alice-aa9095a  10.42.2.127  af,ex     2026-06-17 22:44  2026-06-17 22:44  0 B       0 B
```

<StandardInlineTable data={`
columns:
  - header: Column
    width: 140px
  - header: Description
rows:
  - - "SESSION_ID"
    - "Unique session identifier."
  - - "USERNAME"
    - "Session owner."
  - - "WORKSPACE"
    - "Workspace the session is attached to."
  - - "CLIENT_IP"
    - "IP address of the connecting client."
  - - "CHANNELS"
    - "Open SSH channels (comma-separated): \`af\` agent forwarding, \`pt\` pty, \`sh\` shell, \`ex\` exec, \`sftp\` sftp."
  - - "START"
    - "Session start time (local time)."
  - - "END"
    - "Session end time, or \`-\` if the session is still active."
  - - "BYTES_IN"
    - "Bytes received from the client."
  - - "BYTES_OUT"
    - "Bytes sent to the client."
`} />

Use `--sort` to order results, for example `--sort -start` for most recent first.

Output can be combined with `--json` and standard Unix tools for scripting:

```bash
# find active sessions (no end time)
k8shell session list --all --json | jq '.[] | select(.end == null)'
```
