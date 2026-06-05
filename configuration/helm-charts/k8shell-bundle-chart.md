---
sidebar_position: 2
title: k8shell Bundle Chart
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# k8shell Bundle Chart

The `k8shell-bundle` chart is an umbrella chart that wraps the [k8shell chart](../k8shell-chart) and adds production-ready supporting infrastructure in a single deployment. It is the recommended starting point for production deployments and for teams that use HashiCorp Vault as their secrets backend.

:::info Early Access
To use `k8shell-bundle` with all services enabled, please [register for Early Access](https://k8shell.io/early-access) — we'll be happy to get you set up.
:::

The chart uses ArgoCD Application manfiest to install the following applications:

<StandardInlineTable data={`
columns:
  - header: Application
    width: 160px
  - header: Description
rows:
  - - "**k8shell**"
    - "The full k8shell service stack. See [k8shell Chart](../k8shell-chart)."
  - - "**GitHub IdP**"
    - "GitHub identity provider integration, allowing users to authenticate to k8shell using their GitHub credentials. See [GitHub IdP chart](./idp-github-chart)."
  - - "**GitLab IdP**"
    - "GitLab identity provider integration, allowing users to authenticate to k8shell using their GitLab credentials. See [GitLab IdP chart](./idp-gitlab-chart)."
  - - "**SSH Shield**"
    - "Deploys the SSH Shield service for blocking IP addresses on the external access interface based on SSH authentication failures. See [SSH Shield chart](./ssh-shield-chart)."
  - - "**Secrets**"
    - "Creates secrets with specific keys used by k8shell services. See [Secrets chart](/configuration/helm-charts/vault-secrets-chart/)."
  - - "**NATS**"
    - "Pre-configured NATS deployment providing the message bus and KV storage required by the provisioner and session services."
  - - "**PostgreSQL**"
    - "Pre-configured PostgreSQL deployment used by the identity, session, and provisioner services."
`} />

## Configuration reference

Each app in the bundle is configured under its own top-level key in `values.yaml`. The fields for each app are identical to those documented in the respective chart's configuration reference — only bundle-level fields are described here.

### Top-level

<StandardInlineTable data={`
columns:
  - header: Parameter
    width: 220px
  - header: Description
rows:
  - - "\`targetNamespace\`"
    - "**Required.** Kubernetes namespace in which all bundle applications are deployed."
  - - "\`syncPolicy.automated\`"
    - "Enable automated ArgoCD sync for all applications. Default: \`true\`"
  - - "\`charts\`"
    - "Chart source overrides per application. See [charts](#charts)."
  - - "\`vault\`"
    - "Vault integration settings. See [vault](#vault)."
  - - "\`k8shell\`"
    - "k8shell service stack configuration. See [k8shell Chart](./k8shell-chart) for field reference."
  - - "\`idpGithub\`"
    - "GitHub IdP configuration. See [GitHub IdP Chart](./idp-github-chart) for field reference."
  - - "\`idpGitlab\`"
    - "GitLab IdP configuration. See [GitLab IdP Chart](./idp-gitlab-chart) for field reference."
  - - "\`sshShield\`"
    - "SSH Shield configuration. See [SSH Shield Chart](./ssh-shield-chart) for field reference."
  - - "\`postgresql\`"
    - "PostgreSQL deployment configuration. See [postgresql](#postgresql)."
  - - "\`nats\`"
    - "NATS deployment configuration. See [nats](#nats)."
`} />

### charts

Source and version overrides for each bundled Helm chart. All fields are optional. By default, k8shell charts are pulled from `ghcr.io/k8shell-io/charts` at the version tested with this bundle release.

Each chart key exposes three fields: `repoURL`, `chartName`, and `chartVersion`.

<StandardInlineTable data={`
columns:
  - header: Key
    width: 160px
  - header: Default chart name
  - header: Default registry
rows:
  - - "\`k8shell\`"
    - "\`k8shell\`"
    - "\`ghcr.io/k8shell-io/charts\`"
  - - "\`idpGithub\`"
    - "\`idp-github\`"
    - "\`ghcr.io/k8shell-io/charts\`"
  - - "\`idpGitlab\`"
    - "\`idp-gitlab\`"
    - "\`ghcr.io/k8shell-io/charts\`"
  - - "\`sshShield\`"
    - "\`ssh-shield\`"
    - "\`ghcr.io/k8shell-io/charts\`"
  - - "\`vaultSecrets\`"
    - "\`vault-secrets\`"
    - "\`ghcr.io/k8shell-io/charts\`"
  - - "\`nats\`"
    - "\`nats\`"
    - "\`https://nats-io.github.io/k8s/helm/charts/\`"
  - - "\`postgresql\`"
    - "\`bitnamicharts/postgresql\`"
    - "\`registry-1.docker.io\`"
`} />

### vault

The bundle uses the [Vault Secrets Chart](./vault-secrets-chart) to sync secrets from HashiCorp Vault into Kubernetes Secrets consumed by the k8shell services.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable Vault integration. When \`true\`, the bundle configures the Vault Secrets Operator to sync secrets from Vault into Kubernetes Secrets. Default: \`true\`"
  - - "\`address\`"
    - 'Base URL of the Vault instance. Overrides \`vaultAddress\` for the Vault integration specifically. Default: \`""\`'
  - - "\`roleName\`"
    - 'Vault Kubernetes auth role used by the Vault Secrets Operator to authenticate. Default: \`""\`'
`} />

