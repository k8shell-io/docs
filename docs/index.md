---
slug: /
sidebar_position: 1
title: Welcome
hide_title: true
---

# Welcome

K8shell is a cloud-native development environment that dynamically provisions workspaces in Kubernetes, accessible through the standard SSH protocol.

We believe K8shell should be the platform for developing modern microservice architectures. It doesn’t matter which programming languages your team uses or which IDE they prefer—any IDE with built-in SSH support works seamlessly with K8shell, with no plugins or local setup required.

## 10,000 foot view

* **Workspaces on demand:** Provision secure, ephemeral or persistent developer workspaces inside Kubernetes.  
* **Access via SSH:** No custom protocols, no plugins—just plain SSH. Works with any IDE, CLI, or terminal.  
* **Universal language & tool support:** Polyglot ready: Go, Python, Java, Node.js, Rust… anything that runs in a container.  
* **Blueprint-driven provisioning:** Reproducible workspaces: base images, packages, volumes, networks, init scripts.  
* **Integration with Kubernetes:** Native scheduling, affinity, and resource isolation. Compatible with your existing cluster.  
* **Persistence and storage:** Ephemeral or long-lived workspaces. Attach PVCs, object storage, or config-driven volumes.  
* **Security:**  TLS, SSH certs, vault-based secret injection, session auditing with eBPF, zero-trust ready.  
* **Observability:**  Logs, metrics, traces (OpenTelemetry).  
* **Scaling & multi-tenancy:** Multi-user, multi-team, resource quotas.
* **Extensible architecture:** REST and gRPC APIs, works with CI/CD pipelines.  

All of this packaged as a Kubernetes-native platform. 

Deploy via Helm/ArgoCD, integrate with your cluster, and you’re ready to go.