---
sidebar_position: 7
title: API Reference
---

# API Reference

The Provisioner exposes a single gRPC service (`provisioner.v1.ProvisionerService`) that manages the full lifecycle of user workspaces. The API Server and SSH Proxy are the primary callers — they invoke the Provisioner to create, query, stop, and delete workspaces on behalf of users.

## Authentication

Callers present Kubernetes-issued OIDC tokens in request metadata. The Provisioner validates these tokens against the cluster's OIDC endpoint before processing any request.

## Services

### ProvisionerService

#### Workspace lookup

**`FindWorkspace`** — returns the full `WorkspaceDetails` for a single workspace by name. Used by the API Server to check workspace state before routing a connection.

**`GetWorkspaces`** — returns all workspaces matching an optional set of filter criteria: workspace name, username, organization, blueprint, and repository (name, owner, ref). All filters are optional and can be combined. Returns the full `WorkspaceDetails` for each match.

**`GetWorkspacesByUserStr`** — returns workspaces matching a [user string](../overview/user-string.md). Equivalent to `GetWorkspaces` filtered by a serialised user context string.

#### Blueprint discovery

**`GetUserBlueprints`** — returns the list of blueprints available to a given user. The API Server calls this to populate the blueprint picker in the k8shell console and CLI.

#### Workspace provisioning

**`ProvisionWorkspaceStream`** — provisions a new workspace from a user string and streams progress back to the caller as a sequence of `ProvisionWorkspaceResponse` messages. The stream begins with a `HandshakeResponse` confirming the workspace name and job ID (or an error if the request was rejected before provisioning started). Subsequent messages are `ProvisionEvent` records — each carrying a Kubernetes event type, timestamp, object name, status, and human-readable message. The request controls two optional stream modes:

- `send_progress` — include periodic percentage-complete estimates.
- `send_events` — include raw Kubernetes object events as they arrive.

The stream closes when the workspace reaches a terminal state or when `timeout` seconds elapse.

#### Workspace lifecycle

**`StopWorkspace`** — suspends a running workspace by deleting the workspace pod only without removing its persistent state (PVCs, configuration). An optional `delay_seconds` value defers the stop to allow in-flight operations to complete gracefully. This RPC is called when a user runs `shutdown` inside the workspace. 

**`DeleteWorkspace`** — removes a workspace and all its resources. It accepts an optional `delay_seconds` for a graceful deferral. This RPC is called when a user runs `shutdown --delete` inside the workspace. 

**`EjectWorkspace`** — removes a previously injected workspace from a workload (Deployment, StatefulSet, or DaemonSet) and deletes all supporting resources (ConfigMaps, PVCs, NetworkPolicies). The caller specifies the target workload by namespace, kind, and name. The Provisioner triggers a rolling update to remove the injected sidecar and waits up to `timeout_seconds` for it to settle. 

## Transport

`ProvisionerService` is served over gRPC on an in-cluster address. Communication is TLS-encrypted using certificates issued by the cluster CA via cert-manager. The listen address and TLS settings are defined in the Provisioner configuration.
