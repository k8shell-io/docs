---
sidebar_position: 3
title: Licensing
---

# Licensing

k8shell is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. In addition, some components are available as **Early Access** — production-ready capabilities you can start using today, before they reach general availability.

## AGPL-v3.0

The open-source release includes the following components: SSH Proxy, Identity service (with file-based identity provider), Provisioner, k8shelld, Helm charts, installation scripts, and a set of workspace base images suitable for use as a starting point for your own images or for demo purposes.

The AGPL is a copyleft license. It ensures that k8shell and any derivative works remain open: if you distribute or run a modified version of k8shell as a network service, you must make the source of your modifications available under the same license.

The full license text is available in the [k8shell repository](https://github.com/k8shell-io/k8shell/blob/main/LICENSE).

### What this means in practice

- You can use, study, modify, and distribute k8shell freely.
- If you run a modified version of k8shell as a service accessible to others (including over a network), you must publish your modifications under AGPL-3.0.
- There is no requirement to open-source your own workloads or applications that simply run *inside* k8shell workspaces.

## Early Access

import EarlyAccessBadge from '@site/src/components/EarlyAccessBadge';

Early Access <EarlyAccessBadge /> gives you access to new k8shell capabilities before they reach general availability. You get to use them in production, provide feedback that directly shapes the final design, and be first in line when they reach GA.

### What does Early Access mean?

Early access features are:

- **Production-ready** — the core behaviour works and is suitable for real workloads, but APIs, configuration, or UX may still evolve before GA.
- **Feedback-driven** — your input directly influences the final design and roadmap.
- **Priority access** — early adopters get direct engagement with the k8shell team during the pre-GA period.

### How to get Early Access

1. Join the [k8shell Slack](https://slack.k8shell.io) and head to the `#early-access` channel.
2. Express your interest and describe your use case.
3. The team will guide you through onboarding.

### Stability expectations

| Status | Meaning |
|---|---|
| **Early Access** | Production-ready; breaking changes possible before GA |
| **GA** | Stable, fully supported, and part of a versioned release |

Any feature marked with the **Early Access** badge in this documentation falls under the above terms.
