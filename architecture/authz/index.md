---
sidebar_label: Authz
sidebar_custom_props:
  earlyAccess: true
---

# Authorization Service <EarlyAccessBadge />

The Authorization service is the central policy enforcement point for the platform. It uses [Open Policy Agent (OPA)](https://www.openpolicyagent.org/) to evaluate access decisions based on declarative policies written in Rego, decoupling authorization logic from individual services.

The diagram below shows a high-level architecture of the Authz service and its integration points.

![Authz Architecture](svg-gen:drawings/authz-architecture.excalidraw.svg)

The following sequence outlines the high-level interaction points for the Authz service.

:::NumberedList
* **SSH Access Control.** The SSH Proxy enforces Authz policies on every incoming session, controlling which channel types are permitted and whether session recording is required.
* **API Authorization.** The API Server enforces Authz policies on every incoming request, gating operations based on the authenticated user identity and the requested action.
* **Identity Integration.** The Identity service enforces Authz policies on user onboarding and authentication, applying obligations such as sudo permissions and role assignments.
* **Provisioning Gates.** The Provisioner enforces Authz policies before workspace provisioning, applying blueprint patches and configuration constraints returned as obligations.
:::

