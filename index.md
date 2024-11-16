---
hide-toc: true
---

# k8shell.io

K8Shell simplifies Kubernetes access, empowering your team to harness its full potential with ease and efficiency.

K8Shell is a set of services that allows your team to access Kubernetes resources by using standard protocols. In its core, there is the k8shell-proxy service that on one hand provides standard OpenSSH interface to communicate with standard SSH clients (CLIs, IDEs, etc.) and on the other transforms the OpenSSH protocol to Kubernetes API calls using WebSocket. The service interleaves the SSH communication with user authentication and authorization using third-party services, checks for users' configurations and dynamically provisions workspaces when users or developers request access to them. It is important to note that the service does not require any third-part plugins on the client side and can seamlessly work with existing development tools. 

## Main Features

TODO

```{toctree}
:hidden:

architecture
configuration/index
installation
usage
```

```{toctree}
:caption: Links
:hidden:

```
