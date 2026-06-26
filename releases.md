---
sidebar_position: 4.5
title: Releases
---

import ReleasesIndex from '@site/src/components/ReleasesIndex';

# Releases

All k8shell releases are published to [GitHub Container Registry (ghcr.io)](https://ghcr.io/k8shell-io).

<ReleasesIndex />

## Image signing
All container images are signed using [Sigstore cosign](https://docs.sigstore.dev/cosign/overview/) via GitHub Actions OIDC. You can verify any image signature before deployment:

```bash
cosign verify ghcr.io/k8shell-io/<image>:<tag> \
  --certificate-identity-regexp "https://github.com/k8shell-io/" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
```

For example:

```bash
cosign verify ghcr.io/k8shell-io/ssh-proxy:v0.14.1 \
  --certificate-identity-regexp "https://github.com/k8shell-io/" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
```
