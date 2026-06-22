---
sidebar_label: Identity and Credentials
sidebar_position: 5
---

# Identity and Credentials

## kbox identity

`kbox identity` displays the JWT identity claims associated with the current workspace session. It queries `GET /identity` on the Internal API, which returns the raw claims from the token issued by the [Identity service](/architecture/identity/) when the workspace was provisioned.

```
kbox identity [--json]
```

Pass `--json` to see the full raw claims object. The default output shows a formatted summary of the most useful fields: username, email, organization, roles, and token expiry.

## kbox user

`kbox user` displays user information derived from the same `/identity` endpoint as `kbox identity`, formatted for readability. It provides quick access to individual fields without parsing the full claims:

```bash
kbox user          # display formatted user summary
kbox user name     # print just the username
kbox user email    # print just the email address
```

The `name` and `email` subcommands are used by the [init bootstrap](/architecture/workspace/init-bootstrap) to configure Git credentials automatically.

## kbox credentials

`kbox credentials` retrieves credentials for use with Docker and Git credential helpers. It proxies the request to the API Server via the Internal API (`GET /creds`), which returns short-lived credentials scoped to the current user and workspace.

```
kbox credentials
```

:::note
`kbox credentials` requires the API Server to be enabled in the deployment. When the API Server is not available, this command is not functional.
:::

## kbox last

`kbox last` shows recent SSH session history for the current user. It proxies `GET /sessions` to the API Server via the Internal API, returning the same session records available through `k8shell session list` in the [k8shell CLI](/user-guide/k8shell-cli/).

```
kbox last [--json]
```

The `last` wrapper installed during bootstrap calls `kbox last` transparently, replacing the standard `last` utility which reads from `/var/log/wtmp` (not populated inside containers).

:::note
`kbox last` requires the API Server to be enabled in the deployment. When the API Server is not available, this command and the `last` wrapper are not functional.
:::
