---
sidebar_position: 3
---

# Attack Paths

Many real-world attacks consist of a sequence of steps, each individually ambiguous but collectively unambiguous when observed together. The correlation pipeline assembles suspect events from the direct pipeline into multi-step attack paths, emitting a threat only when the full sequence is observed within a time window.

## Attack classes

Worktrace targets attacks across three threat categories:

* **Container escapes (ESC):** Breaking out of the container boundary to access the host.
* **Information disclosure (IDS):** Exploiting privileged kernel capabilities to extract host information.
* **Kubernetes-level escalation (K8S):** Abusing Kubernetes resources or host access to escalate cluster privileges.

The detected attacks and their confidence scores are listed below. The **confidence score** (0–1) indicates how strongly a detection signals malicious intent. See [Confidence scoring](#confidence-scoring) for how composite scores are calculated for correlated attacks.

<StandardInlineTable data={`
columns:
  - header: ID
    width: 80px
  - header: Attack
    width: 200px
  - header: Description
  - header: Confidence
    width: 100px
rows:
  - - "ESC-1"
    - "DinD escape"
    - "Privileged inner container mounts a host block device via the Docker-in-Docker sidecar"
    - "0.98"
  - - "ESC-2"
    - "Kernel module injection"
    - "Loads an attacker-controlled kernel module via \`CAP_SYS_MODULE\`"
    - "0.97"
  - - "ESC-3"
    - "ptrace injection"
    - "Injects code into a host process via \`PTRACE_POKETEXT\` using \`hostPID\`"
    - "0.97"
  - - "ESC-4"
    - "Shocker"
    - "Reads host filesystem inodes directly via \`open_by_handle_at\`"
    - "0.88"
  - - "ESC-5"
    - "Core pattern escape"
    - "Abuses the kernel core dump usermode helper to execute arbitrary code on the host"
    - "0.90"
  - - "ESC-6"
    - "Log mount escape"
    - "Manipulates a symlink to mount host log paths from within the container"
    - "0.58"
  - - "IDS-2"
    - "Raw I/O device access"
    - "Reads raw block device data via \`CAP_SYS_RAWIO\` to extract host memory contents"
    - "0.85"
  - - "IDS-3"
    - "KASLR bypass"
    - "Uses \`CAP_SYSLOG\` to read kernel log messages that expose KASLR offsets"
    - "0.51"
  - - "K8S-2"
    - "SA token harvesting"
    - "Reads service account tokens from the host kubelet filesystem to impersonate workloads"
    - "0.99"
  - - "K8S-3"
    - "nsenter node escape"
    - "Runs \`nsenter\` from a privileged pod to enter host namespaces and persist via a static pod"
    - "0.99"
`} />

## How correlation works

The correlation pipeline maintains a per-workspace, per-path accumulator that tracks which rule IDs from a path's required set have been observed. The pipeline uses set-inclusion semantics: order does not matter, and duplicate rule matches within the window are ignored. When all required rule IDs are present in the accumulator, the path is satisfied and a correlated threat is emitted.

The time window is sliding: each new suspect event resets the observation timestamp for that rule ID within the accumulator. Observations older than the configured window are expired before checking path satisfaction.

## Confidence scoring

A correlated threat combines the confidence scores of all contributing rules into a composite score using the formula:

```
confidence = 1 - ∏(1 - cᵢ)
```

where `cᵢ` is the individual confidence of each matched rule. This is the complement of the probability that all rules are simultaneously false positives, and grows toward 1 as more high-confidence rules contribute.

## Path definition format

Attack paths are defined in the same YAML files as detection rules. Each path specifies a unique ID, a human-readable name, the required rule IDs, and the time window:

```yaml
attack_paths:
  - id: "dind_escape_device_mount"
    name: "DinD escape via device mount"
    time_window: "10m"
    rules:
      - "dind-mknod-dev"
      - "dind-mount-host-block-device"
```

`time_window` accepts Go duration strings (`10m`, `1h`, `30s`). The `rules` list references rule IDs by their `id` field; any referenced rule ID that does not exist in the loaded rule set produces a warning at startup.

## Example: Docker-in-Docker escape

The DinD escape (ESC-1) illustrates how the direct and correlation pipelines interact. The attack proceeds in two phases:

1. The attacker starts a privileged inner container via the Docker-in-Docker sidecar. When `runc` populates device nodes under `/dev` inside the inner container, the `dind-mknod-dev` rule fires immediately (`report: true`) with a direct threat at 0.80 confidence. The suspect event is also forwarded to the correlation pipeline.

2. The correlation pipeline has already received a suspect event from a second rule that matches the `docker run --privileged` execution. With both rules now satisfied within the 10-minute window, the first attack path — confirming privileged container creation — fires at 0.98 composite confidence, approximately 305 ms after the first direct alert.

3. When the attacker mounts a host block device from inside the inner container, this `mount` syscall originates from a user-created container whose cgroup Tetragon cannot resolve to a Kubernetes pod. The matching rule is marked `global: true`, so the suspect event is broadcast to all active workspaces. The workspace that already had `dind-mknod-dev` in its accumulator receives this broadcast and satisfies the second attack path — capturing the escape itself — at 0.765 confidence. The lower score reflects the reduced certainty of the global rule attribution.

## Non-reporting rules and correlation-only detection

Some attack indicators are individually too common to report directly. The `ptrace` injection attack (ESC-3) relies on this: `PTRACE_ATTACH` and `PTRACE_POKETEXT` system calls both occur during legitimate debugging, so their corresponding rules have `report: false`. Neither generates a direct alert in isolation. Only when both are observed within the time window does the correlation pipeline emit a threat, at 0.97 composite confidence.

This pattern — non-reporting rules feeding correlation-only paths — allows Worktrace to cover attack techniques that would produce an unacceptable false-positive rate if detected on a single event.
