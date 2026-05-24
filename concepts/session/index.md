---
sidebar_label: Session
sidebar_custom_props:
  earlyAccess: true
---

# Session Service <EarlyAccessBadge />

The Session Service is the central store for user session state in k8shell. It records every session opened through the SSH Proxy or the Console (via the API Server), tracks session lifecycle events, and optionally captures full session streams for audit and compliance purposes.

The diagram below shows the Session Service's position in the platform and its integration points.

![Session Architecture](svg-gen:drawings/session-architecture.excalidraw.svg)

The following outlines the key responsibilities of the Session Service:

:::NumberedList
* **Session creation** — when a user connects via the SSH Proxy or opens an interactive session through the Console, the calling service creates a session record in the Session Service. 
* **Session lifecycle tracking** — the Session Service tracks the active state of each session. Callers report metrics (ingress and egress byte volumes) periodically over the lifetime of the session.
* **Session retrieval** — the API Server queries the Session Service to list active and historical sessions for a user. This powers the session list in the Console and `last` command in the workspace.
* **Session stream recording** — when recording is enabled for a session, the SSH Proxy or API Server streams the raw session data to the Session Service. Streams are stored in [asciinema](https://asciinema.org) format for terminal sessions and [PCAP](https://en.wikipedia.org/wiki/Pcap) format for raw TCP sessions, enabling full replay and forensic analysis.
:::
