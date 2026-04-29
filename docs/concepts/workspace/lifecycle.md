---
sidebar_position: 2
title: Lifecycle
---

# Lifecycle

Workspace lifecycle is derived from the underlying pod state. The provisioner observes pod phase, container statuses, and Kubernetes events to determine the current stage and reports this as a workspace status to clients. The lifecycle progresses through a series of stages from creation to running, with terminal stages for stopped or failed workspaces.

## Stages

A workspace moves through the following stages during provisioning:

<StandardInlineTable data={`
columns:
  - header: Stage
    width: 150px
  - header: Description
rows:
  - - "\`Scheduling\`"
    - "Pod is waiting for node assignment by the Kubernetes scheduler."
  - - "\`Pulling\`"
    - "Container images are being downloaded. Detected from \`Pulling\` events; not reported immediately to avoid noise from cached images."
  - - "\`Initializing\`"
    - "Init containers are running or waiting to start. The init container injects \`k8shelld\` and \`kbox\` binaries and prepares the workspace environment."
  - - "\`Starting\`"
    - "Main containers are starting or waiting for readiness probes to succeed."
  - - "\`Running\`"
    - "All containers are ready. The workspace is accessible and \`k8shelld\` is accepting connections."
  - - "\`Terminating\`"
    - "Pod is being deleted. The workspace is shutting down gracefully."
  - - "\`Stopped\`"
    - "Pod completed successfully (exit code 0). Terminal state."
  - - "\`Failed\`"
    - "Pod failed due to a critical error (image pull failure, init container failure, crash loop). Terminal state."
  - - "\`Unknown\`"
    - "Pod state cannot be determined. Typically occurs when the pod does not exist."
`} />

## Status mapping

Stages are mapped to workspace status messages reported to API clients:

<StandardInlineTable data={`
columns:
  - header: Stage
    width: 150px
  - header: Status
    width: 150px
rows:
  - - "\`Scheduling\`"
    - "\`Provisioning\`"
  - - "\`Initializing\`"
    - "\`Provisioning\`"
  - - "\`Starting\`"
    - "\`Provisioning\`"
  - - "\`Pulling\`"
    - "\`Pulling\`"
  - - "\`Running\`"
    - "\`Running\`"
  - - "\`Terminating\`"
    - "\`Terminating\`"
  - - "\`Stopped\`"
    - "\`Stopped\`"
  - - "\`Failed\`"
    - "\`Failing\`"
  - - "\`Unknown\`"
    - "\`Unknown\`"
`} />

## Provisioning flow

The provisioner derives the current stage by analyzing the pod object and recent Kubernetes events:

1. **Deletion check** — if `DeletionTimestamp` is set, stage is `Terminating`.
2. **Phase check** — if phase is `Succeeded` or `Failed`, stage is `Stopped` or `Failed`.
3. **Scheduling** — if `NodeName` is empty, pod has not been scheduled yet. Stage is `Scheduling`.
4. **Image pulling** — if any `Pulling` events exist without corresponding `Pulled` events, stage is `Pulling`. This is event-driven and subject to an 8-second delay to suppress transient pulls for cached images.
5. **Critical events** — if any critical event is detected (image pull failure, OOM kill, crash loop above threshold), stage is `Failed` immediately, even if pod phase has not updated yet.
6. **Init containers** — if any init container is waiting, running, or has failed, stage is `Initializing`. Init container failures result in `Failed` stage.
7. **Main containers** — if any main container is waiting with a hard failure reason (image pull backoff, OOM kill, container config error), stage is `Failed`. Otherwise, if containers are not yet ready, stage is `Starting`.
8. **Running** — if all containers are ready, stage is `Running`.

This analysis runs on each pod or event update during provisioning. The provisioner uses the Kubernetes watch API to observe changes in real time.

## Event classification

Kubernetes events for the pod and its PVCs are classified by severity:

<StandardInlineTable data={`
columns:
  - header: Severity
    width: 120px
  - header: Event Reason
    width: 200px
  - header: Meaning
rows:
  - - "\`Critical\`"
    - "\`ImagePullBackOff\`"
    - "Image pull failed repeatedly. Provisioning aborts."
  - - "\`Critical\`"
    - "\`ErrImagePull\`"
    - "Image pull failed. Provisioning aborts."
  - - "\`Critical\`"
    - "\`InvalidImageName\`"
    - "Image name is malformed. Provisioning aborts."
  - - "\`Critical\`"
    - "\`OOMKilled\`"
    - "Container exceeded memory limit. Provisioning aborts."
  - - "\`Critical\`"
    - "\`BackOff\` (threshold exceeded)"
    - "Container crashed repeatedly (>2 restarts per container). Provisioning aborts."
  - - "\`Critical\`"
    - "\`FailedBinding\` (PVC)"
    - "No suitable PersistentVolume exists for the PVC. Provisioning aborts."
  - - "\`Warning\`"
    - "\`ProvisioningFailed\` (PVC)"
    - "CSI provisioning failed transiently. The provisioner retries automatically."
  - - "\`Warning\`"
    - "\`FailedScheduling\`"
    - "Scheduler cannot place the pod. Retries automatically."
  - - "\`Warning\`"
    - "\`BackOff\` (below threshold)"
    - "Container restarted but has not exceeded the crash loop threshold (2 restarts)."
  - - "\`Warning\`"
    - "\`Unhealthy\`"
    - "Readiness or liveness probe failed."
  - - "\`Info\`"
    - "All others"
    - "Informational events (e.g., \`Scheduled\`, \`Pulled\`, \`Created\`)."
`} />

Critical events cause provisioning to abort and report a `Failed` status. Warning events are reported to the client but do not stop provisioning.

## Crash loop detection

The provisioner tracks the restart count of each container. If any single container exceeds the crash loop threshold (default: 2 restarts), a `BackOff` event is classified as critical and provisioning aborts. This prevents workspaces from entering an endless crash loop when the main container or init container fails repeatedly due to misconfiguration.

## Timeout

Provisioning can be configured with a timeout (default: no timeout). If the workspace does not reach the `Running` stage within the timeout, provisioning is aborted and an error is returned. The timeout applies to the entire provisioning process, not to individual stages.

## Implementation

The provisioner uses the `PodWatcher` to observe pod lifecycle changes. The watcher creates three concurrent Kubernetes watch streams: one for the pod object, one for pod events, and one for PVC events. All updates are fed into a single channel and processed sequentially. The `AnalyzePod` function is called on each update to derive the current stage and status.

The watcher is a pure, stateless function — given a pod and a list of events, it produces a snapshot. This makes it testable and predictable. The watch loop manages the stateful tracking of events and the pod object over time.