The following Kubernetes Secrets are created by the bundle from values stored in Vault. Each secret and its keys must be defined in Vault before deploying.

<StandardInlineTable data={`
columns:
  - header: Secret / Key
    width: 320px
  - header: Used by
rows:
  - - "\`vault-ssh\` / \`SERVER_KEY\`"
    - "SSH proxy host key (\`sshProxy.serverKey\`)"
  - - "\`vault-jwt\` / \`PRIVATE_KEY\`"
    - "JWT signing private key (\`identity.jwtIssuer.privateKey\`)"
  - - "\`vault-jwt\` / \`SIGNING_METHOD\`"
    - "JWT signing algorithm (\`identity.jwtIssuer.signingMethod\`)"
  - - "\`vault-default-registry\` / \`ADDRESS\`"
    - "Default workspace image registry hostname (\`provisioner.defaultRegistry.host\`)"
  - - "\`vault-default-registry\` / \`USERNAME\`"
    - "Default registry username (\`provisioner.defaultRegistry.username\`)"
  - - "\`vault-default-registry\` / \`PASSWORD\`"
    - "Default registry password (\`provisioner.defaultRegistry.password\`)"
  - - "\`vault-db\` / \`POSTGRES_USERNAME\`"
    - "PostgreSQL username (\`k8shell.postgresql.username\`)"
  - - "\`vault-db\` / \`POSTGRES_PASSWORD\`"
    - "PostgreSQL password (\`k8shell.postgresql.password\`)"
  - - "\`vault-nats\` / \`NATS_K8SHELL_PASSWORD\`"
    - "NATS password for \`k8shell-service\` user (k8shell, idpGithub, idpGitlab, sshShield)"
  - - "\`vault-nats\` / \`NATS_SSHSHIELD_PASSWORD\`"
    - "NATS password for \`sshshield\` user (NATS server auth config)"
  - - "\`vault-github\` / \`K8SHELL_CLIENT_ID\`"
    - "GitHub OAuth app client ID (\`idpGithub.github.clientId\`)"
  - - "\`vault-github\` / \`K8SHELL_CLIENT_SECRET\`"
    - "GitHub OAuth app client secret (\`idpGithub.github.clientSecret\`)"
  - - "\`vault-gitlab\` / \`GITLAB_CLIENT_ID\`"
    - "GitLab OAuth app client ID (\`idpGitlab.gitlab.clientId\`)"
  - - "\`vault-gitlab\` / \`GITLAB_CLIENT_SECRET\`"
    - "GitLab OAuth app client secret (\`idpGitlab.gitlab.clientSecret\`)"
  - - "\`vault-nfgate\` / \`NFGATE_AUTH_KEY\`"
    - "Shared auth key for the nfgate gRPC connection (\`sshShield.plugins.nfgate.authKey\`)"
`} />

