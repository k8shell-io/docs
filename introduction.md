---
sidebar_position: 2
title: Introduction
---

import Link from '@docusaurus/Link';

# Introduction

k8shell is a platform built around a simple idea: developer workspaces run in Kubernetes. Developers can have direct access to backends, databases, and internal services - the same resources available to apps in test or production. 

For AI agents, k8shell workspaces provide a natural isolation boundary. Agents run with no credentials on disk, no access to the host filesystem, and workspace configuration restricted by OPA policy rules. Using the [k8shell MCP server](/roadmap#ai-agent-support), AI agents can spawn workspaces on demand and perform their tasks in a fully isolated, auditable environment — with access scoped to exactly what the workspace allows.

A workspace is provisioned on demand and accessible over SSH, a browser-based Console, or API. 

:::info Prefer learning by doing?
Follow the [Quick Start](/installation/k8shell-oss/quickstart) to get a working installation up in minutes and explore k8shell hands-on.
:::

## How the docs are organized

**Introduction** — covers the open-source license, Early Access program, how to get help, and roadmap.

<div class="service-grid">
  <Link className="service-card" to="/licensing">Licensing</Link>
  <Link className="service-card" to="/support">Support</Link>
  <Link className="service-card" to="/roadmap">Roadmap</Link>
  <Link className="service-card" to="/comparison">Comparison</Link>
</div>

**Overview** — explains how k8shell works: the architecture, core services, security model, and workspace lifecycle. Start here to understand the platform before going deeper.

<div class="service-grid">
  <Link className="service-card" to="/concepts/overview">Overview</Link>
  <Link className="service-card" to="/concepts/overview/security">Security</Link>
  <Link className="service-card" to="/concepts/overview/blueprint">Blueprint</Link>
  <Link className="service-card" to="/concepts/overview/workspace">Workspace</Link>
  <Link className="service-card" to="/concepts/overview/user-string">User String</Link>
</div>

**Services** — documentation for each k8shell service and how they interact:

<div class="service-grid">
  <Link className="service-card" to="/concepts/ssh-proxy">SSH Proxy</Link>
  <Link className="service-card" to="/concepts/identity">Identity</Link>
  <Link className="service-card" to="/concepts/provisioner">Provisioner</Link>
  <Link className="service-card" to="/concepts/workspace">Workspace</Link>
  <Link className="service-card" to="/concepts/api-server">API Server</Link>
  <Link className="service-card" to="/concepts/session">Session</Link>
  <Link className="service-card" to="/concepts/ssh-shield">SSH Shield</Link>
  <Link className="service-card" to="/concepts/worktrace">Worktrace</Link>
</div>

**Installation** — step-by-step guides for deploying k8shell. 

<div class="service-grid">
  <Link className="service-card" to="/installation/k8shell-oss">k8shell OSS</Link>
  <Link className="service-card" to="/installation/k8shell-oss/quickstart">Quickstart</Link>
  <Link className="service-card" to="">k8shell Platform</Link>
</div>
