---
sidebar_position: 2
---

# User String

The **User String** (`USERSTR`) is a compact identifier that represents a user together with an optional workspace specification. The workspace can be specified either as:

- an **explicit blueprint name** (`bp-name`), or
- a **parameter list** (currently: `repo`, `ref`, `pr`) that describes a git-based blueprint.

## Grammar (v1.0)

```ebnf
USERSTR        ::= USER [ "~" WS_SPEC ]

WS_SPEC        ::= BP_NAME | PARAM_LIST
BP_NAME        ::= <url-path-escaped string>      ; decoded with url.PathUnescape

PARAM_LIST     ::= KV *( "+" KV )
KV             ::= KEY "=" VALUE

KEY            ::= "repo" | "ref" | "pr"
VALUE          ::= <url-path-escaped string>      ; decoded with url.PathUnescape

USER           ::= 1*( ALPHA / DIGIT / "_" / "-" )

DELIMS         ::= "@" | "~" | "+" | "="
```

### Special (optional) input form: base64-wrapped user strings

A whole `USERSTR` may be provided as a raw base64url token:

```ebnf
USERSTR ::= ( "b64-" | "base64-" ) b64url-raw
```

This token is decoded (base64url **raw**, **no padding**) into a plain `USERSTR`, which is then parsed normally.

## Parsing, decoding, and normalization rules

<div class="ssh-table">

| Rule | Description |
|------|-------------|
| Whitespace | Leading/trailing whitespace is trimmed before parsing. |
| Case: username | Usernames are normalized to lowercase. |
| Workspace spec selection | If the part after `~` contains **no** `=`, it is treated as a blueprint name (`bp-name`). Otherwise it is treated as a parameter list. |
| Percent-decoding | Apply **url.PathUnescape** to **blueprint names** and **values** (not keys). |
| Key normalization | Keys are converted to lowercase. |
| Allowed keys | Only `repo`, `ref`, `pr` are allowed. Any other key is an error. |
| Slash `/` in values | `/` is allowed inside values. When encoded as `%2F`, it is decoded back to `/`. |
| Reserved delimiters | `@`, `~`, `+`, `=` are delimiters in the syntax. If you need them literally **inside a value**, percent-encode them (e.g. `%40`, `%7E`, `%2B`, `%3D`). |
| Mutual exclusion | `ref` and `pr` cannot both be specified. |
| `pr` validation | If present, `pr` must be a base-10 integer (> 0). |
| Maximum length | Total user string length ≤ 128 characters. |

</div>

:::info
Some clients require certain characters in the user string to be URL-encoded.
For example, Visual Studio Code’s `code` CLI and `scp` may require the slash (`/`) character to be percent-encoded, whereas the standard `ssh` CLI often accepts it without encoding.
:::

## Semantics

### Blueprint form (`user~bp-name`)

If `WS_SPEC` is a blueprint name (no `=` present), it is decoded with `url.PathUnescape` and used as an **explicit** blueprint.

### Parameter-list form (`user~k=v+...`)

- Parameters are parsed as `key=value` pairs separated by `+`.
- Values are decoded using `url.PathUnescape`.
- Only keys `repo`, `ref`, `pr` are accepted.
- `repo` determines the git blueprint source and therefore the computed blueprint name.

#### `repo` value format

`repo` may be either:

- `repo=<name>`  
  In this case, the repository owner defaults to the **username**.
- `repo=<owner>/<name>`

When `repo` is present and parsed successfully, the computed blueprint name becomes:

- `repo-<repoOwner>-<repoName>`

#### `ref` and `pr`

- `ref` is a branch/tag ref string.
- `pr` is a pull request number.

You may specify **at most one** of `ref` and `pr`.

:::note
Pull request resolution is performed internally by the identity provider: when a pull request number (`pr`) is specified (and `ref` is not), it may be resolved to a concrete git ref using a pull request resolver that calls the backing git service API (for example, the GitHub API).
:::

:::note
In canonicalization (outside of pure parsing), a `pr` may be resolved into a `ref` via a resolver, and the resolved `ref` can be used for workspace identity. The `pr` is treated as metadata/alias rather than identity.
:::

## Examples

### 1) User only (implicit blueprint)

```text
alice
```

- `USER=alice`
- No workspace spec → implicit blueprint (default from user settings).

### 2) Explicit blueprint name

```text
bob~dev
```

- `USER=bob`
- `BP_NAME=dev` (decoded via `url.PathUnescape`)

### 3) Git-based blueprint (repo), URL-encoded slash

```text
carol~repo=myorg%2Fproject1
```

After decoding:

- `USER=carol`
- `repoOwner=myorg`
- `repoName=project1`
- computed `BP_NAME=repo-myorg-project1`
- `ref` blank, `pr` blank

### 4) Git-based blueprint with explicit ref

```text
eve~repo=acme/portal+ref=v1.2
```

- `USER=eve`
- `repoOwner=acme`
- `repoName=portal`
- `ref=v1.2`
- computed `BP_NAME=repo-acme-portal`

### 5) Git-based blueprint with pull request

```text
dan~repo=acme/portal+pr=123
```

- `USER=dan`
- `repoOwner=acme`
- `repoName=portal`
- `pr=123`
- `ref` must be absent.

### 6) Base64-wrapped whole user string

If a client cannot safely pass delimiters, wrap the entire user string:

```text
b64-ZXZlfnJlcG89YWNtZS9wb3J0YWwrcmVmPXYxLjI
```

This decodes to:

```text
eve~repo=acme/portal+ref=v1.2
```

…and is then parsed normally.

