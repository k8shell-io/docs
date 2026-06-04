---
sidebar_position: 1
title: Helm Charts
---

# Helm Charts

k8shell platform is distributed via two main Helm charts.

- **k8shell Chart** is the base chart that packages all k8shell services with all configurable options. OSS services are enabled; Early Access services (frontend, API server, session recording) are present but disabled by default. See [k8shell Chart](./k8shell-chart).
- **k8shell Bundle Chart** is an umbrella chart wrapping `k8shell` plus production-ready supporting infrastructure: NATS, PostgreSQL, HashiCorp Vault integration for secrets, and a cert manager configuration for TLS certificate management. See [k8shell Bundle Chart](./k8shell-bundle-chart).

In addition, we provide a supplementary **Vault Secrets Chart** to simplify secrets definition from HashiCorp Vault. This chart is used internally by the `k8shell-bundle` chart. See [Vault Secrets Chart](./vault-secrets-chart). 
