---
sidebar_position: 10
title: Common Fields
---

import StandardInlineTable from '@site/src/components/StandardInlineTable';

# Common Fields

The following sections describe parameters that appear across multiple k8shell Helm charts. Each chart that supports these parameters uses the same field names and semantics.

## imageRegistry

Private container registry to pull service images. When configured, the chart creates an image pull secret (`regcred`) for all pods.

<StandardInlineTable data={`
columns:
  - header: Parameter
    width: 220px
  - header: Description
rows:
  - - "\`host\`"
    - 'Hostname of a private container registry. Used to create an image pull secret (\`regcred\`) for all pods. Default: \`""\`'
  - - "\`username\`"
    - 'Username for the private registry. Set either this with \`password\`, or \`existingSecret\`. Default: \`""\`'
  - - "\`password\`"
    - 'Password for the private registry. Default: \`""\`'
  - - "\`existingSecret\`"
    - 'Name of a pre-existing Kubernetes pull-secret to use instead of creating one from \`username\`/\`password\`. Default: \`""\`'
`} />

## certManager

TLS certificate issuance via [cert-manager](https://cert-manager.io). When disabled, services communicate over plaintext.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable cert-manager integration. Requires cert-manager to be installed and a ClusterIssuer configured. Default: \`false\`"
  - - "\`issuer.name\`"
    - "Name of the cert-manager Issuer or ClusterIssuer to use. Default: \`vault-root-issuer\`"
  - - "\`issuer.kind\`"
    - "Kind of the issuer resource. One of \`Issuer\` or \`ClusterIssuer\`. Default: \`ClusterIssuer\`"
  - - "\`duration\`"
    - "Requested certificate lifetime. Default: \`24h\`"
  - - "\`renewBefore\`"
    - "How far ahead of expiry cert-manager will attempt renewal. Default: \`12h\`"
`} />

## postgresql

PostgreSQL backend used by various services. They share the same database but each use different schema. 

<StandardInlineTable data={`
columns:
  - header: Field
    width: 120px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable PostgreSQL integration. Default: \`false\`"
  - - "\`host\`"
    - "PostgreSQL hostname. Default: \`postgresql\`"
  - - "\`port\`"
    - "PostgreSQL port. Default: \`5432\`"
  - - "\`database\`"
    - 'Database name. Default: \`""\`'
  - - "\`username\`"
    - "Database username. Accepts \`value\`, \`secretName\`/\`secretKey\`. Default: \`{}\`"
  - - "\`password\`"
    - "Database password. Accepts \`value\`, \`secretName\`/\`secretKey\`. Default: \`{}\`"
`} />

## nats

NATS message broker used for inter-service communication, KV storage or cache.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 120px
  - header: Description
rows:
  - - "\`enabled\`"
    - "Enable NATS integration. Default: \`false\`"
  - - "\`host\`"
    - "NATS server hostname. Default: \`nats\`"
  - - "\`port\`"
    - "NATS server port. Default: \`4222\`"
  - - "\`username\`"
    - "NATS username. Default: \`k8shell-service\`"
  - - "\`password\`"
    - "NATS password. Accepts \`value\`, \`secretName\`/\`secretKey\`. Default: \`{}\`"
`} />

## Secret fields

Unless otherwise noted, all secret-valued parameters accept a `secretRef` object instead of a plain string. There are two forms:

**Inline value** — set `value` to the literal secret. The chart will create a Kubernetes Secret containing that value. Useful for development and simple deployments.

```yaml
password:
  value: "my-password"
```

**External secret** — set `secretName` and `secretKey` to reference a pre-existing Kubernetes Secret. The chart will read the value from `secretName[secretKey]` at runtime without storing it in the chart's own Secret. This form is required when secrets are injected by an external secrets operator such as [HashiCorp Vault](https://www.vaultproject.io/) via the Vault Secrets Operator or External Secrets Operator, and is the mechanism used by the k8shell bundle chart.

```yaml
password:
  secretName: my-vault-synced-secret
  secretKey: password
```

**Fields**

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Description
rows:
  - - "\`value\`"
    - "The literal value. The chart creates a Kubernetes Secret containing this value."
  - - "\`secretName\`"
    - "Name of an existing Kubernetes Secret."
  - - "\`secretKey\`"
    - "Key within the existing Secret to read the value from."
`} />
