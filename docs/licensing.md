---
sidebar_position: 3
title: Licensing
---

import FeatureComparisonTable from '@site/src/components/FeatureComparisonTable';

# Licensing

k8shell core services are licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. In addition, some components are available as **Early Access** — production-ready capabilities you can start using today, before they reach general availability. 

## Early Access

import EarlyAccessBadge from '@site/src/components/EarlyAccessBadge';

Join our Early Access program and help shape what comes next. We onboard new teams gradually as our capacity allows — to register, use the [Early Access registration page](https://k8shell.io/early-access).

Early Access gives you access to the full k8shell platform — everything in the open-source release plus the production-ready components and integrations needed to run k8shell at scale, along with prioritized triage and a response commitment from the k8shell team.

Any feature marked with the badge <EarlyAccessBadge inline noLink /> in this documentation falls under the Early Access program.

## Feature comparison
 
<FeatureComparisonTable id="core" />

<FeatureComparisonTable id="ea" />

## AGPL-v3.0

The open-source release includes the following components: SSH Proxy, Identity service (with file-based identity provider), Provisioner, k8shelld, Helm charts, installation scripts, and a set of workspace base images suitable for use as a starting point for your own images or for demo purposes.

The AGPL is a copyleft license. It ensures that k8shell and any derivative works remain open: if you distribute or run a modified version of k8shell as a network service, you must make the source of your modifications available under the same license.

The full license text is available in the [k8shell repository](https://github.com/k8shell-io/k8shell/blob/main/LICENSE).

### What this means in practice

- You can use, study, modify, and distribute k8shell freely.
- If you run a modified version of k8shell as a service accessible to others (including over a network), you must publish your modifications under AGPL-3.0.
- There is no requirement to open-source your own workloads or applications that simply run *inside* k8shell workspaces.

