---
sidebar_position: 9
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
      storageClassName: openebs-zfs
      accessModes:
        - ReadWriteMany
      resources:
        requests:
          storage: 10Gi
```

The `path` field here uses a CEL expression to compute `/home/<username>` at provisioning time. In the above example, we use `openebs-zfs` storage class that defines a node-local ZFS volume provisioner, binding each workspace PVC to a ZFS dataset on the node where the pod is scheduled.

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

:::info 
The `zfs-csi-k8shell-test` storage class uses the `zfs-csi-k8shell` driver, a CSI driver developed specifically for k8shell. It provisions NFS-backed storage from a ZFS storage server, exposing ZFS datasets over NFS and presenting them as Kubernetes PersistentVolumes. We plan to release it as open source.
:::

### Memory storage

Memory storage provides a tmpfs-backed ramdisk mounted at a specified path. Data in memory storage is stored in RAM and is lost when the pod restarts. This type of storage is ideal for high-speed temporary data, caches, or intermediate build artifacts that don't need to persist across pod lifecycles.

```yaml
storages:
  ramdisk:
    enabled: true
    type: memory
    sizeLimit: 5Gi
    path: "/opt/ramdisk"
```

The `sizeLimit` field controls the maximum size of the tmpfs filesystem. If not specified, the tmpfs will use up to 50% of the node's memory. Setting an explicit limit prevents a single workspace from consuming excessive memory.

Memory storage does not require a PVC or storage class, making it lightweight to provision. However, because it consumes node memory, it should be sized carefully relative to the node's available RAM and the workspace's memory limits.

### EmptyDir storage

EmptyDir storage provides an ephemeral volume that exists for the lifetime of the pod. Unlike memory storage which is backed by RAM, emptyDir is typically backed by the node's local disk (or can optionally be backed by tmpfs). Data is lost when the pod is deleted but persists across container restarts within the same pod.

```yaml
storages:
  scratch:
    enabled: true
    type: emptyDir
    sizeLimit: 10Gi
    path: /opt/scratch
```

The `sizeLimit` field sets a quota on the emptyDir volume. If the volume exceeds this limit, the pod may be evicted. When omitted, the volume can grow to fill the available space on the node's backing storage.

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
    - "\`local\`, \`shared\`, \`memory\`, or \`emptyDir\`. Controls whether a PVC is created per workspace, shared across workspaces, or an ephemeral volume is used."
  - - "\`id\`"
    - "Shared storage only. Identity key used to find or create the shared PVC."
  - - "\`path\`"
    - "Mount path inside the workspace container. Supports CEL expressions."
  - - "\`sizeLimit\`"
    - "Memory and emptyDir storage only. Maximum size of the ephemeral volume."
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
