---
sidebar_custom_props:
  earlyAccess: true
---

# Worktrace  <EarlyAccessBadge />

Worktrace is a k8shell service that uses [Tetragon](https://tetragon.io) to observe activity inside workspace pods using eBPF — capturing process executions, network connections, and file access patterns without modifying workspace images or requiring any in-workspace agent. Tetragon is built on Cilium and eBPF.

This provides a continuous audit trail of what runs inside workspaces and enables detection of anomalous behaviour: unexpected outbound connections, privilege escalation attempts, or suspicious process trees.

:::note
Worktrace is only available in clusters using [Cilium](https://cilium.io) as the CNI. Full Worktrace documentation is in progress.
:::
