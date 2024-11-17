# Architecture

```{toctree}
:hidden:

k8shell-proxy
```

K8shell services run in Kubernetes cluster and utilize standard components provided by Kubernetes. The following diagram illustrates high-level architecture with key components.

```{eval-rst}
.. gdrawing:: 1Fjifn_MpS4K9ptmEHAEOE8bTkiIHPI__tKzhOrsmB-k
```

## Core Components

The core components of k8shell architecture are:

* **K8shell Proxy** provides an OpenSSH protocol interface, enabling clients to connect using standard SSH-based tools. It translates the OpenSSH protocol into Kubernetes streaming API calls using WebSockets. It handles user authentication and authorization by using built-in or third-party authorization mechanisms and it dynamically provisions **K8shell Workspaces** according to defined resource requirements and access management configurations. For more details, explore the [K8shell Proxy Architecture]().

* **CSI Storage Driver** is a component that implements the standard CSI interface, enabling seamless access to the **Storage Server** based on ZFS file system. It supports the dynamic provisioning of persistent volumes for K8shell Workspaces according to configuration requirements such as storage size and access permission. It allows for the reuse of already provisioned workspaces' volumes that need to be recreated and supports provisioning of shared volumes. Read more about storage in [Storage Architecture]().

## Standard Components

The architecture uses the following standard components:

* **Ingress Controller** provides access to K8shell services using HTTP/HTTPS protocols. It manages the routing of incoming traffic to the appropriate services within the Kubernetes cluster such as K8shell proxy, ArgoCD, Vault, etc. Read more about Ingress Controller configuration in [Ingress Controller Configuration]().

* **Harbor registry** stores container images and helm charts and provides access to them for all services running in the cluster. It allows for the secure storage and distribution of images and charts as well as enables vulnerability scanning and image signing. Read more about Harbor registry configuration and layout in [Harbor Registry Configuration]().

* **HashiCorp Vault** provides secret storage for K8shell services. It securely stores sensitive information such as passwords, API keys, and certificates. It allows for fine-grained access control to secrets and provides audit logs for secret access. Read more about Vault configuration in [Vault Configuration]().

* **Monitoring** collects and stores monitoring data from all services running in the cluster. It provides access to monitoring data for user workspaces and allows for the creation of custom dashboards and alerts. Read more about monitoring in [Monitoring Configuration]().

* **DevOps services** include tools such as ArgoCD, and GitHub Actions Runners allowing for continuous integration and deployment of applications. Read more about DevOps services in [DevOps Services Configuration]().

## External Access Components

In order to enable external access to the cluster, the following components are used:

* **MetalLB** allows for the allocation of external IP addresses to services running in the cluster and enables access to these services from outside the cluster. MetalLB is only used in on-premises deployments. Read more about MetalLB configuration in [MetalLB Configuration]().

* **Load Balancer** is a cloud provider-specific component that provides access to services running in the cluster from outside the cluster. Read more about Load Balancer configuration in [Load Balancer Configuration]().
