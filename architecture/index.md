# Architecture

```{toctree}
:hidden:
operator
ssh-proxy
k8shelld
storage
communication
```

```{abstract}
K8shell is a platform that allows users to create, access and manage workspaces in a Kubernetes cluster using standard protocols. 
```

K8shell services are built on a microservices architecture, following Kubernetes deployment best practices. The following diagram illustrates the architecture of K8shell with its core components.

```{image} ../images/architecture.png
:width: 700px
:align: center
:alt: Diagram
```
The components of k8shell architecture are:

* **SSH Proxy** provides the secure shell (ssh) protocol interface, enabling clients to connect using standard SSH-based tools. It translates the ssh protocol into K8shell streaming API calls using GRPC provided by the *k8shelld*. It integrates with *k8shell Auth Services* and *k8shell operator* to manage the lifecycle of workspaces and their resources.

* **Auth Services** provide authentication and authorization services for K8shell. It integrates with external identity providers such as GitHub, GitLab, and OIDC to authenticate users and manage their access to workspaces. 

* **k8shelld** is the core component of the workspace running as PID 1 (init process). It provides the K8shell streaming API using GRPC for SSH channels and the SFTP subsystem. It initializes the workspace environment, including the creation of the workspace user and their permissions and provides internal interface for workspace operations via unix socket. 

* **API Server** is the REST API server that provides access to K8shell services. It allows users to create, manage, and access workspaces using standard HTTP/HTTPS protocols. 

* **Dashboard** is a web-based user interface that provides access to K8shell services. It integrates with the *API server* to provide a user-friendly interface for managing workspaces.

* **zfs-csi** is the container storage interface (CSI) driver for ZFS, which provides persistent storage for workspaces. The persistent volumes are seamlessly provisioned and managed by the *zfs-csi driver*, which allows for dynamic provisioning of ZFS datasets and snapshots. It integrates with the *ZFS API server* to manage the lifecycle of workspaces and their resources.

* **ZFS API Server** is a REST API server that provides access to ZFS datasets and snapshot on a host with ZFS storage. It is used to manage the lifecycle of workspaces and their resources, including the creation, deletion, and management of ZFS datasets and snapshot

* **Operator** is the K8shell Kubernetes operator that manages the lifecycle of workspaces and their resources. It monitors the state of workspaces and their resources and takes action to ensure that they are in the desired state. It integrates with the *State Manager* to manage the persistent state of workspaces. 

* **State Manager** is a component that manages the persistent state of workspaces. It provides services to save and restore the state of workspaces filesystem (upper dir) which allows to suspend, resume and move workspaces between nodes. It uses Harbor registry to store images of the workspace filesystem states.

<!-- ## Standard Components

The architecture uses the following standard components:

* **Ingress Controller** provides access to K8shell services using HTTP/HTTPS protocols. It manages the routing of incoming traffic to the appropriate services within the Kubernetes cluster such as K8shell proxy, ArgoCD, Vault, etc. Read more about Ingress Controller configuration in [Ingress Controller Configuration]().

* **Harbor registry** stores container images and helm charts and provides access to them for all services running in the cluster. It allows for the secure storage and distribution of images and charts as well as enables vulnerability scanning and image signing. Read more about Harbor registry configuration and layout in [Harbor Registry Configuration]().

* **HashiCorp Vault** provides secret storage for K8shell services. It securely stores sensitive information such as passwords, API keys, and certificates. It allows for fine-grained access control to secrets and provides audit logs for secret access. Read more about Vault configuration in [Vault Configuration]().

* **Monitoring** collects and stores monitoring data from all services running in the cluster. It provides access to monitoring data for user workspaces and allows for the creation of custom dashboards and alerts. Read more about monitoring in [Monitoring Configuration]().

* **DevOps services** include tools such as ArgoCD, and GitHub Actions Runners allowing for continuous integration and deployment of applications. Read more about DevOps services in [DevOps Services Configuration]().

## External Access Components

In order to enable external access to the cluster, the following components are used:

* **MetalLB** allows for the allocation of external IP addresses to services running in the cluster and enables access to these services from outside the cluster. MetalLB is only used in on-premises deployments. Read more about MetalLB configuration in [MetalLB Configuration]().

* **Load Balancer** is a cloud provider-specific component that provides access to services running in the cluster from outside the cluster. Read more about Load Balancer configuration in [Load Balancer Configuration](). -->
