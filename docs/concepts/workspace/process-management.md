---
sidebar_position: 2
title: Process Management
---

# Process Management

`k8shelld` runs as PID 1 inside the main workspace container and takes on two process management responsibilities: reaping orphaned child processes and terminating background processes that were not explicitly detached.

## Process reaping

In Linux, when a process exits and its parent is no longer alive, the orphaned child is re-parented to PID 1. PID 1 is expected to call `wait()` on these children to collect their exit status and free kernel resources. If PID 1 never calls `wait()`, exited processes accumulate as zombies.

Most applications are not written to handle this. When a regular process — a shell, a language runtime, a server — runs as PID 1, zombie accumulation is common in workspaces that fork many short-lived subprocesses. `k8shelld` acts as a proper init and reaps all adopted children.

## Background process termination

When a user's shell session ends, `k8shelld` sends `SIGHUP` to background processes that were started in that session and do not have the nohup flag set. This mirrors the `huponexit` behaviour in bash: with `huponexit` enabled, bash sends `SIGHUP` to all jobs in its process group when the shell exits. `k8shelld` enforces the equivalent at the workspace daemon level, regardless of which shell the user runs.

**Why this is required:** without it, background processes started in a session would continue running after the user disconnects, consuming CPU, memory, and potentially holding open network connections or file locks. Over time this leads to resource leakage across sessions, particularly in workspaces that are long-lived or shared.

Processes that should survive session termination must be started with `nohup` (or `disown`ed before the session exits):

```bash
nohup ./my-server &
```

Apps defined in the blueprint are managed by `k8shelld`'s app manager and are not subject to this — they are supervised independently of user sessions.
