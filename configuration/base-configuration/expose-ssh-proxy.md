---
sidebar_position: 1
title: Expose SSH Proxy
---

# Expose SSH Proxy

SSH Proxy is the sole external entry point for all user connections into k8shell. Exposing it correctly is the most infrastructure-specific part of any deployment. The right approach depends on where the cluster is running and what network topology is in use.

## Kubernetes Service

By default the SSH Proxy Service is of type `ClusterIP`. To make it reachable from outside the cluster, configure a `LoadBalancer` Service via the [`sshProxy.loadBalancer`](/configuration/helm-charts/k8shell-chart#sshproxyloadbalancer) key in the k8shell chart values.

```yaml
sshProxy:
  loadBalancer:
    enabled: true
    annotations:
      metallb.universe.tf/ip-allocated-from-pool: "k8shell-pool"
      metallb.universe.tf/allow-shared-ip: "k8shell-ext-ip"
      metallb.universe.tf/loadBalancerIPs: "10.126.2.80"
    port: 2026
```

The example above uses [MetalLB](https://metallb.universe.tf) to assign a specific IP from a pre-configured address pool. The `allow-shared-ip` annotation lets multiple Services share the same external IP if needed. Substitute the annotations appropriate for your load balancer — the `enabled` and `port` fields are provider-agnostic.

## Edge routing

Once the Service has an external IP, end users need a path to it. The right approach depends on the network topology.

### On-premises with an edge host

When the load balancer IP is on an internal subnet not directly routable by clients, a Linux host at the network boundary can forward traffic using nginx's `stream` module. The recommended configuration enables the [PROXY protocol](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt), which preserves the original client IP through the forwarding layer:

```nginx
stream {
    upstream backend_ssh {
        server 10.126.2.80:2026;
    }

    server {
        listen 22;
        proxy_pass backend_ssh;
        proxy_protocol on;

        proxy_connect_timeout 1s;
    }
}
```

This listens on the standard SSH port (22) on the edge host and forwards connections to the SSH Proxy Service with a PROXY protocol header prepended to each connection.

:::tip PROXY protocol and brute-force protection
When SSH Proxy is configured to accept the PROXY protocol (`sshProxy.proxyProtocol: true`), it extracts the real client IP from the header and makes it available to SSH Shield and nfgate. This is what enables accurate IP-based blocking of brute-force attackers. See [SSH Shield](/concepts/ssh-shield/).
:::

If PROXY protocol is not needed (e.g. SSH Shield is not deployed), a simple `iptables` DNAT rule is sufficient:

```bash
iptables -t nat -A PREROUTING -p tcp --dport 22 -j DNAT --to-destination 10.126.2.80:2026
iptables -t nat -A POSTROUTING -j MASQUERADE
```

### Cloud environments

When running in a cloud VPC, the provider's load balancer controller (AWS NLB, GCP Network LB, Azure Load Balancer) provisions an external IP or DNS name automatically. Whether that address is public or private depends on the subnet:

- **Private subnet** — the address is reachable only from within the VPC or over a VPN / Direct Connect. Suitable for internal or enterprise deployments.
- **Public subnet** — the address is directly internet-reachable. Restrict access to TCP on the configured port via security groups or firewall rules.

In cloud environments the load balancer itself can be configured to pass the client IP using a protocol the SSH Proxy understands — refer to the provider's documentation for NLB/proxy protocol support.

In either case the client `~/.ssh/config` entry is the same:

```
Host my-k8shell
    HostName <edge-host-or-load-balancer-ip>
    Port 22
```

The specific addressing and routing decisions are outside k8shell's scope — the only requirement is that TCP traffic reaches the SSH Proxy Service, and that PROXY protocol is enabled end-to-end if real client IP tracking is required.
