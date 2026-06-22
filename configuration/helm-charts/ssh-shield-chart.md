---
sidebar_position: 5
title: SSH Shield Chart
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# SSH Shield Chart

The `ssh-shield` Helm chart deploys the SSH Shield service, which protects the k8shell SSH entry point from brute-force attacks by monitoring authentication failures published over NATS and blocking offending IP addresses at the firewall level. For more details see [SSH Shield](/architecture/ssh-shield).

## Configuration reference

The sections below document every parameter accepted by the chart's `values.yaml`. All parameters are optional unless noted otherwise. The `imageRegistry` field and secret-valued parameters are documented on the [Common Fields](./common-fields) page.

### Top-level

<StandardInlineTable data={`
columns:
  - header: Parameter
    width: 220px
  - header: Description
rows:
  - - "\`replicas\`"
    - "Number of pod replicas. Default: \`1\`"
  - - "\`image.repository\`"
    - "Container image repository. Default: \`ghcr.io/k8shell-io/ssh-shield\`"
  - - "\`image.tag\`"
    - "Container image tag. Default: \`v0.12.1\`"
  - - "\`imageRegistry\`"
    - "Private container registry for image pulls. See [imageRegistry](./common-fields#imageregistry)."
  - - "\`nats\`"
    - "NATS connection and failure event subscription. See [nats](#nats)."
  - - "\`blocker\`"
    - "IP blocking policy and escalation schedule. See [blocker](#blocker)."
  - - "\`stateStore\`"
    - "Backend used to store per-IP rate-limit state. See [stateStore](#statestore)."
  - - "\`plugins\`"
    - "Firewall plugin configuration. See [plugins](#plugins)."
`} />

### nats

NATS connection used to subscribe to SSH failure events.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`host\`"
    - "NATS server hostname. Default: \`nats\`"
  - - "\`port\`"
    - "NATS server port. Default: \`4222\`"
  - - "\`user\`"
    - "NATS username. Default: \`sshshield\`"
  - - "\`password\`"
    - "NATS password. See [secret fields](./common-fields#secret-fields)."
  - - "\`sshFailures.subject\`"
    - "NATS subject to subscribe to for SSH failure events. Must match \`sshProxy.publishSshFailures.subject\` in the k8shell chart. Default: \`ssh.failures\`"
`} />

### blocker

Policy for tracking and banning offending IP addresses.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`window\`"
    - "Sliding time window over which failures from the same IP are counted. Default: \`5m\`"
  - - "\`threshold\`"
    - "Number of failures within the window required to trigger a ban. Default: \`4\`"
  - - "\`decreasingThreshold\`"
    - "If \`true\`, the threshold decreases with each successive strike, making repeat offenders easier to ban. Default: \`true\`"
  - - "\`idleCleanup\`"
    - "How long to retain state for an IP that has produced no new failures. Default: \`12h\`"
  - - "\`banSchedule\`"
    - "Ordered list of ban durations applied on each successive strike. The last entry is reused for any further strikes. Default: \`[1m, 5m, 15m, 1h, 6h, 24h, 72h]\`"
  - - "\`maxIPState\`"
    - "Maximum number of IP entries kept in state. Oldest entries are evicted when the limit is reached. Default: \`100000\`"
  - - "\`gcInterval\`"
    - "How often the garbage collector runs to evict expired state entries. Default: \`10m\`"
  - - "\`whitelist\`"
    - "List of CIDR ranges that are never banned. Default: \`[]\`"
`} />

### stateStore

Backend used to persist per-IP rate-limit state.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 120px
  - header: Description
rows:
  - - "\`type\`"
    - "Storage backend. \`memory\` keeps state in-process (not shared across replicas); \`nats-kv\` stores state in a NATS JetStream KV bucket (shared across all replicas). Default: \`nats-kv\`"
  - - "\`bucket\`"
    - "Name of the NATS JetStream KV bucket (used when \`type\` is \`nats-kv\`). Default: \`ssh-shield-state\`"
`} />

### plugins

Map of firewall plugin configurations keyed by plugin type. Each entry is rendered into a dedicated ConfigMap and mounted into the pod at `/app/config/plugins/{type}.yaml`.

#### plugins.nfgate

The `nfgate` plugin delegates IP blocking to an [nfgate](/architecture/ssh-shield/nfgate) service, which installs rules directly into an `nftables` set on the Linux host.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`address\`"
    - "gRPC endpoint address of the nfgate sidecar. Default: \`localhost:9090\`"
  - - "\`tls\`"
    - "Enable TLS on the gRPC connection to nfgate. Default: \`false\`"
  - - "\`dialTimeout\`"
    - "Maximum time to wait when dialing the nfgate gRPC endpoint. Default: \`5s\`"
  - - "\`authKey\`"
    - "Shared secret sent as \`Authorization: Bearer <key>\` in every gRPC call. Must match the \`authKey\` configured on the nfgate server. Accepts \`value\`, \`secretName\`/\`secretKey\`. Default: \`{}\`"
`} />
