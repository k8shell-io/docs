---
sidebar_position: 2
title: Introduction
---

# Introduction

k8shell is a platform built around a simple idea: developer workspaces run in isolated environments. Developers can have direct access to backends, databases, and internal services — the same resources available to apps in test or production. There is no gap to bridge between environments. 

For AI agents, k8shell workspaces provide a natural isolation boundary. Agents run with no credentials on disk, no access to the host filesystem, and outbound network access restricted by policy.

A workspace is provisioned on demand and accessible over SSH, a browser-based Console, or REST API. 

The platform is composed of several microservices: the SSH Proxy and API Server handle access; Identity issues and validates JWT tokens; the Provisioner creates and tears down workspaces; k8shelld runs inside each workspace as the in-workspace daemon; Session, SSH Shield, and Worktrace cover audit, brute-force protection, and runtime monitoring. All services communicate over gRPC, REST, and NATS.

:::info Prefer learning by doing?
Follow the [Quick Start](/installation/k8shell-oss/quickstart) to get a working installation up in minutes and explore k8shell hands-on.
:::

## How the docs are organized

**Overview** — explains how k8shell works: the architecture, core services, security model, and workspace lifecycle. Start here to understand the platform before going deeper.

<div class="service-grid">
  <a class="service-card" href="/concepts/overview">Overview</a>
  <a class="service-card" href="/concepts/overview/security">Security</a>
  <a class="service-card" href="/concepts/overview/blueprint">Blueprint</a>
  <a class="service-card" href="/concepts/overview/workspace">Workspace</a>
  <a class="service-card" href="/concepts/overview/user-string">User String</a>
</div>

**Services** — documentation for each k8shell service and how they interact:

<div class="service-grid">
  <a class="service-card" href="/concepts/ssh-proxy">SSH Proxy</a>
  <a class="service-card" href="/concepts/identity">Identity</a>
  <a class="service-card" href="/concepts/provisioner">Provisioner</a>
  <a class="service-card" href="/concepts/k8shelld">k8shelld</a>
  <a class="service-card" href="/concepts/api-server">API Server</a>
  <a class="service-card" href="/concepts/session">Session</a>
  <a class="service-card" href="/concepts/ssh-shield">SSH Shield</a>
  <a class="service-card" href="/concepts/worktrace">Worktrace</a>
</div>

**Installation** — step-by-step guides for deploying k8shell. 

<div class="service-grid">
  <a class="service-card" href="/installation/k8shell-oss">k8shell OSS</a>
  <a class="service-card" href="/installation/k8shell-oss/quickstart">Quickstart</a>
  <a class="service-card" href="">k8shell Platform</a>
</div>

**[Reference](/reference/blueprint)** — full field-level reference for configuration resources such as Blueprints.
