---
sidebar_position: 2
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Configuration

SSH Shield is configured via a YAML file. The path is passed as a command-line argument at startup. String values support `${ENV_VAR}` substitution and `!file <path>` directives that load the value from a file on disk.

### Top-level fields

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Description
rows:
  - - "\`nats\`"
    - "NATS connection and subject configuration. See [NATS](#nats)."
  - - "\`blocker\`"
    - "Detection and nftables blocking configuration. See [Blocker](#blocker)."
  - - "\`eventLog\`"
    - "JSONL event log for persisting failure events to disk. See [Event log](#event-log)."
`} />

## NATS

SSH Shield subscribes to the failure event stream published by the SSH Proxy.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`host\`"
    - "required"
    - "NATS server hostname. Supports \`\${ENV_VAR}\` substitution."
  - - "\`port\`"
    - "\`4222\`"
    - "NATS server port."
  - - "\`user\`"
    - "—"
    - "NATS username."
  - - "\`password\`"
    - "—"
    - "NATS password. Use \`!file <path>\` to load from a mounted secret."
  - - "\`sshFailures.subject\`"
    - "\`ssh.failures\`"
    - "NATS subject SSH Shield subscribes to for failure events. Must match the subject configured on the [SSH Proxy](/concepts/ssh-proxy/ip-protection#publishing-failed-auth-attempts)."
`} />

## Blocker

The `blocker` block controls nftables integration, the sliding-window detection policy, the ban schedule, and memory management. See [IP Blocking](./blocking.md) for a full description of how these settings interact at runtime.

### nftables

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`tableName\`"
    - "required"
    - "Name of the nftables table SSH Shield writes blocked IPs into."
  - - "\`setNameV4\`"
    - "required"
    - "Name of the IPv4 set inside the table. Blocked IPs are added here with a timeout."
  - - "\`setNameV6\`"
    - "required"
    - "Name of the IPv6 set (reserved for future use — IPv6 blocking is not yet implemented)."
  - - "\`checkRuleExists\`"
    - "\`false\`"
    - "When \`true\`, SSH Shield checks whether the IP is already in the set before adding it. Adds a kernel round-trip per ban; useful for debugging but not needed in normal operation."
`} />

### Detection

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`window\`"
    - "required"
    - "Sliding time window for counting failures per IP. Accepts Go duration strings (e.g. \`5m\`, \`1h\`). Failures older than this are discarded."
  - - "\`threshold\`"
    - "required"
    - "Number of failures within \`window\` that triggers a ban."
  - - "\`decreasingThreshold\`"
    - "\`false\`"
    - "When \`true\`, each ban reduces the threshold for that IP by one (minimum one). Repeat offenders are banned faster with each cycle. See [Strike-based ban schedule](./blocking.md#strike-based-ban-schedule)."
  - - "\`banSchedule\`"
    - "required"
    - "List of ban durations indexed by strike count. The first entry applies on first ban, the last entry is reused once all slots are exhausted. Example: \`[1m, 5m, 15m, 1h, 6h, 24h, 72h]\`."
  - - "\`whitelist\`"
    - "—"
    - "List of CIDR ranges that are never banned. Failure events from whitelisted IPs are discarded before the hit counter is consulted. See [Whitelist](./blocking.md#whitelist)."
`} />

### Memory management

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`gcInterval\`"
    - "—"
    - "How often the garbage collection routine runs. GC is disabled when omitted or zero."
  - - "\`idleCleanup\`"
    - "—"
    - "Removes in-memory state for IPs not seen within this duration. Applied each GC cycle."
  - - "\`maxIPState\`"
    - "\`0\`"
    - "Hard cap on the number of IP states held in memory. When the cap is exceeded, the oldest entries by last-seen time are evicted. \`0\` means unlimited."
`} />

## Event log

When enabled, every failure event received from NATS is appended as a JSON line to the configured file. The log rotates automatically based on size and age.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`enabled\`"
    - "\`false\`"
    - "Enable event logging."
  - - "\`filename\`"
    - "required"
    - "Path to the log file. Relative paths are resolved from the config file directory."
  - - "\`maxSize\`"
    - "\`100\`"
    - "Maximum file size in megabytes before rotation."
  - - "\`maxBackups\`"
    - "\`0\`"
    - "Number of rotated files to retain. \`0\` retains all."
  - - "\`maxAge\`"
    - "\`0\`"
    - "Maximum age in days for rotated files. \`0\` disables age-based deletion."
  - - "\`compress\`"
    - "\`false\`"
    - "Compress rotated files with gzip."
`} />
