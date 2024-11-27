
# k8shell workspace

```{abstract}
A K8shell workspace is a Kubernetes Pod offering you a development environment with standard tools and protocols.
```

A workspace is a dedicated resource for a single user. It is dynamically created by the k8shell proxy when the user connects to the system. It is based on a blueprint defining access and resource requirements and may consist of one or more containers. The workspace provides shell, SFTP, port-forwarding, and agent-forwarding capabilities while remaining isolated with its own network namespace, filesystem, and process space. It can also enable Docker functionality and access to private registries. Depending on the configuration, the workspace can be ephemeral, automatically destroyed upon disconnection, or preserved for an extended period. 

## Workspace provisioning

Workspace provisioning is initiated by the k8shell proxy based on the user requesting an access to the workspace (see [SSH Channel Flow](communication.md#ssh-channel-flow) for more details). K8shell proxy uses the workspace blueprint that the user requests access to. The blueprint defines the Helm chart and configuration values needed to deploy the workspace, including container images, resource requirements, initialization scripts, storage, middleware (e.g., VSCode or IntelliJ detection plugins), and access permissions. Workspaces can also be configured to support Docker, allowing users to build, run, and manage containers while accessing private container registries. Provisioning typically takes 4-6 seconds, depending on the container image size and initialization script complexity.

The workspace provisioning process involves the following steps:

1. **Instantiation of the Workspace Blueprint:** The k8shell proxy processes the workspace blueprint for the user requesting access. This step generates user-specific values such as username, read/write permissions, and workspace name. The k8shell proxy uses a templating mechanism with CEL expressions to dynamically generate these values based on user data.

2. **Helm Chart Installation:** The Helm chart, containing the Kubernetes resources that define the workspace, is installed in the specified Kubernetes namespace. These resources include the workspace pod with requested container definitions, service account, persistent volume claims, initialization scripts, access token for the k8shell proxy API, and other necessary components. The Helm client communicates with the Kubernetes API server to deploy the chart and create the required resources, including storage, networking, and containers.

3. **Initilization of containers:** When the workspace pod is created, the containers are initialized. There two main initialization processes, k8shell-main initialization and k8shell-dind initialization. See [Workspace containers](#workspace-containers) for more details.

```{note}
Workspace blueprints allow you to define any storage class available in the cluster. However, k8shell services provide a CSI storage driver for creating persistent volumes on a ZFS storage server. See [Storage architecture](storage.md) for more details.
```

## Workspace containers 

The provisioning process creates one to three of containers within the workspace pod, each serving a specific purpose. They support various K8shell operations, they share a network namespace but have separate process namespaces. The containers are interconnected through shared `emptyDir` volume, shared network namespace, unix socket, and persistent storage.

The diagram below shows the containers and their integration. 

```{eval-rst}
.. gdrawing:: 1l46s0YZWikxWQoM0UYQaDV3e2zGQYFiOoeKlbKemz6I
```


### k8shell-main

The k8shell-main container serves as the primary component of the workspace pod, facilitating shell access, port forwarding, and SFTP streams. It uses a specialized container image tailored to the tasks users perform within the workspace. When the workspace is provisioned, the k8shell-main container executes initialization scripts defined in the workspace blueprint. These scripts run during the Pod’s start lifecycle event and can include tasks such as configuring the user environment (e.g., Git settings, shell aliases) and installing packages for specific programming environments. To optimize provisioning time, scripts can also be configured to run in the background, ensuring they don’t delay workspace readiness.

The main container provides the following functions:

1. **SSH channels**: Users can connect to the workspace via various SSH channels. The k8shell-proxy manages the SSH connection, forwarding input and output streams between the user and the container within the channel. There are [shell](communication.md), [exec](communication.md), and [port-forwarding](communication.md#port-forwarding) channels supported by k8shell-proxy. 

2. **SSH agent forwarding:** When the agent-forwarding is requested on the SSH connection, the k8shell proxy forwards the agent stream to the unix socket shared with the k8shell-admin container. The main container uses the agent stream to authenticate with third-party services that require host keys. See [Agent forwarding](communication.md#agent-forwarding) for more details.

4. **SFTP subsystem**: Enables the file transfer via SFTP server. When the SFTP subsystem is requested by the client on the SSH connection, the k8shell proxy forwards input and output streams to the sftp server. The server is either provided by the k8shell-main container or k8shell-proxy uses internal server implementation if the container image lacks an SFTP server. See [SFTP subsystem](communication.md) for more details.

5. **Persistent storage**: Users can store data on the persistent volumes. These volumes can include shared storage accessible to other workspaces.

The k8shell-main container also may use logging service provided by k8shell-admin container and local DNS provided by k8shell-dind container. See [k8shell-admin](#k8shell-admin) and [k8shell-dind](#k8shell-dind) for more details. 

### k8shell-admin

The container is used for administration purposes. The init process of the admin container is the logger that provides a logging service that redirects the log to stdout which in turn appears in the admin container log. 

The k8shell-proxy also uses the admin container to create the agent forwarding stream to a unix socket. The unix socket is shared with the main container via `emptyDir` and is used for ssh agent forwarding when host keys are required for authentication with a third-party remote system (such as git or remote ssh server). 

### k8shell-dind

The docker container that runs `dockerd` from the dind image (docker-in-docker). It uses the unix socket that is shared with the main container and that the docker cli uses to connect to. 

There is `localdns` service that does the following (see #10 for more details.)
- It modifies the `/etc/resolv.conf` file by changing the `nameserver` to `127.0.0.53`,
- It runs `dnsmasq` service listening on `127.0.0.53` address. 
- It uses the original nameserver as the upstream server where unresolvable queries are redirected to. 
- It listens on events from docker daemon and adds all DNS names from each container to the DNS. The DNS names are retrieved from `NetworkSettings.Networks.<network_name>.DNSNames` field of the container manifest.

## Networking

All containers in the workspace share the same network namespace, but they have separated PID namespaces. It is thus possible that `k8shell-dind` container starts a process in its own PID namespace, for example `dnsmasq`, and processes running in `k8shell-main` container's PID namespace can connect to it, for example, by resolving names to IPs on `127.0.0.53:53`. 

Docker daemon running in `dind-container` by default creates a bridge network in which it starts docker containers. The bridge network is available to all workspace containers so they can access their IPs. The `localdns` service maps names from the container manifest to their IPs so that they are directly accessible from `k8shell-main` container. 

## Docker support

TODO

## K8shell services

TODO: API
