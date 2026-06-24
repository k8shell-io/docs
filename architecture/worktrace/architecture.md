---
sidebar_position: 1
---

# Architecture

Worktrace is structured as a four-layer streaming pipeline: event ingestion, event routing, detection pipelines, and output processing. Events flow from Tetragon through the ingester to parallel detection pipelines; threats are consolidated by the output processor and delivered to the monitoring stack.

## Event ingestion

The ingestion layer connects to Tetragon via gRPC on the daemon's Unix socket and receives a stream of kernel events in real time. Each received event is wrapped in an envelope that adds:

- **Workspace context** — the event's Kubernetes pod metadata is resolved to a specific user workspace. Events from pods outside the monitored namespace are discarded.
- **Processing metadata** — timestamps and internal routing identifiers used by downstream pipelines.

An event type filter drops irrelevant event types (such as `process_exit`) before they enter the processing pipeline, reducing the event volume delivered to detection by approximately 50%.

## Event routing

The event router fans out each enriched event to all registered detection pipelines simultaneously. Routing is non-blocking: if a pipeline's input channel is full, the event is dropped with a warning log rather than applying back-pressure to the ingestion layer.

## Detection pipelines

Three pipelines operate in parallel. Each pipeline receives the full event stream and produces threat records independently.

**Direct pipeline** evaluates each event against the configured detection rules, indexed by event type at load time. When a rule matches, the pipeline emits a *suspect event* carrying the rule ID and confidence score. If the rule's `report` flag is set, an immediate threat is also emitted. All suspect events are forwarded to the correlation pipeline. See [Detection Rules](./detection-rules.md) for the rule format and pattern types.

**Correlation pipeline** consumes suspect events from the direct pipeline and assembles them into multi-step attack paths. It tracks which rules have been observed per workspace per attack path within a sliding time window, and emits a correlated threat when all required rules are satisfied. See [Attack Paths](./attack-paths.md) for the correlation model and path definition format.

**Behavioral pipeline** builds a frequency baseline from all workspace activity and flags events that deviate significantly from normal patterns. See [Behavioral Detection](./behavioral-detection.md) for the baseline model and scoring formula.

## Output processing

Threats from all three pipelines are collected by the output processor, which deduplicates records within a configurable time window and writes each unique threat as a structured JSON record to the standard error stream. The existing Kubernetes log infrastructure — Grafana Loki in the reference deployment — collects these records via standard container log aggregation, requiring no additional agents or forwarding configuration.

## Deployment

Worktrace is implemented in Go and deployed as a Kubernetes DaemonSet, running one instance per node. The Helm chart manages four resources: the DaemonSet itself, a ConfigMap for the engine configuration, a ConfigMap for detection rules, and the generated Tetragon TracingPolicy custom resource. ConfigMap checksums are included as pod annotations so that Kubernetes automatically triggers rolling restarts when configuration or rules change.

A worker pool of goroutines — defaulting to one per CPU — reads concurrently from a buffered event channel. The direct and behavioral pipelines execute in parallel for each event. Buffered channels with configurable sizes (10,000 events, 5,000 suspect events, 1,000 threats) decouple each stage from the next.
