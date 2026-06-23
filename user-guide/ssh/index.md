---
sidebar_label: SSH
sidebar_position: 9
---

# SSH

K8shell exposes workspaces over standard SSH-2, meaning any RFC-compliant SSH client works without additional software.

## Connection string

Every SSH connection to a workspace is addressed using a [User String](/architecture/overview/user-string) as the SSH username:

```
ssh <userstring>@<k8shell-host>
```

The simplest way to get a ready-to-use connection string is:

```bash
# print the connection string for a workspace by name
k8shell workspace ssh --pod my-workspace --print

# print the connection string for a repo-based workspace
k8shell workspace ssh --repo my-org/my-repo --print
```

To connect immediately (without printing), omit `--print`:

```bash
k8shell workspace ssh --pod my-workspace
```

### Constructing the connection string manually

You can also build the connection string directly from the [User String grammar](/architecture/overview/user-string):

```bash
# implicit blueprint (server resolves workspace from user defaults)
ssh alice@app.k8shell.io

# explicit blueprint
ssh alice~dev@app.k8shell.io

# named workspace
ssh alice~pod=my-workspace@app.k8shell.io

# repo-based workspace
ssh alice~repo=my-org%2Fmy-repo@app.k8shell.io

# repo-based workspace on a specific branch
ssh alice~repo=my-org%2Fmy-repo+ref=main@app.k8shell.io

# workload injection (blueprint + target workload + namespace)
ssh "alice~dev+workload=Deployment%2Fidentity+ns=team-a@app.k8shell.io"
```

:::note
The `ssh` CLI generally accepts `/` in the username unencoded, but some tools (VS Code remote, `scp`) require it percent-encoded as `%2F`. Use `--b64` with `k8shell workspace ssh` to produce a base64-encoded user string that works in all clients:

```bash
k8shell workspace ssh --pod my-workspace --b64 --print
```

This produces a connection string prefixed with `b64-` or `base64-` that the SSH Proxy decodes automatically.
:::

## SSH config

You can use `~/.ssh/config` to create aliases for frequently-used workspaces:

```
Host my-workspace
    HostName app.k8shell.io
    User alice~pod=my-workspace
    ForwardAgent yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

After saving that block, connect with just:

```bash
ssh my-workspace
```

## Unsupported features

The following SSH features are not supported by the K8shell SSH Proxy:

<StandardInlineTable data={`
columns:
  - header: Feature
    width: 250px
  - header: Notes
rows:
  - - "**Remote port forwarding** (\`-R\` / \`tcpip-forward\`)"
    - "Server-initiated port forwarding is not implemented. Use local port forwarding (\`-L\`) instead."
  - - "**X11 forwarding** (\`-X\` / \`-Y\` / \`x11-req\`)"
    - "Graphical display forwarding over SSH is not supported."
`} />
