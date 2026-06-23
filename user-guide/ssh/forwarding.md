---
sidebar_label: Forwarding
sidebar_position: 2
---

# Forwarding

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

:::info
When forwarding to a host outside the workspace pod, connectivity is subject to the network policy configured on the blueprint. See [Blueprint — Network](/architecture/provisioner/blueprint#network) for details.
:::

## Unix socket forwarding

Forward a local Unix socket through the SSH connection to a Unix domain socket inside the workspace:

```bash
# forward a local socket to the Docker daemon socket in the workspace
ssh -L /tmp/docker.sock:/var/run/docker.sock alice~pod=my-workspace@app.k8shell.io

# forward the Podman socket
ssh -L /tmp/podman.sock:/run/user/1000/podman/podman.sock alice~pod=my-workspace@app.k8shell.io
```

This uses the `direct-streamlocal@openssh.com` channel type. It allows tools on your local machine that speak to a Unix socket (Docker CLI, Podman CLI, language server sockets, etc.) to transparently reach the corresponding service running inside the workspace.

