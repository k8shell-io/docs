---
sidebar_position: 1
title: Helm Charts
---

# Helm Charts

k8shell platform is distributed via two main Helm charts.

- **[k8shell Chart](./k8shell-chart)** is the base chart that packages all k8shell services with all configurable options. OSS services are enabled; Early Access services (frontend, API server, session recording) are present but disabled by default.
- **[k8shell Bundle Chart](./k8shell-bundle-chart)** is an umbrella chart wrapping `k8shell` plus production-ready supporting infrastructure: NATS, PostgreSQL, HashiCorp Vault integration for secrets, and a cert manager configuration for TLS certificate management.

The following supplementary charts are optional and can be used with the k8shell Bundle Chart:

- **[GitHub IdP Chart](./idp-github-chart)** deploys the GitHub identity provider.
- **[GitLab IdP Chart](./idp-gitlab-chart)** deploys the GitLab identity provider.
- **[SSH Shield Chart](./ssh-shield-chart)** deploys the SSH Shield service.
- **[Vault Secrets Chart](./vault-secrets-chart)** simplifies secrets definition from HashiCorp Vault.

Parameters shared across multiple charts are documented on the [Common Fields](./common-fields) page.
