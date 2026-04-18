---
sidebar_position: 5
title: Storage
---

# Storage

Workspace storage connects external Kubernetes volumes to paths inside the workspace container. Unlike the container's ephemeral filesystem, data on a storage volume lives outside the container and survives pod restarts. The storage size you configure controls how much data the user can write — not the container image size.

## How it works

Each storage entry in the blueprint causes the provisioner to create (or reuse) a PersistentVolumeClaim and mount the resulting volume at a specified path inside the main container. From the workspace's perspective, the path looks like any other directory. From Kubernetes' perspective, it is a PVC-backed volume mount in the pod spec.

Multiple storage entries can be defined in a single blueprint. Each maps independently to its own PVC and its own mount path.

## Storage types

### Local storage

A local storage is provisioned per workspace. Each workspace gets its own PVC, created when the workspace is provisioned and bound to that workspace. When the workspace is deleted, the PVC can be retained or deleted depending on the `zfs-csi.k8shell.io/retain-on-delete` annotation — or the equivalent field for the storage class in use.

A typical use is the user's home directory:

```yaml
storages:
  home:
    enabled: true
    type: local
    path: !cel "'/home/' + user.username"
    readonly: false
    claimSpec:
      storageClassName: zfs-csi-k8shell-test
      accessModes:
        - ReadWriteMany
      resources:
        requests:
          storage: 10Gi
    claimSpecAnnotations:
      zfs-csi.k8shell.io/squash: "all_squash"
      zfs-csi.k8shell.io/squash-uid: !cel "user.uid"
      zfs-csi.k8shell.io/squash-gid: !cel "user.gid"
```

The `path` field here uses a CEL expression to compute `/home/<username>` at provisioning time. `claimSpecAnnotations` are passed directly to the PVC and are storage-class-specific — in this example they configure uid/gid squashing for an NFS-backed ZFS CSI driver.

### Shared storage

A shared storage is provisioned once and reused by all workspaces that reference it. The provisioner uses the `id` field to identify the shared claim — if a PVC with that identity already exists, it is reused rather than created again. This makes shared storage suitable for team-wide datasets, shared package caches, or anything that should be accessible across multiple workspaces simultaneously.

```yaml
storages:
  shared:
    enabled: true
    id: !cel "metadata.repoOwner"
    type: shared
    path: /opt/shared
    readonly: false
    claimSpec:
      storageClassName: zfs-csi-k8shell-test
      accessModes:
        - ReadWriteMany
      resources:
        requests:
          storage: 50Gi
    claimSpecAnnotations:
      zfs-csi.k8shell.io/volume-name: !cel "metadata.repoOwner + '/shared'"
      zfs-csi.k8shell.io/squash: "all_squash"
      zfs-csi.k8shell.io/squash-uid: !cel "user.uid"
      zfs-csi.k8shell.io/squash-gid: !cel "user.gid"
```

Because the same PVC is mounted by multiple pods concurrently, the storage class must support `ReadWriteMany`. `retain-on-delete: "true"` ensures the data persists when individual workspaces are removed.

### Fields

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Whether this storage is active in this blueprint."
  - - "\`type\`"
    - "\`local\` or \`shared\`. Controls whether a PVC is created per workspace or shared across workspaces."
  - - "\`id\`"
    - "Shared storage only. Identity key used to find or create the shared PVC. Supports CEL expressions."
  - - "\`path\`"
    - "Mount path inside the workspace container. Supports CEL expressions."
  - - "\`readonly\`"
    - "Mount the volume read-only."
  - - "\`claimSpec\`"
    - "Kubernetes PVC spec — storage class, access modes, and size. Passed directly to the PVC."
  - - "\`claimSpecAnnotations\`"
    - "Annotations added to the PVC. Storage-class-specific. Supports CEL expressions in values."
  - - "\`fsOwnerUid\`"
    - "UID to set as the owner of the volume root during the init phase. Applied by the init container before the main container starts."
  - - "\`fsOwnerGid\`"
    - "GID to set as the owner of the volume root during the init phase."
`} />

## Node-local storage

When the storage class provisions volumes on the node where the pod is scheduled — rather than on a remote storage backend — the volume data is physically co-located with the running container. This is typically achieved with a `local` or `hostPath`-backed storage class, or a CSI driver like `zfs-localpv` that provisions ZFS datasets on the node itself.

Node-local storage is particularly useful for workloads with high I/O or where you want a hard cap on local data. A concrete example is backing the Podman sidecar's graph root with a node-local PVC to limit how much image and container data Podman can accumulate. See [Podman Sidecar — Graph storage](./podman-sidecar.md#graph-storage) for a full example.

## Inspecting storage usage

`kbox info` prints current storage usage for the workspace, including size and used capacity for each mounted storage. This is the quickest way to check how much of an allocated storage a user has consumed.
