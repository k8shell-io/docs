---
sidebar_label: Apps
sidebar_position: 6
---

# Apps

Workspace apps are long-running processes defined in the blueprint and managed by `k8shelld`'s app manager. They start alongside the workspace and can be individually stopped, started, and inspected. The `kbox apps` subcommand provides the interface to the app manager via the Internal API.

## kbox apps list

`kbox apps list` shows all apps defined for the workspace along with their current status.

```
kbox apps list [--json]
```

Each row includes the app name, current state (`running`, `stopped`, `failed`), and the process ID if running.

## kbox apps install

`kbox apps install` installs an app into the workspace. Installation triggers the app manager to download and configure the app's resources according to the blueprint definition.

```
kbox apps install <name>
```

## kbox apps start

`kbox apps start` starts a stopped or previously failed app.

```
kbox apps start <name>
```

## kbox apps stop

`kbox apps stop` stops a running app without uninstalling it.

```
kbox apps stop <name>
```

## kbox apps logs

`kbox apps logs` displays the log output for an app. Logs are read from the app manager's log files for the named app.

```
kbox apps logs <name>
```
