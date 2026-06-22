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
    - "Detection policy, ban schedule, and memory management. See [Blocker](#blocker)."
  - - "\`stateStore\`"
    - "Per-IP rate-limit state store. See [State store](#state-store)."
  - - "\`plugins\`"
    - "List of firewall plugins used to enforce blocks. See [Plugins](#plugins)."
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
    - "NATS subject SSH Shield subscribes to for failure events. Must match the subject configured on the [SSH Proxy](/architecture/ssh-proxy/ip-protection#publishing-failed-auth-attempts)."
`} />

## Blocker

The `blocker` block controls the sliding-window detection policy, the ban schedule, and memory management. See [IP Blocking](./blocking.md) for a full description of how these settings interact at runtime.

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

## State store

Controls where per-IP rate-limit state is held. See [State store](./blocking.md#state-store) for a description of the two modes.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`type\`"
    - "\`memory\`"
    - "State store type. \`memory\` keeps state in-process; \`nats-kv\` stores state in a NATS JetStream KV bucket shared across all instances."
  - - "\`bucket\`"
    - "—"
    - "JetStream KV bucket name. Required when \`type\` is \`nats-kv\`. Created automatically if it does not exist."
`} />

## Plugins

Each entry in the `plugins` list activates a firewall plugin. All listed plugins receive every block decision. SSH Shield currently supports the `nfgate` plugin type; cloud provider plugins are on the roadmap. See [Firewall plugins](./blocking.md#firewall-plugins).

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`type\`"
    - "required"
    - "Plugin type. Currently \`nfgate\` is the only supported value."
  - - "\`configFile\`"
    - "required"
    - "Path to the plugin-specific configuration file. Relative paths are resolved from the main config file directory."
`} />

### nfgate plugin configuration

The nfgate plugin configuration file is referenced by `configFile` in the plugins list.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`address\`"
    - "required"
    - "Address of the nfgate gRPC endpoint (e.g. \`localhost:9090\`)."
  - - "\`tls\`"
    - "\`false\`"
    - "Enable TLS on the gRPC connection."
  - - "\`certFile\`"
    - "—"
    - "Path to the CA certificate file used to verify the nfgate server when TLS is enabled."
  - - "\`dialTimeout\`"
    - "—"
    - "Maximum time to wait when dialing the gRPC endpoint. Accepts Go duration strings (e.g. \`5s\`)."
  - - "\`authKey\`"
    - "—"
    - "Shared secret sent as \`Authorization: Bearer <key>\` in every gRPC call. Must match the \`authKey\` configured on the nfgate server."
`} />