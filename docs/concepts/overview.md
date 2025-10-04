---
sidebar_position: 1
---

# Overview

K8shell platform connects developers to Kubernetes-based workspaces through a lightweight SSH proxy. A k8shell workspace runs as an isolated pod in Kubernetes, providing users with full Linux environments where they can code, build, and debug using their preferred tools.

The system is composed of independent microservices responsible for identity management, workspace provisioning, access control, and observability — all communicating through well-defined APIs and event streams.

The following figure shows the k8shell components.

import SSHArchitecture from '@site/static/img/diagrams/k8shell-architecture.excalidraw.svg';

<div className="centered-svg-container">
  <SSHArchitecture className="centered-svg" />
</div>

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
