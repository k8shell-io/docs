---
sidebar_position: 3
title: GitHub IdP Chart
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# GitHub IdP Chart

The `idp-github` Helm chart deploys the GitHub identity provider service, which allows users to authenticate to k8shell using their GitHub credentials. It integrates with a GitHub OAuth application to verify identity and maps GitHub users to k8shell users via a configurable CEL template. For more details see [Identity Providers](/architecture/identity/providers).

## Configuration reference

The sections below document every parameter accepted by the chart's `values.yaml`. Fields shared across charts — `imageRegistry`, `certManager`, `postgresql`, `nats`, and secret-valued parameters — are documented on the [Common Fields](./common-fields) page.

### Top-level

<StandardInlineTable data={`
columns:
  - header: Parameter
    width: 220px
  - header: Description
rows:
  - - "\`replicas\`"
    - "Number of pod replicas. Default: \`1\`"
  - - "\`image.repository\`"
    - "Container image repository. Default: \`ghcr.io/k8shell-io/idp-github\`"
  - - "\`image.tag\`"
    - "Container image tag. Default: \`v0.12.4\`"
  - - "\`authEnabled\`"
    - "Enable JWT authentication for all inter-service communication. Default: \`true\`"
  - - "\`grpc.roundRobin\`"
    - "Enable client-side round-robin load balancing for gRPC connections. Default: \`true\`"
  - - "\`imageRegistry\`"
    - "Private container registry for image pulls. See [imageRegistry](./common-fields#imageregistry)."
  - - "\`certManager\`"
    - "TLS certificate issuance via cert-manager. See [certManager](./common-fields#certmanager)."
  - - "\`nats\`"
    - "NATS connection configuration. See [nats](./common-fields#nats)."
  - - "\`postgresql\`"
    - "PostgreSQL connection configuration. See [postgresql](./common-fields#postgresql)."
  - - "\`github\`"
    - "GitHub OAuth application and access control settings. See [github](#github)."
  - - "\`githubUserTemplate\`"
    - "CEL template for mapping GitHub users to k8shell users. See [githubUserTemplate](#githubusertemplate)."
`} />

### github

GitHub OAuth application configuration and access control.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`clientId\`"
    - "GitHub OAuth app client ID. See [secret fields](./common-fields#secret-fields)."
  - - "\`clientSecret\`"
    - "GitHub OAuth app client secret. See [secret fields](./common-fields#secret-fields)."
  - - "\`allowAccess.users\`"
    - "List of GitHub usernames permitted to authenticate. Default: \`[]\`"
  - - "\`allowAccess.teams\`"
    - "List of GitHub team entries permitted to authenticate. See [github.allowAccess.teams](#githuballowaccessteams) below. Default: not set"
`} />

#### github.allowAccess.teams

Each entry in `github.allowAccess.teams` restricts access to members of a specific GitHub team.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`org\`"
    - "GitHub organisation slug."
  - - "\`team\`"
    - "Team slug within the organisation."
  - - "\`serviceToken\`"
    - "GitHub personal access token (PAT) with \`read:org\` scope, used to query team membership."
`} />

### githubUserTemplate

A YAML string containing the template used to map a GitHub user to a k8shell user. Fields support [CEL](https://cel.dev) expressions (tagged with `!cel`) for dynamic mapping from the GitHub API response.

The template receives two variables:

- `user` — the GitHub user object returned by the GitHub API.
- `emails` — the list of email objects associated with the GitHub account.

Default template:

```yaml
githubUserTemplate: |
  user:
    username: !cel "user.login"
    fullname: ""
    uid: !cel "100000 + int(user.id)"
    gid: !cel "100000 + int(user.id)"
    email: !cel |
      emails.exists(e, e.primary == true)
        ? emails.filter(e, e.primary == true)[0].email
        : "unknown@nowhere.com"
    auths: [publickey]
    blueprints: ["*"]
    roles: ["workspace-user"]
    isValid: true
    shell: "/bin/bash"
    sudo: true
    organization: "github"
```
