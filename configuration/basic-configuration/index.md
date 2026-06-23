---
sidebar_position: 1
title: Basic Configuration
---

# Basic Configuration

This section covers the essential configuration steps after a k8shell installation. They apply to both k8shell OSS and full k8shell Platform deployments.

- **[Exposing SSH Proxy](./exposing-ssh-proxy)** — configure how the SSH Proxy is exposed outside the cluster. This is the sole external entry point for all user connections and the most infrastructure-specific part of any deployment.
- **[Adding Users](./adding-users)** — provision users directly via the chart's `values.yaml`. Intended for initial setup; use an identity provider in production.
- **[Adding Blueprints](./adding-blueprints)** — define workspace templates: which container image to use, resource allocations, and init scripts. Managed via Kubernetes ConfigMaps.
- **[Container Images](./container-images)** — configure the OCI images used by blueprints. The workspace environment is entirely determined by what is installed in the image.
- **[Configuring Storage](./configuring-storage)** — set up workspace persistent storage backed by Kubernetes PersistentVolumeClaims using the CSI drivers available in your cluster.
- **[Configuring Podman](./configuring-podman)** — enable an optional Podman sidecar that gives users the ability to build and run containers from within a workspace.
