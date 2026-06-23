---
sidebar_label: VS Code
sidebar_position: 4
---

# VS Code Remote – SSH

`k8shell workspace code` launches VS Code with the Remote – SSH extension connected to a workspace:

```bash
k8shell workspace code --pod my-workspace

# open to a specific folder inside the workspace
k8shell workspace code --pod my-workspace --path /home/user/project

# print the remote URI without launching VS Code
k8shell workspace code --pod my-workspace --print
```

The VS Code remote URI always uses a base64-encoded user string because VS Code does not accept raw user strings in remote URIs.
