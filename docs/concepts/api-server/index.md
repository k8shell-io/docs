---
sidebar_custom_props:
  earlyAccess: true
---

# API Server <EarlyAccessBadge />

The API Server is the REST API gateway for k8shell. It is the single entry point for the k8shell CLI, the browser-based Console, and any external automation or integration. Incoming requests are authenticated, authorized, and routed to the appropriate backend service — Identity, Provisioner, Session, or k8shelld — over gRPC or NATS.

The diagram below shows the API Server's position in the overall platform architecture and its integration points.

![API Server Architecture](svg-gen:drawings/api-server-architecture.excalidraw.svg)

The following outlines the key interaction patterns the API Server is involved in:

:::NumberedList
* **CLI and Console access** — the k8shell CLI and the browser-based Console communicate exclusively through the API Server for all platform operations.
* **User onboarding** — when a user is not yet known, the API Server initiates an OAuth web flow via Identity to onboard the user and create their account.
* **Token and session storage** — after authentication, the API Server retrieves the user's JWT from Identity and stores it in the NATS KV store alongside a session cookie for subsequent requests.
* **Workspace provisioning** — the API Server looks up available workspaces and forwards provisioning requests to the Provisioner, which creates or tears down workspace pods in Kubernetes.
* **Session management** — the API Server records active user sessions and retrieves previous sessions from the Session service for audit and resume workflows.
* **Workspace connectivity** — the API Server establishes a connection to the workspace's k8shelld daemon, translates WebSocket traffic from the downstream web app into k8shelld gRPC calls, and acts as a reverse proxy for HTTP access to apps running inside the workspace.
* **In-workspace API calls** — processes running inside a workspace call the API Server directly for platform-aware operations, such as retrieving the user's previous sessions or invoking credential helper backends. 

:::