---
sidebar_label: SSH
sidebar_position: 9
---

# SSH

K8shell exposes workspaces over standard SSH-2, meaning any RFC-compliant SSH client works without additional software. This page covers the full set of SSH features available when connecting to a workspace.

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

## Interactive shell

Connecting without any command starts a PTY shell session:

```bash
ssh alice~pod=my-workspace@app.k8shell.io
```

The SSH Proxy allocates a pseudo-terminal (`pty-req`), starts the workspace default shell (`shell` request), and forwards your terminal dimensions. Resize events are propagated automatically as you resize your local terminal window.

## Remote command execution

Append a command to execute it in the workspace without opening an interactive shell. No PTY is allocated:

```bash
# run a single command and return
ssh alice~pod=my-workspace@app.k8shell.io ls -la /home/user

# pipe output back to the local machine
ssh alice~pod=my-workspace@app.k8shell.io cat /etc/os-release

# use in scripts
result=$(ssh alice~pod=my-workspace@app.k8shell.io hostname)
```

This uses the `exec` channel request. Unlike shell sessions, exec sessions do not hold a PTY, so interactive programs that require a terminal should be run through an interactive session instead.

:::note
`signal` delivery is supported for `exec` sessions (allowing SIGINT, SIGTERM, etc. to be forwarded to the running process), but signals are not forwarded for PTY shell sessions.
:::

## Environment variables

Pass environment variables into the session using `-o SendEnv` or `SetEnv`:

```bash
# send a specific local variable (the server must permit it in its configuration)
ssh -o SendEnv=MY_VAR alice~pod=my-workspace@app.k8shell.io

# set a variable inline using SetEnv (SSH-2 env request)
ssh -o SetEnv="EDITOR=vim" alice~pod=my-workspace@app.k8shell.io
```

Environment variables are delivered via the `env` channel request before the shell or command starts.

## SSH agent forwarding

Forward your local SSH agent into the workspace so that keys stored locally are available for `git` operations, nested SSH connections, and other agent-aware tools:

```bash
ssh -A alice~pod=my-workspace@app.k8shell.io
```

The `-A` flag sends an `auth-agent-req@openssh.com` channel request. Inside the workspace `SSH_AUTH_SOCK` is set to a forwarded socket bound to the agent.

To enable agent forwarding by default for a host, add it to your `~/.ssh/config`:

```
Host app.k8shell.io
    ForwardAgent yes
```

## SFTP

The workspace exposes the SFTP subsystem over SSH. Connect with any SFTP client:

```bash
sftp alice~pod=my-workspace@app.k8shell.io
```

The `sftp` command invokes the `subsystem sftp` request, which the SSH Proxy routes to the workspace's SFTP process. Standard SFTP operations (upload, download, rename, delete, stat) are all available.

## SCP

Copy files between your local machine and a workspace using `scp`. The `k8shell workspace scp` command wraps this for you:

```bash
# copy from workspace to local directory
k8shell workspace scp --pod my-workspace --path /home/user/data ./local-data

# print the SCP string without running it
k8shell workspace scp --pod my-workspace --print
```

Or use `scp` directly with a manually constructed connection string:

```bash
# download a file
scp "alice~pod=my-workspace@app.k8shell.io:/home/user/file.txt" ./file.txt

# upload a file
scp ./file.txt "alice~pod=my-workspace@app.k8shell.io:/home/user/file.txt"

# recursive directory copy
scp -r "alice~pod=my-workspace@app.k8shell.io:/home/user/project" ./project
```

SCP uses the SFTP subsystem under the hood when `-s` mode is used, or falls back to the legacy protocol via `exec`.

## Local port forwarding

Forward a port from your local machine through the SSH connection to a service inside the workspace:

```bash
# forward local port 8080 to port 8080 on the workspace's loopback
ssh -L 8080:localhost:8080 alice~pod=my-workspace@app.k8shell.io

# forward to a service on the workspace's network that is not on loopback
ssh -L 5432:internal-db:5432 alice~pod=my-workspace@app.k8shell.io

# open a port-forwarding-only session (no shell)
ssh -N -L 8080:localhost:8080 alice~pod=my-workspace@app.k8shell.io
```

You can combine port forwarding with an interactive session or a remote command by adding `-L` to any connection. Use `-N` to suppress the shell when you only need the tunnel.

Each forwarded port opens a `direct-tcpip` channel. Multiple `-L` flags can be specified in a single command to forward multiple ports simultaneously.

## Unix socket forwarding

Forward a local Unix socket through the SSH connection to a Unix domain socket inside the workspace:

```bash
# forward a local socket to the Docker daemon socket in the workspace
ssh -L /tmp/docker.sock:/var/run/docker.sock alice~pod=my-workspace@app.k8shell.io

# forward the Podman socket
ssh -L /tmp/podman.sock:/run/user/1000/podman/podman.sock alice~pod=my-workspace@app.k8shell.io
```

This uses the `direct-streamlocal@openssh.com` channel type. It allows tools on your local machine that speak to a Unix socket (Docker CLI, Podman CLI, language server sockets, etc.) to transparently reach the corresponding service running inside the workspace.

## VS Code Remote – SSH

`k8shell workspace code` launches VS Code with the Remote – SSH extension connected to a workspace:

```bash
k8shell workspace code --pod my-workspace

# open to a specific folder inside the workspace
k8shell workspace code --pod my-workspace --path /home/user/project

# print the remote URI without launching VS Code
k8shell workspace code --pod my-workspace --print
```

The VS Code remote URI always uses a base64-encoded user string because VS Code does not accept raw user strings in remote URIs.

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
