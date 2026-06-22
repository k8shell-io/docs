---
sidebar_position: 4
---

# User String

The **User String** (`USERSTR`) is the user portion of the SSH connection string—the substring before the `@` delimiter. It is a compact identifier that represents a user together with an optional workspace specification. The workspace can be specified as:

- an **explicit blueprint name** (`bp-name`), or
- a **parameter list** that describes a git-based or named workspace.

## Grammar

```ebnf
USERSTR        ::= USER [ "~" WS_SPEC ]

WS_SPEC        ::= BP_FORM | PARAM_LIST

; Blueprint form: first segment contains no "="
BP_FORM        ::= BP_NAME *( "+" KV )
BP_NAME        ::= <url-path-escaped string>      ; decoded with url.PathUnescape

; Parameter-list form: all segments are key=value pairs
PARAM_LIST     ::= KV *( "+" KV )
KV             ::= KEY "=" VALUE

KEY            ::= "repo" | "ref" | "user" | "pod" | "ns" | "workload"
VALUE          ::= <url-path-escaped string>      ; decoded with url.PathUnescape

USER           ::= 1*( ALPHA / DIGIT / "_" / "-" )

DELIMS         ::= "@" | "~" | "+" | "="
```

### Base64-wrapped user strings

A whole `USERSTR` may be provided as a raw base64url token:

```ebnf
USERSTR ::= ( "b64-" | "base64-" ) b64url-raw
```

This token is decoded (base64url **raw**, **no padding**) into a plain `USERSTR`, which is then parsed normally.

## Forms

There are four distinct forms a user string can take:

<StandardInlineTable data={`
columns:
  - header: Form
    width: 120px
  - header: Description
rows:
  - - "implicit"
    - "*Implicit blueprint*: \`alice\` — username only; workspace is resolved from user defaults."
  - - "explicit"
    - "*Explicit blueprint*: \`alice~dev\` — blueprint name given literally after \`~\`. Optional \`workload\`, \`ns\`, and \`user\` params may follow."
  - - "named"
    - "*Named workspace*: \`alice~pod=ws1\` — targets a specific running workspace pod by name. Optional \`ns\` and \`user\` params allowed."
  - - "repo"
    - "*Repo workspace*: \`alice~repo=org/proj\` — git-based blueprint computed from repo. Optional \`ref\`, \`workload\`, \`ns\`, and \`user\` params allowed."
`} />

## Parameters

<StandardInlineTable data={`
columns:
  - header: Key
    width: 120px
  - header: Forms
    width: 120px
  - header: Description
rows:
  - - "\`repo\`"
    - "repo"
    - "Repository in \`owner/name\` or bare \`name\` format. Owner defaults to username if omitted. The computed blueprint name is \`repo-<owner>-<name>\`."
  - - "\`ref\`"
    - "repo"
    - "Branch, tag, or commit ref."
  - - "\`user\`"
    - "all"
    - "Override the OS user inside the workspace container."
  - - "\`pod\`"
    - "named"
    - "Name of a specific running workspace pod to connect to."
  - - "\`ns\`"
    - "explicit, named, repo"
    - "Kubernetes namespace. Required when \`workload\` is set; must not appear without \`workload\` (in blueprint and repo forms)."
  - - "\`workload\`"
    - "explicit, repo"
    - "Kubernetes workload to inject into, in \`kind/name\` format (e.g. \`deployment/identity\`, \`statefulset/postgres\`, \`daemonset/agent\`). Must be paired with \`ns\`."
`} />

## Parsing, decoding, and normalization rules

