---
sidebar_position: 2
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Recording

The Session Service can record the content of SSH sessions to disk for audit and replay purposes. Recording is opt-in and operates independently of session metadata storage.

## Stream types and formats

Three SSH channel types can be recorded, each with a default format:

<StandardInlineTable data={`
columns:
  - header: Stream type
    width: 120px
  - header: SSH channel
    width: 180px
  - header: Default format
    width: 130px
  - header: Description
rows:
  - - "\`shell\`"
    - "PTY shell channel"
    - "asciinema"
    - "Interactive terminal sessions. Captures input/output chunks and terminal resize events."
  - - "\`exec\`"
    - "Non-PTY exec channel"
    - "asciinema"
    - "Non-interactive command execution. Captures stdout/stderr output chunks."
  - - "\`tcpip\`"
    - "direct-tcpip port forward"
    - "pcap"
    - "Port-forwarded TCP connections. Captures raw data chunks in PCAP format."
`} />

Formats can be overridden per stream type via the `recording.formats` configuration map.

## Recording protocol

Each recording is a gRPC client-streaming call initiated by the SSH Proxy. The stream opens with a **header frame** containing session metadata, followed by a sequence of **chunk frames** (and **resize frames** for shell sessions). The Session Service writes frames to disk as they arrive and closes the file when the stream ends with `EOF`.

### Header fields

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Stream types
    width: 160px
  - header: Description
rows:
  - - "\`session_id\`"
    - "all"
    - "Unique ID of the SSH session."
  - - "\`connection_id\`"
    - "all"
    - "Unique ID of the SSH connection. Used to group port-forward channels into a shared PCAP file."
  - - "\`user_token\`"
    - "all"
    - "User JWT. The username is extracted from the token claims and used as the storage path prefix."
  - - "\`started_at\`"
    - "all"
    - "Timestamp of channel open. Written into the recording file header."
  - - "\`width\` / \`height\`"
    - "shell"
    - "Initial terminal dimensions."
  - - "\`command\`"
    - "exec"
    - "The command that was executed."
  - - "\`src_host\` / \`src_port\`"
    - "tcpip"
    - "Source address of the port-forwarded connection."
  - - "\`dst_host\` / \`dst_port\`"
    - "tcpip"
    - "Destination address of the port-forwarded connection."
`} />

## File layout

Recording files are written under the configured `storagePath`, organised by username and stream type:

```
<storagePath>/
  <username>/
    shell/
      <session_id>.cast          # asciinema
    exec/
      <session_id>.cast
    tcpip/
      <connection_id>_<dst_host>_<dst_port>.pcap
```

When gzip compression is enabled, `.gz` is appended to each file extension (e.g. `.cast.gz`).

### Shared PCAP files

A single SSH connection can open multiple port-forward channels, potentially to different destinations. Each unique `(connection_id, dst_host, dst_port)` combination maps to its own PCAP file, and all channels to the same destination within one connection write into a single shared file. The file remains open until the SSH connection closes, at which point the SSH Proxy calls `EndRecordingSession` to flush and close all PCAP files associated with that connection.

## Configuration

Recording is configured under the `recording` block. See [Configuration](./configuration.md#recording) for all available fields.
