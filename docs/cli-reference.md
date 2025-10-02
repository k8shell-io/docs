---
sidebar_position: 4
---

# CLI Reference

Complete reference for all K8Shell commands and options.

## Global Options

These options are available for all commands:

- `--namespace, -n`: Specify namespace
- `--context`: Kubernetes context to use
- `--config`: Path to kubeconfig file
- `--verbose, -v`: Enable verbose output
- `--help, -h`: Show help

## Core Commands

### Cluster Management

#### `k8shell cluster`
Manage cluster connections and information.

```bash
# Show cluster information
k8shell cluster info

# Check cluster status
k8shell cluster status

# List available contexts
k8shell cluster contexts

# Switch context
k8shell cluster use my-context
```

### Namespace Operations

#### `k8shell namespace` (alias: `ns`)
Manage namespaces.

```bash
# List namespaces
k8shell ns list

# Create namespace
k8shell ns create my-namespace

# Delete namespace
k8shell ns delete my-namespace

# Switch to namespace
k8shell ns use my-namespace

# Show current namespace
k8shell ns current
```

### Pod Management

#### `k8shell pods`
List and manage pods.

```bash
# List pods in current namespace
k8shell pods

# List pods in specific namespace
k8shell pods -n kube-system

# List pods with labels
k8shell pods --selector app=nginx

# Watch pods
k8shell pods --watch
```

#### `k8shell pod`
Individual pod operations.

```bash
# Describe pod
k8shell pod describe my-pod

# Get pod YAML
k8shell pod get my-pod -o yaml

# Delete pod
k8shell pod delete my-pod

# Restart pod (delete and recreate)
k8shell pod restart my-pod
```

### Logs and Debugging

#### `k8shell logs`
View container logs.

```bash
# Get logs from pod
k8shell logs my-pod

# Follow logs
k8shell logs my-pod --follow

# Get logs from specific container
k8shell logs my-pod -c my-container

# Get logs with timestamp
k8shell logs my-pod --timestamps

# Get last N lines
k8shell logs my-pod --tail 100
```

#### `k8shell exec`
Execute commands in containers.

```bash
# Execute command
k8shell exec my-pod -- ls -la

# Interactive shell
k8shell exec my-pod -it -- /bin/bash

# Execute in specific container
k8shell exec my-pod -c my-container -- env
```

### Port Forwarding

#### `k8shell port-forward`
Forward local ports to pods or services.

```bash
# Forward to pod
k8shell port-forward pod/my-pod 8080:80

# Forward to service
k8shell port-forward service/my-service 8080:80

# Forward to deployment
k8shell port-forward deployment/my-app 8080:80

# Listen on all interfaces
k8shell port-forward pod/my-pod 8080:80 --address 0.0.0.0
```

### File Operations

#### `k8shell cp`
Copy files between local machine and pods.

```bash
# Copy from pod to local
k8shell cp my-pod:/path/to/file ./local-file

# Copy from local to pod
k8shell cp ./local-file my-pod:/path/to/file

# Copy from specific container
k8shell cp my-pod:/path/to/file ./local-file -c my-container
```

### Resource Management

#### `k8shell get`
Get resources.

```bash
# Get deployments
k8shell get deployments

# Get services
k8shell get services

# Get all resources
k8shell get all

# Get with output format
k8shell get pods -o wide
k8shell get pods -o yaml
k8shell get pods -o json
```

#### `k8shell describe`
Show detailed resource information.

```bash
# Describe deployment
k8shell describe deployment my-app

# Describe service
k8shell describe service my-service

# Describe node
k8shell describe node my-node
```

### Configuration

#### `k8shell config`
Manage K8Shell configuration.

```bash
# Show current configuration
k8shell config show

# Set configuration value
k8shell config set key value

# Reset configuration
k8shell config reset

# Edit configuration file
k8shell config edit
```

## Interactive Mode Commands

When in interactive mode (`k8shell` without arguments), additional commands are available:

- `help`: Show available commands
- `exit`: Exit interactive mode
- `clear`: Clear screen
- `history`: Show command history
- `alias`: Create command aliases

## Output Formats

K8Shell supports multiple output formats:

- `table` (default): Human-readable table
- `json`: JSON format
- `yaml`: YAML format
- `wide`: Extended table with more columns
- `name`: Resource names only

## Environment Variables

- `K8SHELL_CONFIG`: Path to config file
- `K8SHELL_NAMESPACE`: Default namespace
- `K8SHELL_CONTEXT`: Default context
- `K8SHELL_OUTPUT`: Default output format