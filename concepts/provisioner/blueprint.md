---
sidebar_position: 1
---

# Blueprint

A blueprint is the configuration template from which workspaces are provisioned. It describes everything the Provisioner needs to create a workspace: the container image, compute resources, network policy, persistent volumes, environment variables, and optional services. Blueprints are organized into [inheritance hierarchies](blueprint-manager.md#inheritance-resolution) and can be composed layer by layer, allowing common configuration to be defined once and reused across many concrete blueprints.

## Platform blueprint fields

Platform blueprints are created by platform administrators. A platform blueprint can be *concrete* — directly selectable by users — or a *template* (`isTemplate: true`), which exists only to be inherited from and cannot be provisioned directly. The platform blueprint defines following fields. 

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Type
    width: 85px
  - header: Description
rows:
  - - "\`name\`"
    - string
    - "Required. Unique name, 1–40 characters."
  - - "\`description\`"
    - string
    - "Optional description, max 500 characters."
  - - "\`isTemplate\`"
    - bool
    - "Marks as a base template; cannot be provisioned directly. Default: \`false\`."
  - - "\`template\`"
    - string
    - "Parent blueprint name to inherit from."
  - - "\`splash\`"
    - string
    - "Login banner shown at SSH connect. Supports Go template variables."
  - - "\`image\`"
    - string
    - "Required. Workspace container image."

  - - "\`imagePullPolicy\`"
    - string
    - "Image pull policy: \`Always\`, \`Never\`, or \`IfNotPresent\`. Default: \`IfNotPresent\`."
  - - "\`hostname\`"
    - string
    - "Pod hostname. Supports CEL expressions."
  - - "\`subdomain\`"
    - string
    - "Pod subdomain. Supports CEL expressions."
  - - "\`k8shelld\`"
    - object
    - "k8shelld daemon configuration. See [k8shelld](#k8shelld)."
  - - "\`env\`"
    - map
    - "Environment variables injected into the workspace container."
  - - "\`network\`"
    - object
    - "Network policy configuration. See [Network](#network)."
  - - "\`resources\`"
    - object
    - "CPU and memory limits. Default: \`500m\` / \`512Mi\`. See [Resources](#resources)."
  - - "\`podman\`"
    - object
    - "Podman sidecar configuration. See [Podman](#podman)."
  - - "\`storages\`"
    - map
    - "Named storage volumes. See [Storage](#storage)."
  - - "\`initScripts\`"
    - list
    - "Init scripts run on first workspace start. See [Init scripts](#init-scripts)."
  - - "\`securityContext\`"
    - object
    - "Kubernetes SecurityContext for the workspace container."
  - - "\`extFiles\`"
    - map
    - "External files to mount into the workspace container."
  - - "\`enableApps\`"
    - bool
    - "Enable in-workspace app management. Default: \`false\`."
  - - "\`apps\`"
    - map
    - "In-workspace app definitions. See [Apps](#apps)."
`} />

## Custom blueprint fields

Custom blueprints are defined by developers in a `.k8shell.yaml` file at the root of their repository. A custom blueprint always references a platform blueprint as its parent via the `template` field and can override or extend a subset of its settings without requiring admin access. Custom blueprint defines following fileds.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Type
    width: 85px
  - header: Description
rows:
  - - "\`template\`"
    - string
    - "Required. Platform blueprint to inherit from."
  - - "\`name\`"
    - string
    - "Optional name override."
  - - "\`splash\`"
    - string
    - "Login banner override."
  - - "\`image\`"
    - string
    - "Container image override."
  - - "\`env\`"
    - map
    - "Environment variables (merged with parent)."
  - - "\`network\`"
    - object
    - "Network policy overrides. See [Network](#network)."
  - - "\`resources\`"
    - object
    - "Resource limit overrides. See [Resources](#resources)."
  - - "\`storages\`"
    - map
    - "Storage volume additions or overrides. See [Storage](#storage)."
  - - "\`initScripts\`"
    - list
    - "Init scripts (appended to parent list). See [Init scripts](#init-scripts)."
  - - "\`enableApps\`"
    - bool
    - "Enable app management."
  - - "\`apps\`"
    - map
    - "App definitions. See [Apps](#apps)."
`} />

:::info
The division between platform and custom blueprint fields is deliberate. Fields that control security-sensitive configuration — such as Linux capabilities, security contexts, and k8shelld settings — are only available to platform administrators. Custom blueprints are intentionally limited to workload-level concerns, ensuring that developer-defined blueprints cannot circumvent platform security policy.
::: 

## k8shelld

Configuration for the `k8shelld` daemon container injected into the workspace pod.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Type
    width: 85px
  - header: Description
rows:
  - - "\`image\`"
    - string
    - "Required. k8shelld container image."
  - - "\`imagePullPolicy\`"
    - string
    - "Image pull policy: \`Always\`, \`Never\`, or \`IfNotPresent\`."
  - - "\`ignoreOrphans\`"
    - list
    - "Process names that k8shelld should not treat as orphans."
  - - "\`connection.allowAnyNS\`"
    - bool
    - "Allow connections from any namespace."
  - - "\`connection.allowAnySA\`"
    - bool
    - "Allow connections from any service account."
