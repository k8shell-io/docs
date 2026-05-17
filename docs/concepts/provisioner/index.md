# Provisioner Service

The Provisioner is the platform component responsible for the full lifecycle of a workspace in Kubernetes — from assembling its configuration to creating or removing its resources.

The diagram below shows a high-level architecture with the Provisioner as the core component.

![Provisioner Architecture](svg-gen:drawings/provisioner-architecture.excalidraw.svg)

The following sequence outlines the high-level interaction points for provisioner.

:::NumberedList
* **Connectivity.** The API server and SSH Proxy interact with the Provisioner to look up workspaces, request provisioning, and trigger workspace deletion.
* **Blueprint assembly.** Before any Kubernetes resource is created, the [blueprint manager](blueprint-manager.md) resolves and assembles the [workspace blueprint](blueprint.md). Blueprints can [inherit](blueprint-manager.md#inheritance-resolution) from higher-level definitions, and the manager merges the inheritance chain into a single resolved configuration that drives all subsequent steps.
* **Resource provisioning.** The Provisioner verifies users' identity, retrieves custom blueprints and uses the Kubernetes API to create the workspace resource set. Depending on the deployment model, it either creates a [standalone pod](standalone-pod.md) or [injects the workspace](workload-injection.md) into an existing workload by patching its pod template.
* **Startup monitoring.** The Provisioner monitors the workspace startup process and publishes provisioning events to NATS. These events can be queried via the [workspace status API](provisioning-flow.md#job-tracking) and track progression until the workspace is ready or a failure is detected.
* **Deletion and eject.** When a workspace is stopped or deleted, the Provisioner removes the associated Kubernetes resources. For injected workspaces it performs an [eject](workload-injection.md#eject) — reversing the pod template patch and deleting the namespaced resources created at injection time.
:::

