---
sidebar_position: 5
title: Session Detach and Attach
---

# Session Detach & Attach

`k8shelld` supports session detachment and reattachment, mirroring GNU screen functionality directly in the daemon. A shell session can be detached while remaining active in the background, then reattached later from the same or a different client. This enables persistent sessions that survive connection interruptions, long-running commands that outlive the initiating terminal, and seamless web console page reloads.

## Session lifecycle

When a shell session is started, `k8shelld` tracks it in its session manager and assigns it a unique session ID. The session can be either active (with a client attached) or detached (running in the background with no client). All shell output is captured in a 256 KiB ring buffer regardless of attachment state.

For SSH clients connecting through SSH Proxy, detachment is triggered by the user running `kbox detach` or pressing Ctrl+A+D inside the shell. For web console clients connecting through API Server, detachment can be initiated explicitly via `kbox detach` or automatically when the `detach_on_close` flag is set in the gRPC `Shell` start request.

Detached sessions persist in the background until they are reattached, explicitly terminated, or expire after the configured TTL.

## Ring buffer

Each session maintains a 256 KiB ring buffer that captures all shell output. When a client reattaches to a detached session, it receives the buffered content first, then continues streaming live output. This ensures that recent output is preserved during detachment and that the user sees context when reconnecting.

If the ring buffer overflows, the oldest data is discarded. The buffer is cleared when the session is terminated.

## Detaching

A session can be detached in two ways:

**Via `kbox detach`** — the `kbox` CLI calls the `/shells/{id}/detach` REST endpoint, which marks the session as detached and closes the client connection. The shell continues running in the background. An optional TTL parameter can be specified (e.g., `kbox detach --ttl 15m`) to set the session lifetime, but it must not exceed the configured maximum of 30 minutes.

**Via Ctrl+A+D** — the standard GNU screen key sequence is intercepted by `k8shelld` when the session is running in PTY mode. Pressing Ctrl+A followed by D triggers the same detachment logic as the `kbox` command with the default TTL.

In both cases, the client connection is closed gracefully and the session transitions to the detached state. The session ID is preserved and can be used to reattach.

## Attaching

**`kbox attach`** — attaches to a detached session. If there is only one detached session, it attaches directly. If there are multiple detached sessions, it presents a list to choose from.

The command calls the internal REST API `/shells/{id}/attach` endpoint. The endpoint uses HTTP protocol switching (101 response) and HTTP hijacking to establish a PTY stream directly between the client and the shell session. Once attached, the client receives the buffered output from the ring buffer first, followed by live output from the shell. Only one client can attach to a session at a time. 

## Listing sessions

**`kbox streams`** — lists all sessions (both active and detached) with their IDs, creation times, duration, status, byte counts, and parameters. For detached sessions, the remaining TTL is displayed.

Example output:

```
kbox streams
ID                 CREATED          DURATION    STATUS    BYTES_IN  BYTES_OUT PARAMS
sh-wzpff-54-vm1    Apr 25 00:28:53  4s          ACTIVE    15B       116B      cmd=/bin/bash, pid=30977
sh-wzpff-38-7n1    Apr 25 00:28:33  24s         DETACHED  38B       2.45K     cmd=/bin/bash, pid=30831, ttl=29m53s
```

## TTL and termination

Detached sessions have a time-to-live (TTL) that can be specified during detachment with the `--ttl` flag to `kbox detach`. The TTL must not exceed the configured maximum of 30 minutes. If a session remains detached for longer than the TTL, `k8shelld` terminates the shell process, clears the ring buffer, and removes the session from the session manager. The TTL prevents abandoned sessions from consuming resources indefinitely.

The TTL countdown is reset each time a client attaches to the session. Active sessions (with a client attached) do not have a TTL — they remain alive as long as the client is connected or until explicitly terminated.
