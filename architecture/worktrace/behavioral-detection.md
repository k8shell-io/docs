---
sidebar_position: 4
---

# Behavioral Detection

The behavioral pipeline provides anomaly detection as a complement to the rule-based approach. Rather than matching against known attack signatures, it builds a statistical model of normal workspace activity and flags events that deviate significantly from the established baseline.

## Baseline model

The pipeline maintains a global frequency counter across all workspace activity for three feature types:

| Feature type | What is counted | Normalization |
|---|---|---|
| Process binaries | Executed binary names | Exact binary name |
| File paths | Files accessed via `fd_install` | Truncated to three path components (e.g. `/usr/lib/python3`) |
| System calls | System call names | Exact syscall name |

All three counters share a single frequency map updated from the same event stream. The global scope — spanning all workspaces on the node — provides a larger sample than per-workspace counters would, at the cost of reduced per-user specificity.

## Rarity scoring

When an event arrives, the pipeline looks up the frequency count `c` for the relevant feature and computes a rarity score using an inverse-logarithmic formula:

```
rarity(c) = 1 / (1 + ln(1 + c))
```

A count of 0 (never observed before) produces a rarity of 1.0. As the count grows, rarity falls toward 0. Events where rarity exceeds a configurable threshold are reported as anomalous threats.

The inverse-logarithmic shape was chosen because frequency distributions for process executions and system calls are heavily skewed: a small number of binaries and syscalls dominate, while the long tail is sparse. A linear threshold would either miss rare-but-legitimate events or drown the output in false positives. The log denominator compresses the frequent end of the distribution and amplifies the sparse tail.

## Learning phase

The behavioral pipeline includes a configurable learning phase during which events are used to build the frequency baseline but anomaly alerts are suppressed. This prevents the startup burst of common activity from being flagged before the baseline has stabilised.

After the learning phase ends, new events are both scored and added to the baseline, so the model continues to update as workspace activity evolves. There is no forgetting mechanism — the baseline grows monotonically over the lifetime of the Worktrace process.

## Limitations in development environments

Frequency-based novelty detection is inherently challenged by cloud development environments. Unlike production workloads — where process and syscall diversity is narrow and predictable — workspaces are used for package installation, build system execution, IDE tooling, and arbitrary development scripts. This genuine diversity produces a high rate of false positives that cannot be eliminated by threshold tuning alone.

Evaluation on a production cluster showed that process name normalization (stripping high-entropy binary name suffixes via regex) reduced the alert rate by 80%, but remaining alerts were still exclusively false positives from legitimate tool diversity.

More sophisticated approaches — sequence-aware models, in-kernel eBPF-based behavioral profiling, or workspace-specific baselines — would be necessary for the behavioral pipeline to provide practical utility in a CDE context. The rule-based and correlation pipelines remain the primary detection mechanism.