### postgresql

Bundle-level PostgreSQL deployment settings. Fields listed here are specific to the bundle's PostgreSQL wrapper. For k8shell service connection settings, see [postgresql](./common-fields#postgresql) on the Common Fields page.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 280px
  - header: Description
rows:
  - - "\`persistentVolumeClaim.install\`"
    - "Create a PersistentVolumeClaim for PostgreSQL data storage. Default: \`false\`"
  - - "\`persistentVolumeClaim.annotations\`"
    - "Annotations to apply to the PVC. Default: \`{}\`"
  - - "\`persistentVolumeClaim.spec\`"
    - "Raw PVC spec to merge into the created PVC. Default: \`{}\`"
  - - "\`nodePort.enabled\`"
    - "Expose PostgreSQL via a NodePort Service for external access. Default: \`false\`"
  - - "\`nodePort.port\`"
    - 'NodePort value to use when \`nodePort.enabled\` is \`true\`. Default: \`""\`'
`} />

### nats

The bundle deploys NATS using the official [NATS Helm chart](https://github.com/nats-io/k8s) via an ArgoCD Application. The following values can be set.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 280px
  - header: Description
rows:
  - - "\`imageTag\`"
    - "NATS server image tag. Default: \`2.11.9-alpine\`"
  - - "\`cluster.enabled\`"
    - "Enable NATS JetStream clustering. Default: \`true\`"
  - - "\`cluster.replicas\`"
    - "Number of NATS cluster replicas. Default: \`3\`"
  - - "\`persistentVolumeClaim.storageClassName\`"
    - 'Storage class for NATS JetStream PVCs. Default: \`""\`'
  - - "\`persistentVolumeClaim.size\`"
    - "Size of each NATS JetStream PVC. Default: \`10Gi\`"
  - - "\`persistentVolumeClaim.reclaimPolicy\`"
    - "Reclaim policy for NATS PVCs. Default: \`Delete\`"
`} />

The following is applied on top of the chart defaults:

- **JetStream** is enabled with a persistent file store when the PVC is configured; otherwise JetStream runs without persistence.
- **Authorization** defines a single user `k8shell-service` (used by all k8shell services). Passwords are read from the `vault-nats` Kubernetes Secret at key `NATS_K8SHELL_PASSWORD` (synced from Vault).

### git-blueprints

The bundle installs a `git-blueprints` ConfigMap that provides the `git-dev` base blueprint for git-based workspaces. This blueprint is referenced by `k8shell.provisioner.defaultCustomBlueprint` (default: `git-dev`) and can serve as the foundation for any workspace launched from a Git repository.

The blueprint performs two actions on workspace start:

1. **Git configuration** — writes a `.gitconfig` for the user (rebase-on-pull, name, email from k8shell user profile, and the `k8shell` credential helper).
2. **Repository clone** — clones the repository into `$HOME` using the `GIT_ADDRESS`, `GIT_REPOOWNER`, `GIT_REPONAME`, and optionally `GIT_REPOREF` environment variables injected by the provisioner.

The workspace hostname is derived from the repository name and the subdomain from the repository owner, both normalized for DNS compatibility.

```yaml
blueprints:
  - name: git-dev
    template: base
    isTemplate: true
    image: workspaces/dev:1.12

    subdomain: !cel "normalizeDNS(metadata.repoOwner)"
    hostname: !cel "user.username + '-' + normalizeDNS(metadata.repoName)"

    initScripts:
      - name: git-config
        script: |
          touch /$HOME/.gitconfig
          git config --global pull.rebase true
          git config --global user.name "$(kbox user name)"
          git config --global user.email "$(kbox user email)"
          git config --global credential.helper "k8shell"

      - name: clone-repo
        script: |
          cd "$HOME"
          REPO_URL="${GIT_ADDRESS}/${GIT_REPOOWNER}/${GIT_REPONAME}.git"
          if [ -n "${GIT_REPOREF:-}" ]; then
            git clone -b "$GIT_REPOREF" --single-branch "$REPO_URL"
          else
            git clone "$REPO_URL"
          fi
```

