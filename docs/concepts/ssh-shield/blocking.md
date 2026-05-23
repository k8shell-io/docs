---
sidebar_position: 1
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# IP Blocking

SSH Shield detects malicious IPs from the failed authentication event stream and blocks them by adding them to an `nftables` set. Entries in the set expire automatically — no manual cleanup is required.

:::info
`nftables` is a Linux kernel subsystem, so SSH Shield must run on a Linux host that has direct access to the entry point firewall. Cloud-managed firewall APIs (AWS Security Groups, GCP Firewall Rules, Azure NSGs) are not yet supported — see the [roadmap](/roadmap#integrations).
:::

## nftables integration

SSH Shield does not manage the `nftables` table itself at runtime — the table, chains, and set must exist before SSH Shield starts. SSH Shield connects to the `nftables` kernel API and writes entries directly into a named IPv4 set on the entry point host.

The expected table structure has two filter chains — `input` and `forward` — each with a single drop rule that matches packets whose source address is in the blocked set:

```
table ip <table_name> {
    set <set_name> {
        type ipv4_addr
        flags timeout
    }
    chain input {
        type filter hook input priority -1
        ip saddr @<set_name> drop
    }
    chain forward {
        type filter hook forward priority -1
        ip saddr @<set_name> drop
    }
}
```

SSH Shield can create this structure on first run using the `--recreate-table` flag, which is useful for initial setup or when the table needs to be reset.

:::info
Only IPv4 is supported. IPv6 addresses are logged as warnings and skipped.
:::

## Detection: sliding window

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

Bans are implemented as `nftables` set entries with a `timeout` equal to the ban duration. The kernel removes the entry automatically when the timeout expires.

## Whitelist

Failure events from IPs matching any CIDR in the configured whitelist are silently discarded before the hit counter is consulted. Whitelisted IPs are never banned regardless of failure volume.

```yaml
blocker:
  whitelist:
    - 10.0.0.0/8
    - 192.168.0.0/16
```

## Event log

Each failure event received from NATS can be written to a structured JSON log file for audit purposes. The log rotates automatically based on configured size and age limits. The event record includes the client IP, attempted username, authentication method, and failure reason.

```yaml
eventLog:
  enabled: true
  filename: /var/log/ssh-shield/events.log
  maxSize: 100      # MB before rotation
  maxBackups: 5
  maxAge: 30        # days
  compress: true
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
