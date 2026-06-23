---
sidebar_label: SSH and Exec
sidebar_position: 1
---

# SSH and Exec

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