<StandardInlineTable data={`
columns:
  - header: Rule
    width: 180px
  - header: Description
rows:
  - - "Whitespace"
    - "Leading/trailing whitespace is trimmed before parsing."
  - - "Case: username"
    - "Usernames are normalized to lowercase."
  - - "Case: keys"
    - "Parameter keys are normalized to lowercase."
  - - "Case: values"
    - "All parameter values are normalized to lowercase."
  - - "Form detection"
    - "If the first segment after \`~\` contains **no** \`=\`, it is treated as a blueprint name. Otherwise all segments are treated as \`key=value\` pairs."
  - - "Percent-decoding"
    - "\`url.PathUnescape\` is applied to blueprint names and to all parameter values (not keys)."
  - - "Slash \`/\` in values"
    - "\`/\` is allowed inside values (e.g. \`repo=org/proj\`, \`workload=Deployment/identity\`). When encoded as \`%2F\` it is decoded back to \`/\`."
  - - "Reserved delimiters"
    - "\`@\`, \`~\`, \`+\`, \`=\` are syntax delimiters. To use them literally inside a value, percent-encode them (\`%40\`, \`%7E\`, \`%2B\`, \`%3D\`)."
  - - "\`workload\` + \`ns\`"
    - "\`workload\` and \`ns\` must always appear together."
  - - "\`pod\` exclusivity"
    - "\`pod\` cannot be combined with \`repo\` or \`workload\`."
  - - "Maximum length"
    - "Total user string length ≤ 128 characters."
`} />

:::note
Some clients require certain characters in the user string to be URL-encoded. For example, Visual Studio Code's `code` CLI and `scp` may require the slash (`/`) character to be percent-encoded, whereas the standard `ssh` CLI often accepts it without encoding.
:::

## Canonical ID

Each workspace is assigned a deterministic canonical ID derived from the user string. The format is:

```
{username}-{hash}
```

Where `{hash}` is the first 7 hex characters of a SHA-256 hash computed over the canonical key. The canonical key is constructed from the fields present in the user string:

- `username` — always included
- `repo` — repository owner and name (if specified)
- `ref` — branch or tag reference (if specified)
- `bp` — blueprint name (if included)
- `workload` — workload kind and name (if injecting into an existing workload)
- `ns` — namespace (if specified)

The key format is `u={username}|r={owner}/{name}|ref={ref}|bp={blueprint}|workload={kind}/{name}|ns={namespace}`, with fields omitted if not present. This ensures that the same user string always resolves to the same canonical ID, while different user strings produce distinct IDs.

The canonical ID is used as the pod name in the standalone model, as the Helm release name, and as the prefix for all injected resources in the injection model. Workspaces are tracked by their canonical key internally; the hash is purely for naming.

**Examples:**

- User `alice` with no repo: `alice-a3b5c7d`
- User `alice` with repo `k8shell-io/docs` on branch `main`: `alice-e8f2a1c`
- User `alice` with same repo on branch `dev`: `alice-9d4b2e6`

## Examples

### User only (implicit blueprint)

```text
alice
```

- `username=alice`, no workspace spec → implicit blueprint.

### Explicit blueprint name

```text
bob~dev
```

- `username=bob`, `blueprint=dev`.

### Explicit blueprint with workload injection

```text
bob~dev+workload=Deployment%2Fidentity+ns=team-a
```

- `username=bob`, `blueprint=dev`
- `workloadKind=deployment`, `workloadName=identity`, `namespace=team-a`

### Git-based blueprint

```text
carol~repo=myorg%2Fproject1
```

- `username=carol`, `repoOwner=myorg`, `repoName=project1`
- computed `blueprint=repo-myorg-project1`

### Git-based blueprint with ref

```text
eve~repo=acme/portal+ref=v1.2
```

- `username=eve`, `repoOwner=acme`, `repoName=portal`, `repoRef=v1.2`
- computed `blueprint=repo-acme-portal`

### Git-based blueprint with workload injection

```text
alice~repo=org/proj+workload=Deployment%2Fidentity+ns=k8s-test
```

- `username=alice`, `repoOwner=org`, `repoName=proj`
- `workloadKind=deployment`, `workloadName=identity`, `namespace=k8s-test`
- computed `blueprint=repo-org-proj`

### Named workspace (pod)

```text
alice~pod=workspace1+ns=team-a
```

- `username=alice`, `pod=workspace1`, `namespace=team-a`

### Override container user

```text
alice~dev+user=root
```

- `username=alice`, `blueprint=dev`, container OS user overridden to `root`.

### Base64-wrapped user string

```text
b64-ZXZlfnJlcG89YWNtZS9wb3J0YWwrcmVmPXYxLjI
```

Decodes to `eve~repo=acme/portal+ref=v1.2`, then parsed normally.
