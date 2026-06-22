---
sidebar_position: 3
title: API Reference
---

# API Reference

The API Server exposes a REST API over HTTP. All endpoints are versioned under `/api/v1`. The browser-based Console and CLI are the primary callers.

## Authentication

All endpoints except those under `/api/v1/auth` and `/api/v1/healthcheck` require a valid session. Requests must carry either a session cookie (web clients) or a bearer token (CLI and automation). Unauthenticated requests are rejected with `401 Unauthorized`. See [Authentication](./authentication.md) for details.

## Endpoints

### Health

Base path: `/api/v1`

**`GET /healthcheck`** — Returns `200 OK` with a health status payload. 

### Auth

Base path: `/api/v1/auth`. No authentication required.

**`GET /providers`** — Returns the list of configured identity providers available for login. 

**`GET /login`** — Initiates the [OAuth web flow](/architecture/identity/user-management#web-flow) for the selected identity provider. Redirects the browser to the provider's authorization endpoint. 

**`POST /callback`** — OAuth callback handler. Exchanges the authorization code for a user token, issues a session cookie, and redirects the browser back to the Console. 

**`POST /logout`** — Invalidates the current session and clears the session cookie.

### Current user

Base path: `/api/v1/me`

Convenience aliases that resolve to the authenticated user's own identity. Equivalent to calling the corresponding `/api/v1/users/:username/...` endpoint.

**`GET /profile`** — Returns the authenticated user's profile.

**`GET /sessions`** — Returns the authenticated user's workspace sessions.

**`GET /credentials`** — Returns all credential records for the authenticated user.

**`GET /credentials/:name`** — Returns the [credential helper](/architecture/identity/credential-helpers) record for `git`, `registry`, or `kubernetes`.

**`GET /blueprints`** — Returns the blueprints available to the authenticated user.

### Users

Base path: `/api/v1/users`

**`GET /`** — Returns all users known to the platform.

**`GET /:username/profile`** — Returns the profile for the specified user.

**`GET /:username/sessions`** — Returns workspace sessions for the specified user.

**`GET /:username/credentials`** — Returns all credential records for the specified user.

**`GET /:username/credentials/:name`** — Returns a [credential helper](/architecture/identity/credential-helpers) for a specific service for the user.

**`GET /:username/blueprints`** — Returns the blueprints available to the specified user.

### Workspaces

Base path: `/api/v1/workspaces`

**`GET /`** — Returns all workspaces visible to the authenticated user.

**`POST /`** — Provisions a new workspace. The request body specifies the blueprint and user-string parameters. The API Server forwards the request to the [Provisioner](/architecture/provisioner) and returns a provision job ID for progress tracking.

**`GET /:workspace_name`** — Returns the full details of a single workspace.

**`DELETE /:workspace_name`** — [Deletes a workspace](/user-guide/kbox-cli/lifecycle#kbox-shutdown) and all its resources or a workspace pod (soft shutown)

**`GET /:workspace_name/sysinfo`** — Returns system information for a workspace (CPU, memory, disk).

**`GET /:workspace_name/interactive`** — Upgrades the connection to a WebSocket and starts an interactive CloudShell session. See [WebSocket](./access.md#websocket) for protocol details.

### Workspace apps

Base path: `/api/v1/workspaces/:workspace_name/apps`

**`GET /`** — Returns the list of [apps](/architecture/workspace/apps) registered for the workspace. 

**`GET /:app_name/logs`** — Streams logs from the specified app.

**`POST /:app_name/install`** — Installs the specified app into the workspace.

**`POST /:app_name/start`** — Starts the specified app.

**`POST /:app_name/stop`** — Stops the specified app.

### File transfer

Base path: `/api/v1/workspaces/:workspace_name`

**`GET /files`** — Downloads a file from the workspace. The file path is supplied as a query parameter. Routed to the workspace SFTP subsystem via k8shelld.

**`PUT /files`** — Uploads a file to the workspace. The target path is supplied as a query parameter.

### Provision jobs

Base path: `/api/v1/jobs`

**`GET /:job_id`** — Returns the current status of a workspace provisioning job. Jobs are short-lived and stored in NATS KV with a 10-minute TTL. Callers poll this endpoint after `POST /api/v1/workspaces` to track provisioning progress.

### Internal

Base path: `/api/v1/internal/users`

**`POST /:username/token`** — Issues a short-lived user token for use inside a workspace. Called by k8shelld on behalf of a workspace process that needs to authenticate against the API Server. Not intended for external callers.
