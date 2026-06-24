---
sidebar_position: 2
---

# Detection Rules

Detection rules are the primary mechanism for identifying known attack signatures. They are defined declaratively in YAML files and loaded by Worktrace at startup. Each rule specifies what event pattern to match, how confident a match is, and whether a match should produce an immediate alert or feed into multi-step correlation.

## Rule structure

Every rule carries four required fields:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier used to reference the rule in attack path definitions and threat records. |
| `confidence` | A value between 0 and 1 representing how strongly a match indicates malicious intent. Used in composite confidence scoring for correlated threats. |
| `report` | When `true`, a rule match produces an immediate threat alert in addition to the suspect event sent to the correlation pipeline. Set to `false` for events that are only meaningful in combination with other rules. |
| `global` | When `true`, the rule is evaluated against all events regardless of pod context — used for Docker-in-Docker inner container events that carry no Kubernetes metadata. See [Global rules](#global-rules) below. |

A rule must contain exactly one pattern block: `process`, `file`, or `syscall`.

## Pattern types

### Process patterns

Process rules match on executed binary names and optionally on command-line arguments. They are evaluated against `process_exec` events from Tetragon.

```yaml
rules:
  - id: "insmod-kernel-module"
    report: true
    confidence: 0.90
    process:
      binary: ["insmod", "modprobe"]
```

The `binary` field accepts a list of exact binary names. To also restrict by argument, add an `args` list where each entry specifies a positional index and one or more expected values.

### File patterns

File rules match on file paths observed through `fd_install` kernel function hooks and support glob wildcards. They are useful for detecting access to sensitive host paths or configuration files that should never be touched from within a workspace.

```yaml
rules:
  - id: "sa-token-read"
    report: false
    confidence: 0.70
    file:
      path: ["/var/lib/kubelet/pods/*/volumes/kubernetes.io~secret/*/token"]
```

The `fd_install` hook fires on file descriptor creation, capturing both reads and writes.

### Syscall patterns

Syscall rules match on specific system call names with optional argument inspection. Arguments are matched by index, with a list of expected values and a match operator (`contains_any`, `equal`, or `not_equal`).

```yaml
rules:
  - id: "dind-mknod-dev"
    report: true
    confidence: 0.80
    syscall:
      name: ["sys_mknodat"]
      args:
        - index: 1
          values: ["/dev/sd"]
          match: "contains_any"
      selectors:
        matchBinaries:
          - operator: "In"
            values: ["/usr/bin/runc"]
```

This rule fires when `runc` calls `mknodat` with a path containing `/dev/sd` — a key indicator of privileged container creation during a Docker-in-Docker escape. The `selectors.matchBinaries` field restricts the hook to events originating from the specified binaries, reducing event volume at the kernel level.

## Rule-driven event capture

A distinctive property of Worktrace is that the detection rules determine not only what is detected but also what the kernel observes. The Tetragon TracingPolicy — the eBPF configuration specifying which kernel functions to instrument — is generated automatically from the loaded rule files at deployment time.

The generator scans all rule files, extracts the set of referenced system calls with their argument specifications, and produces a TracingPolicy with one kprobe entry per unique system call. The `fd_install` function is always included as the universal hook for file access rules. Binary selectors from rules are propagated into the TracingPolicy, so filtering happens at the eBPF level before events reach user space.

This eliminates two failure modes that arise when instrumentation and detection are managed separately:

- If a rule references a system call not covered by the TracingPolicy, the rule silently produces no matches.
- If a rule is removed but its hook remains in the TracingPolicy, resources are wasted on events that no rule will evaluate.

With generated TracingPolicies, the instrumentation is always exactly aligned with the active detection logic.

## Global rules

Tetragon enriches events with Kubernetes metadata by resolving cgroup membership. However, containers created *inside* a Docker-in-Docker sidecar are managed by the sidecar's Docker daemon rather than by Kubernetes. Their events carry no pod context and cannot be attributed to any workspace.

Rules marked `global: true` are evaluated against all events, including those without pod attribution. When a global rule matches an unattributed event, the resulting suspect event is broadcast to the correlation state of all active workspaces. This allows an orphan event — such as a `mount` call from an inner container — to complete an attack path in whichever workspace already has the other required rules matched.

To reflect the reduced attribution certainty, correlated threats involving global rule matches receive a reduced confidence score relative to fully attributed paths.
