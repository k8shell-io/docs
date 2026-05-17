---
sidebar_position: 5
---

# Provisioning Flow

The Provisioner handles two request types: provisioning a workspace and deleting one. Both operations are driven by a [user string](../overview/user-string.md) that identifies the user and encodes the workspace specification.

## Provisioning Request

Provisioning begins when the SSH Proxy or API Server submits a workspace request to the Provisioner. The request is processed in the following sequence:

:::NumberedList
* **User string validation** — The user string carried in the request is parsed and validated. 
* **Identity verification** — The username extracted from the user string is resolved against the configured identity providers. The Provisioner verifies that the user exists and is authorized before proceeding.
* **Workspace lookup** — The Provisioner derives the workspace canonical ID from the user string and searches for an existing workspace with that ID. If a matching workspace is already running, provisioning returns an `ALREADY_EXISTS` error.
* **Blueprint retrieval** — If the user string encodes a repository or explicit blueprint name, the Provisioner retrieves the corresponding custom blueprint from the identity provider. This blueprint is then resolved and merged with any applicable platform blueprints via the Blueprint Manager.
* **Deployment** — If the user string specifies a workload (`workload=kind/name`), the Provisioner injects the workspace into that workload by patching the pod template. Otherwise the workspace is provisioned as a standalone pod by installing the `k8shell-workspace` Helm chart.
* **Startup monitoring** — The Provisioner subscribes to Kubernetes watch events for the pod and its resources, tracking progress through the provisioning stages described below and reporting status to the caller in real time.
:::

## Delete Request

A delete request identifies the target workspace by canonical ID and removes it based on how it was originally deployed.

- **Standalone pod** — The Provisioner runs `helm uninstall` for the workspace Helm release, which removes the pod and all associated resources (Service, Headless Service, ConfigMaps, PVCs, NetworkPolicy, Certificate).

- **Injected workspace** — The Provisioner ejects the workspace from the target workload by removing the injected containers and volumes from the pod template and deleting the associated ConfigMaps and PVCs. The workload controller rolls out clean pods.

:::note
Namespace-level resources created by the Provisioner — the image pull secret and the headless Service used for DNS allocation — are not removed on workspace deletion. They are shared across all workspaces in the namespace and must be cleaned up by a platform administrator when the namespace is decommissioned.
:::

## Job Tracking

When deployment begins (step 5 of the provisioning request), the Provisioner generates a unique **job ID** (UUID) for the operation. The job ID is:

- added as the `k8shell.io/job-id` label on the workspace pod (both standalone and injected);
- used as the key under which provisioning progress is stored in the NATS KV store.

As startup monitoring proceeds, each stage transition and Kubernetes event is written to the NATS KV store entry for the job. This allows the API Server to stream live status updates to clients and to serve historical status via the workspace status API without requiring a direct watch on the Kubernetes API.

Job data is retained for **48 hours** by default, after which it is expired from the KV store. Within that window, the full provisioning history for a workspace — including all events and stage transitions — can be inspected through the API Server workspace status API.

## Startup Monitoring

The Provisioner monitors workspace startup in real time by observing pod state and Kubernetes events via the watch API. Progress is reported as a structured status to the caller on every change.

### Stages

The Provisioner tracks the following internal lifecycle stages and maps each to a status reported to API clients.

<StandardInlineTable data={`
columns:
  - header: Stage
    width: 150px
  - header: Status
    width: 150px
  - header: Description
rows:
  - - "\`Scheduling\`"
    - "\`Provisioning\`"
    - "Pod is waiting for node assignment by the Kubernetes scheduler."
  - - "\`Pulling\`"
    - "\`Pulling\`"
    - "Container images are being downloaded. Detected from \`Pulling\` events; not reported immediately to avoid noise from cached images."
  - - "\`Initializing\`"
    - "\`Provisioning\`"
    - "Init containers are running or waiting to start. The init container injects \`k8shelld\` and \`kbox\` binaries and prepares the workspace environment."
  - - "\`Starting\`"
    - "\`Provisioning\`"
    - "Main containers are starting or waiting for readiness probes to succeed."
  - - "\`Running\`"
    - "\`Running\`"
    - "All containers are ready. The workspace is accessible and \`k8shelld\` is accepting connections."
  - - "\`Terminating\`"
    - "\`Terminating\`"
    - "Pod is being deleted. The workspace is shutting down gracefully."
  - - "\`Stopped\`"
    - "\`Stopped\`"
    - "Pod completed successfully (exit code 0). Terminal state."
  - - "\`Failed\`"
    - "\`Failing\`"
    - "Pod failed due to a critical error (image pull failure, init container failure, crash loop). Terminal state."
  - - "\`Unknown\`"
    - "\`Unknown\`"
    - "Pod state cannot be determined. Typically occurs when the pod does not exist."
`} />

The internal stages are derived from the pod phase, container statuses, and Kubernetes events.
On each pod or event update the Provisioner runs the following analysis to derive the current stage:

1. **Deletion check** — if `DeletionTimestamp` is set, stage is `Terminating`.
2. **Phase check** — if pod phase is `Succeeded` or `Failed`, stage is `Stopped` or `Failed`.
3. **Scheduling** — if `NodeName` is empty, the pod has not been scheduled yet. Stage is `Scheduling`.
4. **Image pulling** — if any `Pulling` events exist without corresponding `Pulled` events, stage is `Pulling`. Detection is delayed by 8 seconds to suppress transient events for locally cached images.
5. **Critical events** — if any critical event is detected (image pull failure, OOM kill, crash loop above threshold), stage is `Failed` immediately, before the pod phase has updated.
6. **Init containers** — if any init container is waiting, running, or has failed, stage is `Initializing`. Init container failures result in `Failed` stage.
7. **Main containers** — if any main container is waiting with a hard failure reason (image pull backoff, OOM kill, container config error), stage is `Failed`. Otherwise, if containers are not yet ready, stage is `Starting`.
8. **Running** — if all containers are ready, stage is `Running`.

### Event classification

The Provisioner classifies Kubernetes events for the pod and its PVCs by severity:

<StandardInlineTable data={`
columns:
  - header: Severity
    width: 120px
  - header: Event Reason
    width: 220px
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
    - "CSI provisioning failed transiently. The Provisioner retries automatically."
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

Critical events cause provisioning to abort and report a `Failing` status. Warning events are forwarded to the client but do not stop provisioning.

### Crash loop detection

The Provisioner tracks the restart count of each container. If any single container exceeds the crash loop threshold (default: 2 restarts), a `BackOff` event is reclassified as critical and provisioning aborts. This prevents workspaces from entering an endless crash loop when the main container or init container fails repeatedly due to misconfiguration.

### Timeout

Provisioning can be configured with a timeout (default: no timeout). If the workspace does not reach `Running` within the timeout, provisioning is aborted and an error is returned to the caller. The timeout applies to the entire provisioning process, not to individual stages.
