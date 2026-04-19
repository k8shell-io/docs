---
sidebar_position: 8
title: Storage
---

# Storage

Workspace storage mounts PersistentVolumeClaims at specified paths inside the workspace container. Data written to these mounts persists independently of the pod lifecycle and does not contribute to the container's ephemeral storage consumption.

## Storage types

### Local storage

A local storage is provisioned per workspace. Each workspace gets its own PVC, created when the workspace is provisioned and bound to that workspace. When the workspace is deleted, the PVC can be retained or deleted depending on the storage class configuration.

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

A shared storage is provisioned once and reused by all workspaces that reference it. The provisioner uses the `id` field to identify the shared claim — if a PVC with that identity already exists, it is reused rather than created again. This makes shared storage suitable for team-wide datasets, or anything that should be accessible across multiple workspaces simultaneously.

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

Because the same PVC is mounted by multiple pods concurrently, the storage class must support `ReadWriteMany`. 

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
    - "\`local\` or \`shared\`. Controls whether a PVC is created per workspace or shared."
  - - "\`id\`"
    - "Shared storage only. Identity key used to find or create the shared PVC."
  - - "\`path\`"
    - "Mount path inside the workspace container. Supports CEL expressions."
  - - "\`readonly\`"
    - "Mount the volume read-only."
  - - "\`existingClaim\`"
    - "Name of an existing PVC to mount. Mutually exclusive with \`claimSpec\`."
  - - "\`claimSpec\`"
    - "Kubernetes PVC spec used to create the PVC resource."
  - - "\`claimSpecAnnotations\`"
    - "Annotations added to the PVC. Storage-class-specific."
  - - "\`fsOwnerUid\`"
    - "UID to set as the owner of the volume root during the init phase. Applied by the init container before the main container starts."
  - - "\`fsOwnerGid\`"
    - "GID to set as the owner of the volume root during the init phase."
`} />

## Node-local storage

When the storage class provisions volumes on the node where the pod is scheduled — rather than on a remote storage backend — the volume data is physically co-located with the running container. This is typically achieved with a `local` or `hostPath`-backed storage class, or a CSI driver like OpenEBS that can provision ZFS datasets on the node itself.

Node-local storage is useful for high-I/O workloads or when you need a hard cap on local data. See [Podman Sidecar — Graph storage](./podman-sidecar.md#graph-storage) for an example of backing the Podman graph root with a node-local PVC.

## Inspecting storage usage

`kbox info` prints current storage usage for the workspace, including size and used capacity for each mounted storage. This is the quickest way to check how much of an allocated storage a user has consumed.