`} />

## Resources

CPU and memory limits applied to a container.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Type
    width: 85px
  - header: Description
rows:
  - - "\`cpu\`"
    - string
    - "Required. CPU limit (e.g. \`500m\`, \`2\`)."
  - - "\`memory\`"
    - string
    - "Required. Memory limit (e.g. \`512Mi\`, \`4Gi\`)."
`} />

## Network

Network policy for the workspace pod.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Type
    width: 120px
  - header: Description
rows:
  - - "\`networkPolicyClass\`"
    - string
    - "Predefined policy class: \`workspace\`, \`system\`, \`isolated\`, \`user\`, or \`organization\`. Default: \`workspace\`."
  - - "\`allowEgressToCIDRs\`"
    - list
    - "CIDR ranges to permit outbound traffic to."
  - - "\`allowEgressToPods\`"
    - list
    - "Pod label selectors to permit outbound traffic to."
`} />

## Storage

Named storage volumes mounted into the workspace container. Each entry in the `storages` map is keyed by a logical name.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Type
    width: 85px
  - header: Description
rows:
  - - "\`enabled\`"
    - bool
    - "Whether this storage is active."
  - - "\`id\`"
    - string
    - "Alphanumeric identifier used for the underlying PVC or volume name."
  - - "\`type\`"
    - string
    - "Storage type: \`local\`, \`shared\`, \`emptyDir\`, or \`memory\`. Default: \`local\`."
  - - "\`path\`"
    - string
    - "Mount path inside the container. Must start with \`/\`. Supports CEL expressions."
  - - "\`readonly\`"
    - bool
    - "Mount as read-only. Default: \`false\`."
  - - "\`sizeLimit\`"
    - string
    - "Size limit for \`emptyDir\` and \`memory\` types (Kubernetes resource quantity)."
  - - "\`existingClaim\`"
    - string
    - "Required for \`shared\` type. Name of an existing PVC to mount."
  - - "\`fsOwnerUid\`"
    - int
    - "UID for fsGroup volume ownership fix-up."
  - - "\`fsOwnerGid\`"
    - int
    - "GID for fsGroup volume ownership fix-up."
  - - "\`claimSpec\`"
    - object
    - "Full Kubernetes [PersistentVolumeClaimSpec](https://kubernetes.io/docs/reference/kubernetes-api/config-and-storage-resources/persistent-volume-claim-v1/#PersistentVolumeClaimSpec) for provisioned volumes."
  - - "\`claimSpecAnnotations\`"
    - map
    - "Annotations added to the generated PVC."
`} />

## Podman

Configuration for the optional Podman sidecar that enables Docker-in-Docker workloads.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Type
    width: 85px
  - header: Description
rows:
  - - "\`enabled\`"
    - bool
    - "Enable the Podman sidecar. Default: \`false\`."
  - - "\`image\`"
    - string
    - "Podman container image. Required when enabled."
  - - "\`resources\`"
    - object
    - "CPU and memory limits for the Podman container. Default: \`500m\` / \`512Mi\`."
  - - "\`createDockerSockSymlink\`"
    - bool
    - "Create a \`/var/run/docker.sock\` symlink pointing to the Podman socket. Default: \`false\`."
  - - "\`parentStorages\`"
    - bool
    - "Mount workspace storages into the Podman container. Default: \`true\`."
  - - "\`extFiles\`"
    - map
    - "Extra files to mount into the Podman container."
  - - "\`storages\`"
    - map
    - "Podman-specific storage volumes."
  - - "\`securityContext\`"
    - object
    - "Kubernetes SecurityContext for the Podman container."
`} />

## Init scripts

A list of named shell scripts that run once on the first workspace start.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Type
    width: 85px
  - header: Description
rows:
  - - "\`name\`"
    - string
    - "Required. Unique script name."
  - - "\`script\`"
    - string
    - "Required. Shell script content."
`} />

## Apps

In-workspace apps are lightweight services managed by `k8shelld`. Each entry in the `apps` map is keyed by a logical name.

<StandardInlineTable data={`
columns:
  - header: Field
    width: 220px
  - header: Type
    width: 85px
  - header: Description
rows:
  - - "\`name\`"
    - string
    - "Display name. Required when enabled."
  - - "\`enabled\`"
    - bool
    - "Whether this app is active. Default: \`false\`."
  - - "\`binary\`"
    - string
    - "Path to the app binary. Required when enabled."
  - - "\`versionCmd\`"
    - list
    - "Command to check the installed version."
  - - "\`versionRegex\`"
    - string
    - "Regex to extract the version string from \`versionCmd\` output."
  - - "\`install\`"
    - string
    - "Shell command to install the app if not present."
  - - "\`start\`"
    - list
    - "Command to start the app. Required when enabled."
  - - "\`listen\`"
    - int
    - "Port the app listens on."
  - - "\`restartPolicy\`"
    - string
    - "Restart policy: \`always\`, \`on-failure\`, or \`never\`."
  - - "\`maxRestartBackoff\`"
    - duration
    - "Maximum backoff duration between restart attempts."
  - - "\`installAsRoot\`"
    - bool
    - "Run the install command as root. Default: \`false\`."
  - - "\`autoStart\`"
    - bool
    - "Start the app automatically when the workspace starts. Default: \`false\`."
  - - "\`protocol\`"
    - string
    - "App protocol: \`http\`, \`https\`, \`ws\`, \`wss\`, \`tcp\`, or \`udp\`."
`} />
