---
sidebar_label: Workspaces
---

# Workspaces

The `workspace` command (alias `ws`) lets you create, inspect, and shut down workspaces.

## Listing workspaces

```bash
# list your own workspaces
k8shell workspace list

# list all workspaces (requires admin privileges)
k8shell workspace list --all

# filter by owner
k8shell workspace list --user alice
```

<StandardInlineTable data={`
columns:
  - header: Column
    width: 140px
  - header: Description
rows:
  - - "NAME"
    - "Workspace name."
  - - "USERNAME"
    - "Owner username."
  - - "STATUS"
    - "Current pod status: \`Starting\`, \`Running\`, \`Stopped\`, etc."
  - - "ORIGIN"
    - "Source repo as \`owner/name\`, or the blueprint name when no repo is set."
  - - "CPU"
    - "CPU resource limit (e.g. \`500m\`)."
  - - "MEMORY"
    - "Memory resource limit (e.g. \`512Mi\`)."
  - - "VERSION"
    - "App version running in the workspace."
  - - "IP"
    - "Pod IP address."
  - - "CREATED"
    - "Creation timestamp (local time)."
`} />

Use `--sort` to order by any column, for example `--sort -created` for newest first.

## Creating a workspace

Workspaces are created from a **blueprint**, optionally pinned to a specific repository and ref:

```bash
# create from a blueprint
k8shell workspace create --blueprint default

# create from a repo (branch defaults to the repo's default branch)
k8shell workspace create --repo my-org/my-repo

# create on behalf of another user (admin only)
k8shell workspace create --blueprint default --username alice
```

When `--repo` is given without an owner, the owner defaults to your username. The CLI shows a progress indicator during startup; pass `--events` to stream Kubernetes events instead:

```
$ k8shell ws create --repo k8shell-io/charts --events
Creating workspace john-37abff3 (job e84cca96-4a4c-4301-b4dc-aa4f1f87c8ed)
[2026-06-22 06:15:43] [john-37abff3] Starting: Waiting for node assignment
[2026-06-22 06:15:43] [john-37abff3] Starting: Waiting for containers to start
[2026-06-22 06:15:43] [john-37abff3] Starting: init-base: PodInitializing
[2026-06-22 06:15:44] [Pod/john-37abff3] Pulled: Container image "registry.k8shell.io/k8shell-base/k8shelld:pr-64-57f3ce0" already present on machine
[2026-06-22 06:15:44] [Pod/john-37abff3] Created: Created container: init-base
[2026-06-22 06:15:44] [Pod/john-37abff3] Started: Started container init-base
[2026-06-22 06:15:45] [Pod/john-37abff3] Pulled: Container image "registry.k8shell.io/workspaces/dev:1.13" already present on machine
[2026-06-22 06:15:45] [john-37abff3] Starting: k8shell-main: PodInitializing
[2026-06-22 06:15:45] [Pod/john-37abff3] Created: Created container: k8shell-main
[2026-06-22 06:15:45] [Pod/john-37abff3] Started: Started container k8shell-main
[2026-06-22 06:15:45] [Pod/john-37abff3] Pulled: Container image "quay.io/podman/stable:v5.8.1" already present on machine
[2026-06-22 06:15:45] [Pod/john-37abff3] Created: Created container: k8shell-podman
[2026-06-22 06:15:45] [Pod/john-37abff3] Started: Started container k8shell-podman
[2026-06-22 06:15:46] [john-37abff3] Running: Workspace is ready, provisioned in 3s
```

Events are Kubernetes events emitted as workspace resources are created and containers start. The provisioner writes them to the KV store during provisioning (see [job tracking](/architecture/provisioner/provisioning-flow#job-tracking)); they can be retrieved after the fact via `workspace job-events`, subject to the KV storage retention policy.

## Shutting down a workspace

```bash
# stop a workspace (keeps workspace data)
k8shell workspace shutdown my-workspace

# permanently delete workspace data
k8shell workspace shutdown my-workspace --delete
```

## Streaming job events

During or after workspace creation, you can stream the underlying Kubernetes job events:

```bash
k8shell workspace job-events my-workspace
```

This is useful for diagnosing slow or failed workspace startups.
