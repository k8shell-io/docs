---
sidebar_position: 3
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Configuration

The Session Service is configured via a YAML file. The path is passed as a command-line argument at startup. String values support `${ENV_VAR}` substitution and `!file <path>` directives that load the value from a file on disk.

:::info
In a standard k8shell deployment, configuration is managed alongside other k8shell services. This section provides a full reference of all configuration values.
:::

### Top-level fields

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Description
rows:
  - - "\`grpc\`"
    - "gRPC server configuration. See [gRPC](#grpc)."
  - - "\`db\`"
    - "PostgreSQL connection configuration. See [Database](#database)."
  - - "\`janitor\`"
    - "Stale-session reaper settings. See [Janitor](#janitor)."
  - - "\`recording\`"
    - "Session recording configuration. See [Recording](#recording)."
`} />

## gRPC

The Session Service exposes a gRPC server consumed by the SSH Proxy and the API Server.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`port\`"
    - "required"
    - "Port the gRPC server listens on."
  - - "\`authEnabled\`"
    - "\`false\`"
    - "Require JWT authentication on inbound gRPC calls."
  - - "\`audience\`"
    - "—"
    - "Expected JWT audience claim. Required when \`authEnabled\` is \`true\`."
  - - "\`allowed\`"
    - "—"
    - "List of allowed callers identified by Kubernetes service account and optional namespace. Each entry may specify \`serviceAccount\` and/or \`namespace\`."
`} />

## Database

The Session Service persists session records in PostgreSQL. See [Session Store](./session-store.md) for details on the schema and operations.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`enabled\`"
    - "\`true\`"
    - "Enable the database connection. When disabled, all session storage operations are no-ops."
  - - "\`hostname\`"
    - "required"
    - "PostgreSQL server hostname. Supports \`\${ENV_VAR}\` substitution."
  - - "\`port\`"
    - "required"
    - "PostgreSQL server port."
  - - "\`database\`"
    - "required"
    - "Database name."
  - - "\`username\`"
    - "required"
    - "Database username. Use \`!file <path>\` to load from a mounted secret."
  - - "\`password\`"
    - "required"
    - "Database password. Use \`!file <path>\` to load from a mounted secret."
`} />

## Janitor

The janitor ends sessions that stop sending upserts — for example when the SSH Proxy process is killed without cleanly closing the session. See [Session Store — Janitor](./session-store.md#janitor) for how the sweep works.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 160px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`ttl\`"
    - "\`5m\`"
    - "How long a session may go without an upsert before the janitor ends it."
  - - "\`interval\`"
    - "\`1m\`"
    - "How often the janitor sweep runs."
  - - "\`batchSize\`"
    - "\`100\`"
    - "Maximum number of sessions ended per sweep."
`} />

## Recording

Controls whether session content is recorded to disk and in which format. See [Recording](./recording.md) for details on stream types, file layout, and the PCAP shared-file model.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 180px
  - header: Default
    width: 100px
  - header: Description
rows:
  - - "\`enabled\`"
    - "\`false\`"
    - "Enable session recording. When disabled, all recording RPC calls return \`Unimplemented\`."
  - - "\`storagePath\`"
    - "required"
    - "Directory where recording files are written. Created on startup if it does not exist."
  - - "\`gzip\`"
    - "\`false\`"
    - "Compress recording files with gzip. Adds a \`.gz\` suffix to each file."
  - - "\`formats\`"
    - "—"
    - "Map of stream-type name to format name. Overrides the defaults (\`shell\`→\`asciinema\`, \`exec\`→\`asciinema\`). Valid format names: \`asciinema\`, \`pcap\`."
`} />
