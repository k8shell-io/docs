---
sidebar_label: Overview
sidebar_position: 1
---

# User Guide

k8shell can be accessed through several user-facing tools, each suited to a different workflow.

- **[Console](./console/)** <EarlyAccessBadge inline /> — browser-based interface for launching workspaces, opening terminal sessions, and accessing workspace applications. No local tooling required.
- **[k8shell CLI](./k8shell-cli/)** — command-line tool for managing the platform from your local machine. Covers the full lifecycle of workspaces, users, sessions, and contexts against the [API Server](/architecture/api-server/).

k8shell also provides an in-workspace CLI for accessing platform services from within a workspace session:

- **[kbox CLI](./kbox-cli/)** — runs inside the workspace container and does not require authentication tokens.
