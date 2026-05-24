---
sidebar_position: 2
---

# Identity Providers

Identity providers (IdPs) are the external systems that hold the authoritative source of user information — GitHub, GitLab, a corporate directory, or any other system that implements the k8shell IdP gRPC interface. Identity acts as a proxy in front of all providers: platform services never call an IdP directly. 

## Provider model

Each provider exposes a well-defined gRPC API that Identity calls internally. Providers self-identify with a reverse-DNS name that follows the scheme `idp.k8shell.io/<name>`, for example:

<StandardInlineTable data={`
columns:
  - header: Provider
    width: 200px
  - header: ID
rows:
  - - "Built-in file provider"
    - "\`idp.k8shell.io/file\`"
  - - "GitHub IdP  <EarlyAccessBadge />"
    - "\`idp.k8shell.io/github\`"
  - - "GitLab IdP  <EarlyAccessBadge />"
    - "\`idp.k8shell.io/gitlab\`"
`} />

:::info
The name returned by the provider is used as its stable key inside Identity. It is stored on every user record as the `source` field so that subsequent lookups are always routed to the same provider that originally resolved the user.
:::

## Provider types

### Local file provider

The built-in file provider (`idp.k8shell.io/file`) loads user definitions from one or more YAML files on disk. It supports user lookup and SSH public key authentication, but does not support OAuth onboarding flows or token management. It is intended for static users, and local testing.

### Remote providers

Remote providers are separate processes — dedicated IdP services such as GitHub or GitLab — that run alongside Identity and are connected over gRPC. Identity is configured with the address of each remote provider; it connects at startup and registers the provider under the name the provider reports. 

Multiple remote providers can be active simultaneously. When Identity needs to locate a user and no source hint is available, it queries all providers in deterministic (name-sorted) order and uses the first result.

## User creation from provider data

When a provider returns raw user data from the downstream API (for example, the GitHub user and emails endpoints), Identity does not use the raw response directly. Each provider is configured with a **user template** — a YAML file that maps the provider's response fields onto the k8shell user model using [CEL](https://cel.dev) expressions.

The following template show an example how a GitHub user object (and its associated emails list) is maped to a k8shell user:

```yaml
user:
  username: !cel "user.login"
  fullname: ""
  uid: !cel "100000 + int(user.id)"
  gid: !cel "100000 + int(user.id)"
  email: !cel |
    emails.exists(e, e.primary == true)
      ? emails.filter(e, e.primary == true)[0].email
      : "unknown@nowhere.com"
  roles: ["workspace-user"]
  isValid: true
  organization: "github"
```

The evaluation scope for this template contains two objects sourced from the GitHub API:

- **`user`** — the GitHub user object (fields such as `login`, `id`, `name`).
- **`emails`** — the list of email objects from the GitHub emails endpoint, each with `email`, `primary`, and `verified` fields.

Field-by-field explanation:

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Notes
rows:
  - - "\`username\`"
    - "The GitHub login name becomes the k8shell username."
  - - "\`fullname\`"
    - "Left blank; GitHub's \`name\` field is often empty or a display name."
  - - "\`uid\` / \`gid\`"
    - "The GitHub numeric user ID is offset by 100 000 to avoid collisions with local system UIDs."
  - - "\`email\`"
    - "Selects the address marked \`primary == true\`; falls back to \`unknown@nowhere.com\` if none is marked primary."
  - - "\`roles\`"
    - "Platform role assigned to the user."
  - - "\`isValid\`"
    - "Marks the record as valid. Can be a CEL expression to conditionally allow or deny users based on provider data."
  - - "\`organization\`"
    - "Groups the user under a named organization for multi-tenant deployments."
`} />
