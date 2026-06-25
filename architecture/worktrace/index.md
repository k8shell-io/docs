---
sidebar_custom_props:
  earlyAccess: true
---

# Worktrace <EarlyAccessBadge />

Worktrace is a real-time threat detection system that identifies malicious activity in interactive Kubernetes workspaces. It consumes eBPF-captured kernel events from [Cilium Tetragon](https://tetragon.io/) and processes them through three detection pipelines operating in parallel: **rule-based matching of known attack signatures**, **multi-step attack path correlation**, and **behavioral anomaly detection**.

Worktrace is deployed as a Kubernetes DaemonSet alongside Tetragon and integrates detection output into standard monitoring infrastructure without requiring additional agents or protocols.

![Worktrace Architecture](svg-gen:drawings/worktrace-architecture.excalidraw.svg)

The below is the flow of actions:

:::NumberedList
* **User activity.** User performs an activity in the workspace such as opening a file or running a command, both of which trigger syscall operations.
* **eBPF capture.** Tetragon loads eBPF programs into the kernel, attaching them to system call hooks (tracepoints and kprobes). When user activity triggers a hook, the eBPF program captures the event data and passes it to the Tetragon agent via a ring buffer.
* **Event generation.** Tetragon agent reads the event from the ring buffer, enriches it with process metadata (PID, binary path, arguments) and Kubernetes context (pod name, namespace, labels), and emits it as a structured JSON event over gRPC.
* **Worktrace.** Worktrace ingestion pipeline captures the event and applies rules to evaluate it and correlations with configured attack paths. As a result it generates log or alert using configured backends.  
:::

:::info Why Worktrace is needed

Kubernetes is an excellent foundation for interactive workspaces — but it was designed to run predictable workloads where operators know in advance what processes, files, and network connections to expect. Standard container security tools (image scanning, behavioral baselines) depend on this predictability.

Interactive workspaces break that assumption. Users run arbitrary commands, install packages, and modify their environment on the fly. There is no golden image baseline to compare against, workloads change continuously, and operations that would be anomalous in a production pod — installing system software, running network tools — are routine developer activity.

Worktrace is built specifically for this environment, combining rule-based detection of known attack signatures with behavioral anomaly detection that adapts to the unpredictable nature of interactive sessions.

:::

## Pipeline architecture

Worktrace processes kernel events through four layers: event ingestion, event routing, detection pipelines, and output processing.

The ingestion layer connects to Tetragon over gRPC, enriches each event with workspace context (resolving pod metadata to a specific user workspace), and fans it out to all detection pipelines simultaneously. Routing is non-blocking — if a pipeline's input channel is full, the event is dropped rather than stalling ingestion.

Three pipelines operate in parallel:

* **Direct pipeline** — matches events against [detection rules](./detection-rules.md) and emits immediate threats for high-confidence matches.
* **Correlation pipeline** — assembles suspect events into [multi-step attack paths](./attack-paths.md), emitting a threat only when the full sequence is observed within a time window.
* **Behavioral pipeline** — builds a frequency baseline across workspace activity and flags statistically rare events. See [Behavioral Detection](./behavioral-detection.md).

The output processor collects threats from all three pipelines, deduplicates within a configurable time window, and writes each unique threat as a structured JSON record. It can also publish events directly to a monitoring and alerting system for real-time notification.

