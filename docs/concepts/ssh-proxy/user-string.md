---
sidebar_position: 2
---

# User String

The **User String** (`USERSTR`) is a compact, human-readable identifier that represents a user together with an optional workspace definition. The workspace definition can be specidied either as a reference to an existing workspace blueprint, or by using parameters referencing a **Git repository** that contains a K8shell blueprint file.

## Grammar and Encoding Rules

```
USERSTR      ::= USER [ "~" WS_SPEC ]
WS_SPEC      ::= BP_NAME | PARAMS
PARAMS       ::= REPO [ "+" REF ]        
REPO         ::= "repo" "=" REPOVAL
REF          ::= "ref"  "=" REF_VALUE

REPOVAL      ::= REPO_NAME | REPO_OWNER "/" REPO_NAME

USER         ::= 1*( ALPHA / DIGIT / "_" / "-" )
BP_NAME      ::= 1*( ALPHA / DIGIT / "_" / "-" )
REPO_OWNER   ::= 1*( ALPHA / DIGIT / "_" / "-" )
REPO_NAME    ::= 1*( ALPHA / DIGIT / "_" / "-" )
REF_VALUE    ::= 1*( ALPHA / DIGIT / "_" / "-" / "." )

CHAR         ::= any printable Unicode character except delimiters
DELIMS       ::= "~" | "+" | "="
```

## Encoding Rules

<div class="ssh-table">

| Rule | Description |
|------|--------------|
| Percent-decoding | Apply only to **blueprint names** and **values** (not keys). |
| Key normalization | Keys are converted to lowercase. |
| Slash `/` | Allowed inside values. When encoded as `%2F`, it is decoded back to `/`. |
| Reserved delimiters | `~`, `+`, `=` — must be percent-encoded if used literally. |
| Maximum length | Username ≤ 64 chars; total string ≤ 128 chars. |
| Whitespace | Leading/trailing whitespace is trimmed. |
| Case sensitivity | Usernames and keys are normalized to lowercase. Two user strings with combination of upper case and lowe case are identical. |

</div>

:::info
Some clients require certain characters in the user string to be URL-encoded.
For example, Visual Studio Code’s code CLI and the scp command may require the slash (/) character to be percent-encoded, whereas the standard ssh CLI accepts it without encoding.
:::

## Examples

The following are valid examples of user string.

* User `alice` without workspace spec. 

   ```
   alice
   ```

   PARAMS: `USER=alice`, all remaining parameters are blank.

* User `bob` with blueprint `dev`.

   ```
   bob~dev
   ```

   PARAMS: `USER=bob`, `BP_NAME=dev`, all remaining parameters are blank.

* User `carol` with git-based blueprint on the default branch with URL encoded slash.

   ```
   carol~repo=myorg%2Fproject1
   ```

   PARAMS: `USER=carol`, `REPO_OWBER=myorg`, `REPO_NAME=project`, `REF_VALUE=<blank>`, `BP_NAME=repo-myorg-project`

* User `eve` with git-based blueprint on custom branch `v1.2`.

   ```
   eve~repo=acme/portal+ref=v1.2  
   ```

   PARAMS: `USER=eve`, `REPO_OWNER=acme`, `REPO_NAME=portal`, `REF_VALUE=1.2`, `BP_NAME=repo-acme-portal`

