---
sidebar_position: 4
title: Support
---

# Support

Reach out if you've hit a bug, have a feature idea, or need direct help as an Early Access user.

## GitHub

We use a single GitHub issue tracker for all bugs and feature requests across k8shell services. You don't need to know which service is responsible — file everything in the [k8shell issue tracker](https://github.com/k8shell-io/k8shell/issues) and the team will triage and route it internally.

All users can file bugs and feature requests — issues are community-supported and triaged on a best-effort basis. Early Access users get prioritized triage and a response commitment from the k8shell team.

If you think you've found a bug, or you have a new feature idea:

1. [Check whether it has already been reported](https://github.com/k8shell-io/k8shell/issues) — search existing issues to avoid duplicates.
2. If no duplicate exists, [open a new issue](https://github.com/k8shell-io/k8shell/issues/new/choose).

### Issue guidelines

- Use the issue template that best matches your report.
- Describe what you were doing, not which service you think is at fault — the team will identify that from the logs.
  - ❌ _"It doesn't work"_
  - ✅ _"Workspace pod never starts after provisioning — stuck in Pending"_
- One topic per issue — don't combine multiple bugs or requests.
- Use GitHub reactions (👍) rather than "+1" comments.

### Bug reports

Since k8shell is composed of multiple services, the most useful information you can provide is:

- **What you were doing** (e.g. provisioning a workspace, opening an SSH connection)
- **What failed** — the error message or unexpected behaviour you observed
- **Logs** from the k8shell services and workspaces namespaces:
  ```bash
  kubectl logs <pod-name> -n <k8shell-namespace>
  ```
  If the issue happens inside a workspace pod, you can get logs from inside the workspace:

  ```bash
  kbox logs
  ```

  or use the equivalent `kubectl` command:
  ```bash
  kubectl logs <workspace-pod> -n <workspaces-namespace>
  ```

- **k8shell Helm chart version** and any values overrides
- **Kubernetes distribution and version**

Please attach large files (drag-and-drop a `.txt` file onto the issue comment box).

The team will use the logs to identify which service is involved and route the issue accordingly.

## Early Access support

:::info
Technical support is available to [Early Access](/licensing#early-access) users.
:::

Early Access users file issues in the same [GitHub issue tracker](https://github.com/k8shell-io/k8shell/issues/new/choose) as everyone else — mention your Early Access account in the issue and the team will prioritize it accordingly.

For sensitive or confidential information (internal architecture details, security concerns, environment specifics), use email instead: [support@k8shell.io](mailto:support@k8shell.io).

Once onboarded for Early Access, you'll receive an invite to our [Discord server](https://discord.gg/k8shell) where the `#early-access` channel is the place to ask questions, share feedback, and follow the platform as it evolves.

## Community

The k8shell community is on [GitHub Discussions](https://github.com/k8shell-io/k8shell/discussions) and [Discord](https://discord.gg/k8shell) — a good place to ask how-to questions, share what you're building, and connect with other users and the k8shell team.

Follow us on [X/Twitter](https://x.com/k8shell_io) and [LinkedIn](https://www.linkedin.com/company/k8shell) for updates and announcements.
