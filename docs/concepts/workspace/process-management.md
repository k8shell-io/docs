---
sidebar_position: 3
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
