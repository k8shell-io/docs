---
sidebar_position: 5
title: Process Management
---

# Process Management

`k8shelld` runs as PID 1 inside the main workspace container and takes on two process management responsibilities: reaping zombie processes and terminating orphaned processes left behind after a session ends. Both behaviours are opt-in via the `terminateOrphans` and `reapZombies` configuration flags.

## Process reaping

`k8shelld` listens for `SIGCHLD` and calls `wait4(-1, WNOHANG)` in a loop on each signal, collecting exit statuses and freeing kernel resources for any exited children. Without this, exited processes whose parent is PID 1 accumulate as zombies — a common problem when a regular application occupies PID 1 and is not written to handle adopted children.

## Session termination and orphan cleanup

When a shell session ends, `k8shelld` sends `SIGKILL` to the shell's entire process group immediately, terminating any foreground processes still attached to it.

Background processes that had already detached from the process group are re-parented to PID 1. A periodic background scanner checks processes re-parented to PID 1. Processes started with `nohup` are left alone; all others receive `SIGHUP`. This mirrors the `huponexit` behaviour in bash — extended to all shells and enforced at the daemon level, regardless of how the session was started.

**Why this is required:** without it, background processes started in a session would continue running after the user disconnects, consuming CPU and memory and potentially holding open network connections or file locks. Over time this causes resource leakage, particularly in workspaces that are long-lived or frequently reconnected to.

Processes that should survive session termination must be started with `nohup`:

```bash
nohup ./my-server &
```

Apps defined in the blueprint are managed by `k8shelld`'s app manager and are not subject to this — they are supervised independently of user sessions.

## Session detach and attach

`k8shelld` supports session detachment and reattachment, mirroring GNU screen functionality. A shell session can be detached while remaining active in the background, then reattached later from the same or a different client.

Sessions are detached via `kbox detach` or Ctrl+A+D. The shell process continues running and all output is buffered in a 256 KiB ring buffer. Detached sessions persist until reattached, explicitly terminated, or expired after a configurable TTL (maximum 30 minutes). The TTL can be specified during detachment: `kbox detach --ttl 15m`.

Reattachment is done via `kbox attach`. The command uses HTTP protocol switching (101 response) and HTTP hijacking to establish a PTY stream to the session. The client receives buffered output first, then live output. Only one client can attach to a session at a time.

`kbox streams` lists all active and detached sessions with their status, byte counts, and remaining TTL:

```
kbox streams
ID                 CREATED          DURATION    STATUS    BYTES_IN  BYTES_OUT PARAMS
sh-wzpff-54-vm1    Apr 25 00:28:53  4s          ACTIVE    15B       116B      cmd=/bin/bash, pid=30977
sh-wzpff-38-7n1    Apr 25 00:28:33  24s         DETACHED  38B       2.45K     cmd=/bin/bash, pid=30831, ttl=29m53s
```

This enables persistent sessions that survive connection interruptions, long-running commands that outlive the initiating terminal, and seamless web console page reloads.
