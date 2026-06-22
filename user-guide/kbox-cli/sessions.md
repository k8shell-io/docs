---
sidebar_label: Sessions
sidebar_position: 3
---

# Sessions

## kbox streams

`kbox streams` lists all active and recent streams created by incoming connections from the SSH Proxy or API Server.

```
kbox streams [--sort <fields>] [--json] [--no-ansi]
```

<StandardInlineTable data={`
columns:
  - header: Flag
    width: 120px
  - header: Default
    width: 120px
  - header: Description
rows:
  - - "\`--sort\`"
    - "\`-created\`"
    - "Comma-separated list of fields to sort by. Prefix a field name with \`-\` for descending order."
  - - "\`--json\`"
    - "\`false\`"
    - "Output as JSON instead of a table."
  - - "\`--no-ansi\`"
    - "\`false\`"
    - "Disable ANSI colour formatting."
`} />

Each row represents one stream. The `id` field is prefixed with a short type code that identifies the stream kind:

<StandardInlineTable data={`
columns:
  - header: Prefix
    width: 120px
  - header: Type
    width: 120px
  - header: Description
rows:
  - - "\`sh-\`"
    - "Shell"
    - "Interactive PTY shell session."
  - - "\`ws-\`"
    - "WebSocket"
    - "Shell terminal session over WebSocket."
  - - "\`pf-\`"
    - "Port forward"
    - "TCP port-forwarding tunnel."
  - - "\`ux-\`"
    - "Unix socket"
    - "Unix domain socket proxy."
  - - "\`ex-\`"
    - "Exec"
    - "Arbitrary command execution or SFTP session."
  - - "\`rp-\`"
    - "Reverse proxy"
    - "Reverse proxy tunnel."
`} />

The table columns are:

<StandardInlineTable data={`
columns:
  - header: Column
    width: 120px
  - header: Description
rows:
  - - "\`id\`"
    - "Stream ID including the type prefix."
  - - "\`created\`"
    - "Time the stream was opened."
  - - "\`duration\`"
    - "How long the stream has been open."
  - - "\`status\`"
    - "Current state: \`ACTIVE\` (running), \`DETACHED\` (shell kept alive after client disconnect), or \`STOPPED\` (ended). DETACHED rows are highlighted in yellow; STOPPED rows are shown in grey and are removed from the list after one minute."
  - - "\`bytes_in\`"
    - "Bytes received from the client."
  - - "\`bytes_out\`"
    - "Bytes sent to the client."
  - - "\`params\`"
    - "Stream parameters. For DETACHED shell sessions includes \`ttl=<remaining>\` showing how long the session will be kept alive."
`} />

## kbox detach

`kbox detach` detaches from the current PTY session without terminating it. The shell process continues running in the background and can be reconnected to later with `kbox attach`. The session ID is read from the `K8SHELL_SESSION_ID` environment variable, which is set automatically when a PTY session starts.

```
kbox detach [--ttl <duration>]
```

The optional `--ttl` flag overrides how long the detached session is kept alive before being garbage-collected (e.g. `30m`, `1h`, `0` for no expiry). If omitted, the server's configured default applies. The server rejects values that exceed its configured maximum.

The keyboard shortcut **Ctrl+A D** (same as GNU screen) sends the detach signal while inside an attached session without needing to run `kbox detach` directly.

## kbox attach

`kbox attach` reconnects to a detached shell session.

```
kbox attach [session-id]
```

If no session ID is given, `kbox attach` fetches the list of detached sessions and — if there is more than one — displays an interactive selection table showing the session ID, shell binary, PID, creation time, and time since detach. With a single detached session it attaches immediately without prompting.

**How the connection works**

Unlike other `kbox` commands that make a regular HTTP request and read the JSON response, `attach` uses HTTP connection hijacking. It sends a request to `POST /shells/{id}/attach` and then takes over the raw TCP connection from the HTTP client, bypassing all further HTTP framing. From that point the connection becomes a raw bidirectional byte pipe directly into the shell's PTY:

- **stdin → connection** — every keystroke is forwarded as-is to the shell.
- **connection → stdout** — all shell output is written directly to the terminal.

The terminal is put into raw mode for the duration of the session so that control characters (arrow keys, Ctrl sequences, etc.) are forwarded unmodified rather than being interpreted by the local line discipline.

Terminal resize events (`SIGWINCH`) are handled out-of-band: when the local terminal is resized, `kbox attach` sends a `POST /shells/{id}/resize` request with the new dimensions so `k8shelld` can update the PTY window size accordingly.

The detach shortcut **Ctrl+A D** is intercepted server-side. When `k8shelld` sees it in the byte stream it closes the hijacked connection cleanly, leaving the shell running. The client side detects the connection close and restores the terminal to its original state.
