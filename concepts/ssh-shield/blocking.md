---
sidebar_position: 1
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# IP Blocking

SSH Shield detects malicious IPs from the failed authentication event stream and evaluates them against the detection mechanisms described in this page. Once the decision to block an IP is made, SSH Shield delegates rule installation to a **firewall plugin**. The plugin abstraction decouples detection logic from the underlying firewall technology, allowing SSH Shield to work in both on-premises and cloud environments.

## Detection: sliding window

SSH Shield consumes failed authentication events from NATS. Each event is published by the SSH Proxy when an authentication attempt fails and has the following structure:

<StandardInlineTable data={`
columns:
  - header: Field
    width: 120px
  - header: Type
    width: 100px
  - header: Description
rows:
  - - "\`client_ip\`"
    - "string"
    - "IP address of the connecting client. Used as the key for all hit-counting and blocking decisions."
  - - "\`client_port\`"
    - "int"
    - "Source port of the connecting client."
  - - "\`username\`"
    - "string"
    - "Username supplied during the failed authentication attempt."
  - - "\`timestamp\`"
    - "string"
    - "RFC 3339 timestamp of the failure, as recorded by the SSH Proxy."
  - - "\`failure_info\`"
    - "[]string"
    - "List of failure reason strings from the SSH handshake (e.g. \`User is not onboarded and has no onboarding capability\`)."
  - - "\`proxy_id\`"
    - "string"
    - "Identifier of the SSH Proxy instance that published the event."
`} />

SSH Shield maintains an in-memory hit counter per IP address. On each failure event it:

1. Discards timestamps older than the configured `window` duration.
2. Appends the current timestamp.
3. If the number of timestamps within the window reaches `threshold`, the IP is banned and the timestamp list is cleared.

The window slides continuously — isolated failures that do not cluster within the window do not accumulate indefinitely.

## Strike-based ban schedule

Every time an IP is banned its strike count increments. The ban duration is taken from the `banSchedule` list at index `strike - 1`, clamping to the last entry once all slots are exhausted. This produces escalating bans for persistent offenders:

```yaml
banSchedule:
  - 5m    # first ban
  - 30m   # second ban
  - 2h    # third ban
  - 24h   # fourth and subsequent bans
```

When `decreasingThreshold` is enabled, each ban also reduces the threshold for that IP by one (minimum one), so repeat offenders are banned faster with each cycle.

The ban duration is passed to the firewall plugin as `duration_seconds`. For the nfgate plugin this maps to an `nftables` set entry timeout; the kernel removes the entry automatically when it expires.

## Whitelist

Failure events from IPs matching any CIDR in the configured whitelist are silently discarded before the hit counter is consulted. Whitelisted IPs are never banned regardless of failure volume.

```yaml
blocker:
  whitelist:
    - 10.0.0.0/8
    - 192.168.0.0/16
```

## Memory management

SSH Shield holds per-IP state in memory for the duration of the sliding window. Two settings bound memory growth:

<StandardInlineTable data={`
columns:
  - header: Field
    width: 200px
  - header: Description
rows:
  - - "\`gcInterval\`"
    - "How often the garbage collection routine runs."
  - - "\`idleCleanup\`"
    - "Removes state for IPs not seen within this duration."
  - - "\`maxIPState\`"
    - "Hard cap on the number of IP states held in memory. When exceeded, the oldest entries by last-seen time are evicted."
`} />

## Firewall plugins

### nfgate plugin

The `nfgate` plugin is used in on-premises setups. In this model, SSH traffic is routed through a Linux host before reaching SSH proxy. `nfgate` runs as a daemon on that Linux host and exposes a gRPC API and SSH Shield calls this API to install blocking rules. See [nfgate](./nfgate.md) for full details on the daemon, its API, and its configuration.

### Cloud provider plugin

:::info Roadmap
Cloud provider firewall plugins are on the roadmap. SSH Shield currently supports on-premises deployments via the nfgate plugin only.
:::

For cloud deployments, SSH Shield will use a cloud provider plugin that translates block decisions into managed firewall API calls (AWS Security Groups, GCP Firewall Rules, Azure NSGs), removing the need for a dedicated entry point host.
