---
sidebar_position: 2
---

# Blueprint Manager

Platform blueprints are stored as YAML files in a directory on the Provisioner's filesystem. On startup, the blueprint manager reads loads and parsers all blueprints, and watches the blueprint directory for changes. When a file is added, modified, or deleted, it reloads and re-validates the entire set atomically. If the new set fails validation, the previous valid set is kept and the error is logged.

## Inheritance resolution

After loading, the Provisioner resolves the inheritance chain for every blueprint by walking `template` references recursively from child to root. Circular references are detected and rejected with an error.

Resolution produces a single merged YAML node for each blueprint. The merge is depth-first: the root template is resolved first, then each child layer is merged on top of the result. The `isTemplate` key is stripped from the parent before merging so it is not propagated to concrete blueprints.

### YAML merge rules

The merge operates at the YAML AST level using these rules:

<StandardInlineTable data={`
columns:
  - header: Node type
    width: 150px
  - header: Rule
rows:
  - - Scalar
    - Child value wins
  - - Mapping
    - Keys are merged recursively; keys present only in the parent are kept, keys present only in the child are added
  - - Sequence
    - "Configurable per path (see below); default is **append** — parent items followed by child items"
`} />

### Sequence merge strategies

For sequence fields the default behaviour is to append the child's items to the parent's items. This is appropriate for additive fields like `capabilities` or `portForwarding`, where a concrete blueprint extends the root list rather than replacing it.

When appending is not the desired behaviour, the `BlueprintManager` accepts registered merge strategies keyed by dotted field path. A strategy is a function `(parent []any, child []any) []any` and can implement replace, union-by-key, or any other logic. Strategy lookup checks, in order:

1. Exact full path (e.g. `storages.home.claimSpec.accessModes`)
2. Suffix match (e.g. `claimSpec.accessModes` matches any path ending with that suffix)
3. Bare key name (e.g. `initScripts`)

## Custom blueprint composition

When a workspace is provisioned from a repository that contains a `.k8shell.yaml` file, the Provisioner performs an additional composition step on top of inheritance resolution.

The `ComposeWithScope` function:

1. Takes the `CustomBlueprint` read from `.k8shell.yaml` (which specifies a [platform blueprint](blueprint.md) via its `template` field)
2. Looks up the named platform blueprint in the already-resolved blueprint map
3. Merges the custom blueprint's YAML node on top of the platform blueprint using the same rules as inheritance resolution
4. Evaluates all CEL expressions in the merged result (see below)
5. Decodes the evaluated YAML into a concrete `Blueprint` struct and validates it

The result is a single fully-merged blueprint that combines platform defaults with the repository-specific overrides.

## CEL evaluation

CEL expressions are not evaluated during loading or inheritance resolution — they are evaluated at provisioning time, once the workspace request is known. This deferred evaluation is what allows fields like `hostname` or storage paths to incorporate per-user or per-workspace values.

At evaluation time, the Provisioner constructs a `BlueprintScope` containing:

<StandardInlineTable data={`
columns:
  - header: Variable
    width: 150px
  - header: Type
    width: 100px
  - header: Contents
rows:
  - - "\`user\`"
    - object
    - "Authenticated user — username, UID/GID, roles, allowed blueprints"
  - - "\`workspaceName\`"
    - string
    - "The workspace [canonical ID](../overview/user-string#canonical-id)"
  - - "\`metadata\`"
    - object
    - "Blueprint name, repository owner/name, ref, remote address"
  - - "\`blueprint\`"
    - string
    - The resolved blueprint name
`} />

The merged YAML node is decoded into a `CELTemplate`, which traverses the tree and evaluates every `!cel`-tagged scalar against this scope. The result is re-serialised as plain YAML and decoded into the final `Blueprint` struct.

Example: setting a workspace-specific hostname and per-user home path:

```yaml
hostname: !cel "user.username + '-' + metadata.name"
storages:
  home:
    path: !cel "'/home/' + user.username"
```

## Validation

After the final `Blueprint` struct is produced, the Provisioner validates it before rendering any Kubernetes resources. Validation checks:

- **Field constraints** — required fields present, string lengths within bounds, enum values valid
- **PVC claim specs** — each storage `claimSpec` is decoded as a Kubernetes `PersistentVolumeClaimSpec` to catch structural errors early
- **Storage size limits** — `sizeLimit` is only permitted on `emptyDir` and `memory` storage types, and must be a valid Kubernetes resource quantity
- **Security context** — `runAsUser` and `runAsGroup` must be `0`, `runAsNonRoot` and `readOnlyRootFilesystem` cannot be `true`, `allowPrivilegeEscalation` cannot be `false`, and the capabilities `CHOWN`, `SETUID`, and `SETGID` required by `k8shelld` must not be dropped

At startup, all loaded blueprints are validated against a synthetic test scope to catch configuration errors before any real workspace request arrives.
