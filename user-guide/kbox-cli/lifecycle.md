---
sidebar_label: Workspace Lifecycle
sidebar_position: 4
---

# Workspace Lifecycle

## kbox shutdown

`kbox shutdown` stops the workspace from inside.

```
kbox shutdown [--delete]
```

`kbox shutdown` calls the Internal API (`POST /shutdown`), which `k8shelld` handles by sending a `shutdown` command over the external gRPC `CommandService` channel to whichever service initiated the connection — either SSH Proxy or API Server. That service then calls the Provisioner to act on the workspace. This design is deliberate: the API Server is optional in some deployments, and routing the command through the initiating service ensures shutdown works regardless of whether the API Server is present.

**Standalone pod workspaces**

By default, `kbox shutdown` performs a *soft shutdown*: only the workspace pod is deleted. All other workspace resources — PVCs, ConfigMaps, NetworkPolicies — are left intact. When the workspace is started again, the Provisioner recreates only the pod, allowing persistent volumes to be reattached and their data retained.

Pass `--delete` to perform a full workspace deletion, which removes the pod and all associated resources.

**Injected workspaces**

For workspaces [injected into an existing workload](/concepts/workspace/deployment-models), soft shutdown is not available. `kbox shutdown --delete` must be used, which triggers an eject — removing the injected sidecar and all supporting resources via a rolling update on the target workload.

## kbox logs

`kbox logs` displays the `k8shelld` daemon logs from inside the workspace.

```
kbox logs
```

`k8shelld` writes its logs both to stdout (making them available via `kubectl logs` from outside the cluster) and to an in-process ring buffer. `kbox logs` reads from that ring buffer via the Internal API. This means `kbox logs` and `kubectl logs` show the same log entries, so either can be used to inspect daemon activity.

The ring buffer has a fixed line limit, so `kbox logs` only returns the most recent entries. `kubectl logs` retains a longer history depending on the cluster's logging backend and the pod's log rotation policy — use `kubectl logs` when you need to look further back in time.

## kbox validate

`kbox validate` checks a k8shell configuration file against the expected schema.

```
kbox validate <file>
```

The command posts the file contents to the Internal API (`POST /validate`), which runs the schema validator and returns any errors. Use this to catch configuration mistakes before applying them — for example, validating a blueprint or workspace config file before pushing a change.
