# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is the documentation source for **k8shell** — a Kubernetes-native platform for provisioning and accessing developer workspaces over SSH, browser Console, or API. The repository contains only Markdown content and SVG architecture drawings. There is no build toolchain in this repository; the docs are rendered by an external Docusaurus site.

## Repository layout

```
concepts/           — service-by-service reference docs
  overview/         — architecture, security model, blueprints, workspace lifecycle, user string
  ssh-proxy/        — SSH entry point and auth flow
  identity/         — user authentication, JWT issuance, OAuth providers, credential helpers
  provisioner/      — workspace lifecycle, blueprint assembly, standalone and injected pods
  workspace/        — k8shelld, kbox CLI, apps, storage, Podman sidecar
  api-server/       — REST gateway, Console and CLI integration
  session/          — session tracking and stream recording  [Early Access]
  ssh-shield/       — brute-force IP blocking via nftables   [Early Access]
  worktrace/        — eBPF workspace activity observation    [Early Access]
installation/       — quickstart and deployment guides
drawings/           — Excalidraw SVGs referenced inline as svg-gen: paths
```

## Key platform concepts

**Blueprint inheritance chain: template → concrete → custom.**  
Platform admins define template and concrete blueprints. Developers add a `.k8shell.yaml` at the repo root to override a subset of fields (resources, storage, env, init scripts, apps). Security-sensitive fields (securityContext, k8shelld settings) are admin-only. This repo's own `.k8shell` file specifies its workspace configuration.

**User string (`USERSTR`).**  
The SSH username encodes both the user and workspace specification: `alice~blueprint@host`, `alice~repo=org/proj+ref=main@host`, etc. See `concepts/overview/user-string.md` for full grammar. Workspace canonical IDs are deterministic SHA-256 hashes of the user string fields.

**Workspace deployment models.**  
A workspace runs either as a *standalone pod* (default — Provisioner creates a dedicated pod) or *injected into an existing workload* (Provisioner patches a Deployment/StatefulSet/DaemonSet pod template and ejects cleanly on teardown).

**k8shelld as PID 1.**  
The `k8shelld` daemon is injected into the workspace via an init container (no workspace image modification required). It bootstraps the user environment, serves a gRPC API consumed by both the SSH Proxy and the API Server, manages apps, and exposes a local Unix socket for the `kbox` CLI.

**Service communication.**  
Services communicate over gRPC (with mTLS via cert-manager + Vault), NATS (async events — failed auth, provisioning status), and REST (API Server external surface). Service-to-service auth uses Kubernetes projected service account tokens scoped per target service.

**Early Access features.**  
Pages marked with `<EarlyAccessBadge />` in frontmatter (`sidebar_custom_props: earlyAccess: true`) — API Server, Session, SSH Shield, Worktrace — are production-ready but require the Early Access program.

## Doc authoring conventions

**Custom components used in MDX:**
- `<StandardInlineTable data={...} />` — renders field-reference tables from inline YAML. Used heavily in blueprint and configuration pages.
- `<EarlyAccessBadge />` — marks Early Access features; add `sidebar_custom_props: earlyAccess: true` to the page frontmatter too.
- `:::NumberedList` / `:::info` / `:::tip` / `:::warning` / `:::note` — Docusaurus admonition variants.
- `svg-gen:drawings/<name>.excalidraw.svg` — inline SVG reference syntax; the drawings live in `drawings/`.

**Line length:** Markdown files use 120-character word wrap (configured in `.vscode/settings.json`).

**Frontmatter fields commonly used:** `sidebar_position`, `sidebar_label`, `sidebar_custom_props`, `title`, `slug`, `hide_title`.
