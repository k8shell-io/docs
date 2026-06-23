---
sidebar_label: Files
sidebar_position: 3
---

# Files

## SFTP

The workspace exposes the SFTP subsystem over SSH. Connect with any SFTP client:

```bash
sftp alice~pod=my-workspace@app.k8shell.io
```

The `sftp` command invokes the `subsystem sftp` request, which the SSH Proxy routes to the workspace's SFTP process. Standard SFTP operations (upload, download, rename, delete, stat) are all available.

## SCP

Copy files between your local machine and a workspace using `scp`. The `k8shell workspace scp` command wraps this for you:

```bash
# copy from workspace to local directory
k8shell workspace scp --pod my-workspace --path /home/user/data ./local-data

# print the SCP string without running it
k8shell workspace scp --pod my-workspace --print
```

Or use `scp` directly with a manually constructed connection string:

```bash
# download a file
scp "alice~pod=my-workspace@app.k8shell.io:/home/user/file.txt" ./file.txt

# upload a file
scp ./file.txt "alice~pod=my-workspace@app.k8shell.io:/home/user/file.txt"

# recursive directory copy
scp -r "alice~pod=my-workspace@app.k8shell.io:/home/user/project" ./project
```

SCP uses the SFTP subsystem under the hood when `-s` mode is used, or falls back to the legacy protocol via `exec`.
