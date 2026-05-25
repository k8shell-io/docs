---
sidebar_position: 3
title: nfgate
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# nfgate

`nfgate` is a lightweight gRPC daemon that manages `nftables` firewall rules on a Linux host. It is the on-premises firewall plugin used by SSH Shield — SSH Shield calls nfgate's API to block and query IPs, and nfgate translates those calls into `nftables` set operations on the host.

## How it works

nfgate exposes a gRPC service (`BlockerService`) that accepts block and query requests over the network. On the host it manages a named `nftables` table containing IPv4 and IPv6 sets. When SSH Shield bans an IP, it calls `BlockIP` with the IP address and ban duration; nfgate adds the IP to the appropriate set with a matching `timeout`. The kernel removes the entry automatically when the timeout expires.

nfgate does not own the `nftables` table structure — the table, chains, and sets must be created before nfgate starts. See [nfgate plugin](./blocking.md#nfgate-plugin) for the expected table layout.

## gRPC API

The API defines a `BlockerService` that exposes two RPCs:

- **`BlockIP`** — adds an IP to the block set for a given duration. 
- **`IsBlocked`** — checks whether an IP is currently in the block set.

## Configuration

nfgate is configured via a YAML file passed as a command-line argument at startup.

### server

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
    - "gRPC listen address (e.g. \`0.0.0.0:9090\`)."
  - - "\`authKey\`"
    - "—"
    - "Pre-shared key clients must supply as \`Authorization: Bearer <key>\`. Leave empty to disable authentication."
`} />

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
    - "Name of the \`nftables\` table nfgate manages."
  - - "\`setNameV4\`"
    - "required"
    - "Name of the IPv4 set within the table."
  - - "\`setNameV6\`"
    - "required"
    - "Name of the IPv6 set within the table (reserved — IPv6 blocking is not yet implemented)."
  - - "\`checkBeforeBlock\`"
    - "\`false\`"
    - "When \`true\`, nfgate checks whether the IP is already in the set before adding it. Avoids duplicate-entry errors at the cost of an extra kernel round-trip per ban."
`} />

The table, chains, and sets referenced by `tableName`, `setNameV4`, and `setNameV6` must exist on the host before nfgate starts. The expected structure is:

```
table ip <tableName> {
    set <setNameV4> {
        type ipv4_addr
        flags timeout
    }
    chain input {
        type filter hook input priority -1
        ip saddr @<setNameV4> drop
    }
    chain forward {
        type filter hook forward priority -1
        ip saddr @<setNameV4> drop
    }
}
```

:::info
Run `nfgate setup` to create this structure automatically based on the configured table and set names.
:::
