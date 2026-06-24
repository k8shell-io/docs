---
sidebar_custom_props:
  earlyAccess: true
---

# Worktrace <EarlyAccessBadge />

Worktrace is a real-time threat detection system that identifies malicious activity in interactive Kubernetes workspaces. It consumes eBPF-captured kernel events from [Cilium Tetragon](https://tetragon.io/) and processes them through three detection pipelines operating in parallel: **rule-based matching of known attack signatures**, **multi-step attack path correlation**, and **behavioral anomaly detection**.

Worktrace is deployed as a Kubernetes DaemonSet alongside Tetragon and integrates detection output into standard monitoring infrastructure without requiring additional agents or protocols.

![Worktrace Architecture](svg-gen:drawings/worktrace-architecture.excalidraw.svg)

:::info Why Worktrace is needed

Kubernetes is an excellent foundation for interactive workspaces — but it was designed to run predictable workloads where operators know in advance what processes, files, and network connections to expect. Standard container security tools (image scanning, behavioral baselines) depend on this predictability.

Interactive workspaces break that assumption. Users run arbitrary commands, install packages, and modify their environment on the fly. There is no golden image baseline to compare against, workloads change continuously, and operations that would be anomalous in a production pod — installing system software, running network tools — are routine developer activity.

Worktrace is built specifically for this environment, combining rule-based detection of known attack signatures with behavioral anomaly detection that adapts to the unpredictable nature of interactive sessions.

:::
