---
sidebar_position: 4
title: GitLab IdP Chart
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# GitLab IdP Chart

The `idp-gitlab` Helm chart deploys the GitLab identity provider service, which allows users to authenticate to k8shell using their GitLab credentials. It integrates with a GitLab OAuth application to verify identity and maps GitLab users to k8shell users via a configurable CEL template. For more details see [Identity Providers](/architecture/identity/providers).

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
    - "Container image repository. Default: \`ghcr.io/k8shell-io/idp-gitlab\`"
  - - "\`image.tag\`"
    - "Container image tag. Default: \`v0.1.6\`"
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
  - - "\`gitlab\`"
    - "GitLab OAuth application and access control settings. See [gitlab](#gitlab)."
  - - "\`gitlabUserTemplate\`"
    - "CEL template for mapping GitLab users to k8shell users. See [gitlabUserTemplate](#gitlabusertemplate)."
`} />

### gitlab

GitLab OAuth application configuration and access control.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`address\`"
    - "Base URL of the GitLab instance. Default: \`https://gitlab.com\`"
  - - "\`clientId\`"
    - "GitLab OAuth app client ID. See [secret fields](./common-fields#secret-fields)."
  - - "\`clientSecret\`"
    - "GitLab OAuth app client secret. See [secret fields](./common-fields#secret-fields)."
  - - "\`allowAccess.users\`"
    - "List of GitLab usernames permitted to authenticate. Default: \`[]\`"
  - - "\`allowAccess.groups\`"
    - "List of GitLab group entries permitted to authenticate. See [gitlab.allowAccess.groups](#gitlaballowaccessgroups) below. Default: not set"
`} />

#### gitlab.allowAccess.groups

Each entry in `gitlab.allowAccess.groups` restricts access to members of a specific GitLab group.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`org\`"
    - "GitLab group or subgroup path."
  - - "\`team\`"
    - "Team name within the group."
  - - "\`serviceToken\`"
    - "GitLab personal access token with \`read_api\` scope, used to query group membership."
`} />

### gitlabUserTemplate

A YAML string containing the template used to map a GitLab user to a k8shell user. Fields support [CEL](https://cel.dev) expressions (tagged with `!cel`) for dynamic mapping from the GitLab API response.

The template receives one variable:

- `user` — the GitLab user object returned by the GitLab user API.

Default template:

```yaml
gitlabUserTemplate: |
  user:
    username: !cel "user.username"
    fullname: !cel "user.name"
    uid: !cel "100000 + int(user.id)"
    gid: !cel "100000 + int(user.id)"
    email: !cel "user.email"
    auths: [publickey]
    blueprints: ["*"]
    roles: ["workspace-user"]
    isValid: true
    shell: "/bin/bash"
    sudo: true
    organization: "gitlab"
```
