---
sidebar_position: 6
---

# Examples

Real-world examples and common use cases for K8Shell.

## Daily Operations

### Quick Cluster Overview

```bash
# Get cluster status and resource usage
k8shell cluster status
k8shell get nodes
k8shell get pods --all-namespaces | grep -v Running
```

### Namespace Management

```bash
# Create a new environment
k8shell ns create staging
k8shell ns use staging

# Copy resources from another namespace
k8shell get deployment my-app -o yaml | \
  sed 's/namespace: production/namespace: staging/' | \
  k8shell apply -f -
```

## Debugging Workflows

### Pod Troubleshooting

```bash
# Find problematic pods
k8shell pods --field-selector status.phase!=Running

# Get detailed pod information
k8shell pod describe my-pod

# Check recent events
k8shell get events --sort-by=.metadata.creationTimestamp

# Get logs with context
k8shell logs my-pod --previous --timestamps
```

### Application Debugging

```bash
# Port forward for local debugging
k8shell port-forward deployment/my-app 8080:80 &

# Execute debugging commands
k8shell exec my-pod -- ps aux
k8shell exec my-pod -- netstat -tlnp
k8shell exec my-pod -- env | grep -i java

# Copy debug files
k8shell cp my-pod:/app/logs/error.log ./error.log
```

## Development Workflows

### Local Development Setup

```bash
# Switch to development namespace
k8shell ns use development

# Port forward services for local testing
k8shell port-forward service/database 5432:5432 &
k8shell port-forward service/redis 6379:6379 &
k8shell port-forward service/api 8080:80 &

# Monitor application logs
k8shell logs deployment/api --follow
```

### Configuration Management

```bash
# Update application config
k8shell get configmap app-config -o yaml > config.yaml
# Edit config.yaml
k8shell apply -f config.yaml

# Restart pods to pick up new config
k8shell rollout restart deployment/my-app

# Watch rollout progress
k8shell rollout status deployment/my-app
```

## Production Operations

### Health Monitoring

```bash
# Check cluster health
k8shell get componentstatuses
k8shell top nodes
k8shell top pods --all-namespaces

# Monitor resource usage
k8shell describe nodes | grep -A 5 "Allocated resources"
k8shell get pods --all-namespaces -o wide | grep -v Running
```

### Backup Operations

```bash
# Backup namespace resources
k8shell get all -o yaml > backup-$(date +%Y%m%d).yaml

# Export specific resources
k8shell get configmaps -o yaml > configmaps-backup.yaml
k8shell get secrets -o yaml > secrets-backup.yaml
k8shell get persistentvolumes -o yaml > pv-backup.yaml
```

### Scaling Operations

```bash
# Scale deployments
k8shell scale deployment my-app --replicas=5

# Auto-scale based on CPU
k8shell autoscale deployment my-app --min=2 --max=10 --cpu-percent=80

# Check scaling status
k8shell get hpa
k8shell describe hpa my-app
```

## Multi-Cluster Management

### Context Switching

```bash
# List available contexts
k8shell config get-contexts

# Switch between clusters
k8shell config use-context production
k8shell config use-context staging

# Quick cluster comparison
for ctx in production staging development; do
  echo "=== $ctx ==="
  k8shell --context=$ctx get pods --all-namespaces | wc -l
done
```

### Cross-Cluster Operations

```bash
# Compare resource counts across clusters
clusters="prod staging dev"
for cluster in $clusters; do
  echo "=== $cluster ==="
  k8shell --context=$cluster get namespaces --no-headers | wc -l
  k8shell --context=$cluster get pods --all-namespaces --no-headers | wc -l
done

# Sync configurations between clusters
k8shell --context=staging get configmap app-config -o yaml | \
  sed 's/namespace: staging/namespace: production/' | \
  k8shell --context=production apply -f -
```

## Automation Scripts

### Deployment Automation

```bash
#!/bin/bash
# deploy.sh - Automated deployment script

NAMESPACE=${1:-default}
IMAGE_TAG=${2:-latest}

echo "Deploying to namespace: $NAMESPACE"
echo "Image tag: $IMAGE_TAG"

# Switch to target namespace
k8shell ns use $NAMESPACE

# Update image tag
k8shell set image deployment/my-app container=my-app:$IMAGE_TAG

# Wait for rollout
k8shell rollout status deployment/my-app --timeout=300s

# Verify deployment
k8shell get pods -l app=my-app
k8shell logs deployment/my-app --tail=10
```

### Health Check Script

```bash
#!/bin/bash
# health-check.sh - Cluster health monitoring

echo "=== Cluster Health Check ==="
echo "Date: $(date)"
echo

# Node status
echo "Node Status:"
k8shell get nodes

# Pod status summary
echo -e "\nPod Status Summary:"
k8shell get pods --all-namespaces --no-headers | \
  awk '{print $4}' | sort | uniq -c

# Recent events
echo -e "\nRecent Events:"
k8shell get events --all-namespaces --sort-by=.metadata.creationTimestamp | tail -10

# Resource usage
echo -e "\nResource Usage:"
k8shell top nodes
```

### Backup Script

```bash
#!/bin/bash
# backup.sh - Automated cluster backup

BACKUP_DIR="./backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backup in: $BACKUP_DIR"

# Backup all namespaces
for ns in $(k8shell get namespaces -o name | cut -d/ -f2); do
  echo "Backing up namespace: $ns"
  mkdir -p "$BACKUP_DIR/$ns"
  
  k8shell get all -n $ns -o yaml > "$BACKUP_DIR/$ns/all.yaml"
  k8shell get configmaps -n $ns -o yaml > "$BACKUP_DIR/$ns/configmaps.yaml"
  k8shell get secrets -n $ns -o yaml > "$BACKUP_DIR/$ns/secrets.yaml"
done

# Backup cluster-wide resources
echo "Backing up cluster resources..."
k8shell get nodes -o yaml > "$BACKUP_DIR/nodes.yaml"
k8shell get persistentvolumes -o yaml > "$BACKUP_DIR/persistentvolumes.yaml"
k8shell get storageclasses -o yaml > "$BACKUP_DIR/storageclasses.yaml"

echo "Backup completed: $BACKUP_DIR"
```

## Log Analysis

### Centralized Logging

```bash
# Aggregate logs from multiple pods
kubectl get pods -l app=my-app -o name | \
  xargs -I {} k8shell logs {} --since=1h > aggregated-logs.txt

# Real-time log monitoring
k8shell logs -l app=my-app --follow --max-log-requests=10

# Filter logs by patterns
k8shell logs my-pod | grep ERROR
k8shell logs my-pod | grep -i "exception\|error\|fail"
```

### Performance Analysis

```bash
# Monitor resource usage over time
while true; do
  echo "$(date): $(k8shell top pod my-pod --no-headers)"
  sleep 60
done > resource-usage.log

# Analyze startup times
k8shell get events --field-selector involvedObject.name=my-pod | \
  grep -E "(Scheduled|Pulled|Created|Started)"
```

These examples demonstrate common K8Shell usage patterns that can be adapted to your specific needs and environment.