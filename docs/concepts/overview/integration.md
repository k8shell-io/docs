---
sidebar_position: 2
---

# API and gRPC Integration

External and internal integrations in K8shell are handled through two complementary communication layers.
Externally, access to K8shell is mediated by the API Server, which exposes a REST API for all external clients. The API Server manages user authentication and authorization using JWT tokens and enforces access policies before forwarding requests to internal services such as Identity, Session, Provisioner, or workspaces running k8shelld.

Internally, service-to-service communication within the K8shell system uses gRPC. Each service authenticates requests using a short-lived JWT issued by the Kubernetes token issuer, based on the caller’s service account and namespace. The client includes this token as a bearer credential when calling another service. The receiving service validates the token audience and verifies that the request originates from an authorized service account and namespace before processing it.

All gRPC traffic is secured with TLS. Certificates and private keys are automatically provisioned and rotated through cert-manager integrated with an external PKI provider such as HashiCorp Vault. Rotation occurs by default every 30 days. When new certificates are issued, services automatically reload them and re-establish their gRPC listeners without downtime, ensuring continuous secure communication inside the K8shell platform.

The following diagram illustrates the high-level communication flow. For simplicity, it shows only the API server and provisioner integration. The same integration pattern applies to other services, including chained service-to-service calls.

```mermaid
%%{init:{ "theme": "base", "fontSize": 26 }}%%
sequenceDiagram
    autonumber
    participant EC as External Client
    participant API as API Server (REST)
    participant PROV as Provisioner<br/>(gRPC)
    participant PKI as cert-manager<br/>Vault PKI
    participant K8S as Kubernetes<br/>Token Issuer

    note over API,PROV: certs & tokens are provisioned asynchronously

    %% External access via REST
    EC->>API: REST request<br/>user JWT (Authorization: Bearer)
    API->>API: Validate JWT & authorize
    API-->>EC: (optional) 401/403 on failure

    %% SA JWT & cert availability (asynchronous, no direct calls)
    par Async provisioning
        K8S-->>API: Projected SA JWT (aud=provisioner, sa/ns from pod)
        PKI-->>API: Client cert/key available (controller)
    and
        K8S-->>PROV: Projected SA JWT (aud=k8shelld, sa/ns from pod)
        PKI-->>PROV: Server cert/key available
    end

    %% Internal call uses gRPC + projected SA JWT + mTLS
    rect rgb(245,245,245)
        note over API,PROV: Internal service-to-service call (gRPC)
        API->>PROV: gRPC request<br/>Authorization: Bearer <projected SA JWT>
        PROV->>PROV: Verify TLS cert<br/>Validate SA JWT<br/>(audience, SA name, namespace)
        alt AuthZ success
            PROV-->>API: gRPC response
        else AuthZ failure
            PROV-->>API: gRPC error (Unauthenticated/PermissionDenied)
        end
    end

    %% Final response to external client
    API-->>EC: REST response (result / error)

    %% Rotation events (asynchronous)
    alt Cert/key rotated
        PKI-->>API: New cert/key available
        API->>API: Hot-reload TLS (no downtime)
        PKI-->>PROV: New cert/key available
        PROV->>PROV: Hot-reload TLS (no downtime)
    end
```