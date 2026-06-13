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
* **Identity Integration.** The Identity service consults Authz to decide whether user onboarding and authentication are permitted and to enforce obligations such as sudo permissions and role assignments.
* **SSH Access Control.** The SSH Proxy consults Authz to decide whether a session may proceed, which SSH channel types are permitted, and whether session recording is required.
* **API Authorization.** The API Server consults Authz to decide whether an incoming request is permitted based on the authenticated user identity and the requested operation.
* **Provisioning Gates.** The Provisioner consults Authz to decide whether a user or role is authorized to trigger workspace provisioning and enforce workspace configurations. 
:::

