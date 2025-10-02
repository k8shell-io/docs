---
sidebar_position: 5
---

# Configuration

Learn how to configure K8Shell to fit your workflow and environment.

## Configuration File

K8Shell uses a YAML configuration file located at:
- Linux/macOS: `~/.k8shell/config.yaml`
- Windows: `%USERPROFILE%\.k8shell\config.yaml`

## Basic Configuration

### Default Settings

```yaml
# ~/.k8shell/config.yaml
defaults:
  namespace: default
  context: ""
  output: table
  editor: vim

# Cluster aliases
clusters:
  prod: my-production-cluster
  dev: my-development-cluster
  staging: my-staging-cluster

# Namespace aliases
namespaces:
  kube: kube-system
  monitoring: prometheus-system
  ingress: ingress-nginx

# Custom commands
aliases:
  pods: "get pods"
  logs: "logs --follow"
  shell: "exec -it -- /bin/bash"
```

### Environment Variables

K8Shell respects these environment variables:

```bash
export K8SHELL_CONFIG=~/.k8shell/config.yaml
export K8SHELL_NAMESPACE=production
export K8SHELL_CONTEXT=my-cluster
export K8SHELL_OUTPUT=json
export K8SHELL_EDITOR=code
```

## Advanced Configuration

### Multi-Cluster Setup

```yaml
clusters:
  production:
    context: prod-cluster
    namespace: default
    aliases:
      api: api-server
      db: database
  
  development:
    context: dev-cluster
    namespace: development
    aliases:
      api: api-server-dev
      db: database-dev
```

### Custom Prompts

```yaml
prompt:
  format: "[{context}:{namespace}] k8shell> "
  colors:
    context: cyan
    namespace: yellow
    prompt: green
```

### Output Formatting

```yaml
output:
  default: table
  timestamps: true
  colors: true
  paging: auto
  
table:
  max_width: 120
  truncate: true
  
json:
  indent: 2
  color: true
```

### Resource Filters

```yaml
filters:
  pods:
    exclude_namespaces:
      - kube-system
      - kube-public
    show_only:
      - Running
      - Pending
  
  services:
    exclude_types:
      - ClusterIP
```

## Plugin Configuration

### Enable Plugins

```yaml
plugins:
  enabled:
    - autocomplete
    - history
    - aliases
    - monitoring
  
  autocomplete:
    cache_duration: 300s
    include_descriptions: true
  
  history:
    max_entries: 1000
    file: ~/.k8shell/history
  
  monitoring:
    metrics_endpoint: http://prometheus:9090
    refresh_interval: 30s
```

### Custom Scripts

```yaml
scripts:
  deploy:
    command: "kubectl apply -f"
    description: "Deploy application"
    confirm: true
  
  logs:
    command: "kubectl logs -f"
    description: "Follow logs"
    interactive: true
```

## Security Configuration

### RBAC Integration

```yaml
security:
  rbac:
    enabled: true
    cache_permissions: true
    check_before_action: true
  
  audit:
    enabled: true
    log_file: ~/.k8shell/audit.log
    log_level: info
```

### Restricted Commands

```yaml
restrictions:
  forbidden_commands:
    - delete
    - patch
  
  forbidden_namespaces:
    - kube-system
    - kube-public
  
  require_confirmation:
    - delete
    - apply
    - patch
```

## Theme and Appearance

### Color Scheme

```yaml
theme:
  colors:
    primary: "#007acc"
    secondary: "#6c757d"
    success: "#28a745"
    warning: "#ffc107"
    error: "#dc3545"
    info: "#17a2b8"
  
  syntax_highlighting:
    enabled: true
    theme: monokai
```

### Terminal Settings

```yaml
terminal:
  clear_on_start: false
  show_banner: true
  bell_on_error: false
  
banner:
  text: "Welcome to K8Shell!"
  color: cyan
  show_version: true
  show_cluster: true
```

## Configuration Commands

### View Current Configuration

```bash
k8shell config show
```

### Set Configuration Values

```bash
k8shell config set defaults.namespace production
k8shell config set output.default json
k8shell config set theme.colors.primary "#ff0000"
```

### Reset Configuration

```bash
# Reset specific setting
k8shell config unset defaults.namespace

# Reset entire configuration
k8shell config reset
```

### Edit Configuration File

```bash
k8shell config edit
```

## Configuration Validation

K8Shell validates configuration on startup:

```bash
k8shell config validate
```

This checks for:
- Valid YAML syntax
- Required fields
- Valid values for enums
- Accessible file paths

## Troubleshooting

### Common Issues

1. **Configuration not loading**
   - Check file permissions
   - Verify YAML syntax
   - Use `k8shell config validate`

2. **Environment variables not working**
   - Ensure variables are exported
   - Check variable names (case-sensitive)
   - Restart shell session

3. **Cluster connection issues**
   - Verify kubeconfig file
   - Check cluster context
   - Test with `kubectl`