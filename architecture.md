# Architecture 

K8shell services run in Kubernetes cluster and utilize standard components provided by Kubernetes. The following diagram illustrates high-level architecture with key components.

<p align="center">
  <img src="https://docs.google.com/drawings/export/svg?id=1Fjifn_MpS4K9ptmEHAEOE8bTkiIHPI__tKzhOrsmB-k" />
</p>

The follosing list describes the key components of k8shell architecture:

* **K8shell Proxy** is a key component that provides an OpenSSH protocol interface, enabling clients to connect using standard SSH-based tools. It translates the OpenSSH protocol into Kubernetes streaming API calls using WebSockets. It handling user authentication and authorization using built-in or third-party authorization servers and it dynamically provisions **K8shell Workspaces** based on specified resource requirements and access management configurations. For more details, explore the K8shell Proxy Architecture.

* **CSI Storage Driver** is a component that implements the standard CSI interface, enabling seamless access to the **Storage Server** based on ZFS file system. It supports the dynamic provisioning of persistent volumes for K8shell Workspaces based on defined storage size requirements. Additionally, it allows for the reuse of already provisioned volumes of workspaces that need to be recreated and facilitates the sharing of persistent volumes among multiple users’ workspaces. Read more about storage in Storage Architecture.

* **Ingress Controller** is a component that provides access to K8shell services using standard HTTP and HTTPS protocols. It manages the routing of incoming traffic to the appropriate services within the Kubernetes cluster. The ingress controller performs routing based on defined rules and configurations in individual ingress resources from K8shell proxy, ArgoCD, Vault, etc.

<!-- * Harbor registry stores container images and provides access to container images for user workspaces.
* Vault manages secrets and provides access to secrets for user workspaces.
* Monitoring collects and stores monitoring data and provides access to monitoring data for user workspaces.
* DevOps services provide access to DevOps tools and services for user workspaces.
* MetalLB provides load balancing for user workspaces.
* Ingress controller provides access to user workspaces using standard HTTP and HTTPS protocols.
 -->
