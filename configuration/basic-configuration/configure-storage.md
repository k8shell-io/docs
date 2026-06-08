---
sidebar_position: 5
title: Configure Storage
---

# Configure Storage

Workspace storage is backed by Kubernetes PersistentVolumeClaims. The available storage options depend entirely on the CSI drivers installed in your cluster — k8shell does not manage storage infrastructure itself, it creates PVCs using whichever storage classes are available.

## Storage types

k8shell supports four storage types in blueprints. The two persistent types are the main focus of this page:

- **Local** — a dedicated PVC provisioned per workspace, used exclusively by that workspace. Typical use: the user's home directory. The PVC is created when the workspace is provisioned and can be retained or deleted when the workspace is removed, depending on the storage class reclaim policy.

- **Shared** — a single PVC provisioned once and mounted concurrently by all workspaces that reference it (identified by the `id` field). Suitable for team-wide datasets or repository source trees that multiple workspaces need to access simultaneously. The storage class must support `ReadWriteMany`.

Two ephemeral types are also available and require no storage class:

- **Memory** — a `tmpfs`-backed ramdisk mounted at a specified path. Fast but lost on pod restart. Useful for caches or intermediate build artifacts.

- **EmptyDir** — an ephemeral volume backed by node disk, persisting across container restarts within the same pod but lost when the pod is deleted.

See [Storage](/concepts/workspace/storage) for the full field reference and examples for all four types.

## Storage class examples

### OpenEBS / ZFS on local node

[OpenEBS](https://openebs.io) with the ZFS CSI driver is a good fit for on-premises clusters where each node has local NVMe or SSD storage. ZFS provides snapshots, compression, and efficient cloning — useful for workspace home directories.

Install the OpenEBS ZFS CSI driver and create a `StorageClass`:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: openebs-zfs
provisioner: zfs.csi.openebs.io
parameters:
  poolname: "zfs-pool"
  fstype: "zfs"
  compression: "on"
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
```

Reference the storage class in a blueprint storage entry:

```yaml
storages:
  home:
    enabled: true
    type: local
    path: !cel "'/home/' + user.username"
    claimSpec:
      storageClassName: openebs-zfs
      accessModes:
        - ReadWriteOnce
      resources:
        requests:
          storage: 20Gi
```

`ReadWriteOnce` is sufficient for local storage since each PVC is used by a single workspace pod at a time. `volumeBindingMode: WaitForFirstConsumer` ensures the PVC is provisioned on the same node as the workspace pod.

### NFS storage

NFS is the typical choice when workspaces need shared storage (`ReadWriteMany`) or when storage should be accessible from any node in the cluster. A Kubernetes NFS CSI driver (e.g. [nfs-subdir-external-provisioner](https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner) or the [NFS CSI driver](https://github.com/kubernetes-csi/csi-driver-nfs)) creates a `StorageClass` backed by an NFS server:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-workspaces
provisioner: nfs.csi.k8s.io
parameters:
  server: nfs.example.com
  share: /exports/workspaces
reclaimPolicy: Retain
volumeBindingMode: Immediate
mountOptions:
  - nfsvers=4.1
```

NFS storage works for both local and shared workspace storage. For shared storage, ensure the storage class allows `ReadWriteMany`:

```yaml
storages:
  shared-repo:
    enabled: true
    id: !cel "metadata.repoOwner"
    type: shared
    path: /opt/shared
    claimSpec:
      storageClassName: nfs-workspaces
      accessModes:
        - ReadWriteMany
      resources:
        requests:
          storage: 50Gi
```

:::warning UID/GID mapping on NFS
When workspace users have specific UIDs/GIDs, configure NFS uid/gid squashing on the server or use storage class annotations if your CSI driver supports them (e.g. `claimSpecAnnotations` in the blueprint storage entry) to ensure files are owned correctly inside the workspace.
:::

### Provisioned PVCs

With the two blueprint storage entries above — `home` using `openebs-zfs` and `shared-repo` using `nfs-workspaces` — the Provisioner creates the following PVCs in the workspace namespace when user `john` provisions workspace `john-3qqewe`:

```
NAME                      STATUS   VOLUME       CAPACITY   ACCESS MODES   STORAGECLASS     AGE
pvc-john-3qqewe-home      Bound    pvc-c96...   10Gi       RWO            openebs-zfs      18d
pvc-shared-acme           Bound    pvc-b94...   50Gi       RWX            nfs-workspaces   9d
```

- `john-3qqewe` is the workspace canonical ID (username + unique workspace identifier).
- `pvc-john-3qqewe-home` is the local PVC — `RWO`, bound exclusively to this workspace.
- `pvc-shared-acme` is the shared PVC — `RWX`, reused by any workspace whose blueprint resolves the same `id` (here `metadata.repoOwner`). If a second workspace for the same user is provisioned, the Provisioner finds the existing `pvc-shared-acme` and mounts it rather than creating a new one.
