# k8shell Operator

```{abstract}
k8shell Operator is a Kubernetes operator that manages the lifecycle of workspaces and their resources. 
```

## Workspace provisioning

Workspace provisioning is the process of creating and configuring a workspace in a Kubernetes cluster. The operator uses custom resource definitions (CRDs) *blueprint* and *workspace*. The blueprint defines configuration such as workspace image, user definitions, storage requirements, workspace init scripts, etc. The workspace CRD is used to create a workspace instance based on the blueprint. The blueprint may also contain Docker configuration, which allows users to build, run, and manage containers inside the workspace. Provisioning typically takes 4-6 seconds, depending on the container image size and initialization script complexity.

The workspace provisioning process involves the following steps:

1. **Instantiation of the workspace blueprint:** The operator processes the workspace blueprint for the user requesting access. This step generates user-specific values such as username, read/write permissions, and workspace name.

2. **Helm chart installation:** The Helm chart, containing the Kubernetes resources that define the workspace, is installed in the specified Kubernetes namespace. These resources include the workspace pod with requested container definitions, service account, persistent volume claims, initialization scripts, access token for SSH proxy to access workspace GRPC API, and other necessary components. 

3. **Running init containers:** The workspace pod uses a single init container which copies copies three binaries to the workspace filesystem, namely **k8shelld**, **kbox** and **sftp** server. 

4. **Running k8shell-main container:** After init container finishes the work, the k8shell-main container is started using **k8shelld** init process. 

