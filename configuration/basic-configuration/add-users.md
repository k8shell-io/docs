---
sidebar_position: 2
title: Add Users
---

# Add Users

Users can be provisioned directly by the k8shell chart by specifying them under the `users` key in `values.yaml`. On each chart reconciliation, the user list is synced into the identity service — users present in the list are created or updated, and users absent from it are not automatically removed.

:::warning Use identity providers in production
Static users defined in chart values are intended for initial setup and environments where no identity provider is available. Once an IdP (GitHub, GitLab, or another OIDC provider) is configured, user onboarding should happen exclusively through it. Maintaining users in `values.yaml` alongside an active IdP leads to split identity state and should be avoided.
:::

## User fields

<StandardInlineTable data={`
columns:
  - header: Field
    width: 150px
  - header: Required
    width: 90px
  - header: Description
rows:
  - - "\`username\`"
    - "Yes"
    - "Login name for the user."
  - - "\`uid\`"
    - "Yes"
    - "POSIX user ID (minimum 1)."
  - - "\`gid\`"
    - "Yes"
    - "POSIX group ID (minimum 1)."
  - - "\`fullname\`"
    - "No"
    - "Display name."
  - - "\`email\`"
    - "No"
    - "Email address."
  - - "\`blueprints\`"
    - "No"
    - 'List of blueprint names the user may access. Use \`["*"]\` to allow all.'
  - - "\`sudo\`"
    - "No"
    - "Grant the user passwordless sudo inside the workspace."
  - - "\`shell\`"
    - "No"
    - "Default login shell (e.g. \`/bin/bash\`)."
  - - "\`roles\`"
    - "No"
    - "List of k8shell roles assigned to the user (e.g. \`admin\`, \`workspace-user\`)."
  - - "\`organization\`"
    - "No"
    - "Logical organization or tenant the user belongs to."
  - - "\`publicKey\`"
    - "No"
    - "SSH public key for public-key authentication."
`} />

## Example

A typical `values.yaml` snippet for a small self-hosted deployment with a single admin and a regular user:

```yaml
users:
  - username: admin
    uid: 1001
    gid: 1001
    fullname: Administrator
    email: admin@k8shell
    blueprints: ["*"]
    sudo: true
    shell: /bin/zsh
    roles: [admin]
    organization: default
    publicKey: "ssh-ed25519 AAAA..."

  - username: alice
    uid: 1002
    gid: 1002
    fullname: Alice
    email: alice@example.com
    blueprints: ["dev"]
    sudo: false
    shell: /bin/bash
    roles: [user]
    organization: default
    publicKey: "ssh-ed25519 AAAA..."
```

When using Helm directly, these values can be placed in a dedicated `users.yaml` file and passed at install time to keep them separate from other configuration:

```bash
helm upgrade --install k8shell oci://ghcr.io/k8shell-io/charts/k8shell \
  -f values.yaml \
  -f users.yaml
```
