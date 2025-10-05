---
sidebar_position: 2
---

# Comminication Flows 

This document describes the flow between **SSH Client**, **SSH Proxy**, **Identity**, **Provisioner**, and **k8shelld**.Please refer to the [architecture overview](Architecture) for component details.

The flow is divided into three phases:  

1. [User Discovery and Onboarding](#user-discovery-and-onboarding)  
2. [Workspace Provisioning](#workspace-provisioning)  
3. [SSH Channels Communication](#ssh-channels-communication)  

## User Discovery and Onboarding

Users connect to SSH Proxy using a *user string* that contains their username and configuration parameters like blueprint name or repository details (see [User string specification](user-string) for details). SSH Proxy parses this user string to extract the username and parameters, then looks up the corresponding internal user identity. 

When no user identity is found, SSH Proxy checks whether the user can be onboarded through available identity providers. If onboarding is supported, it automatically initiates the onboarding process. When authentication fails, SSH proxy publishes the failed authentication attempt via NATS messaging middleware. See [IP Address Protection](ip-protection) for more details.


The following diagram shows the communication flow for user discovery and onboarding.

```mermaid
%%{init:{ "theme": "base", "fontSize": 26 }}%%
sequenceDiagram
    autonumber
    participant C as SSH Client
    participant P as SSH Proxy
    participant I as Identity Service
    participant G as Identity Provider<br/>(GitHub)

    C->>P: Open SSH connection (handshake)
    note right of P: Parse login (user~bp@addr)

    %% Find user 
    P->>I: Find user
    alt User found
        I-->>P: User
    else User not found
        P->>I: Start onboarding<br/>(device flow)
        I-->G: Request OAuth device code
        G-->>I: Device, user code
        I-->>P: User code
        P-->>C: SSH keyboard-interactive<br/>(show user code, URL) 
        alt Onboarding successful
            G-->>I: Token (polling)
            I-->>P: User created
        else Onboarding failed
            I-->>P: No user
            P-->>C: Access denied
        end
    end

    %% Key verification with GitHub
    P->>I: Auth public key
    I->>G: Verify with GitHub
    G-->>I: Verification result
    I-->>P: Auth result

    P-->>C: Access granted / denied
```

## Workspace Provisioning 

Users can request workspace access through the user string in two ways: by specifying a blueprint name, or by specifying a Git repository name (for users onboarded via identity providers like GitHub). The Provisioner service manages workspace blueprints and retrieves blueprint definitions from Git repositories. SSH Proxy uses the user string to check if the requested workspace is running and requests to provision it when necessary.

The following diagram shows the communication flow for workspace provisioning. For more details on how the Provisioner service retrieves blueprint information and provisions workspaces, see the Provisioner service documentation.

```mermaid
%%{init:{ "theme": "base", "fontSize": 26 }}%%
sequenceDiagram
    autonumber
    participant C as SSH Client
    participant P as SSH Proxy
    participant R as Provisioner
    participant K8s as Kubernetes API

    P->>R: Get workspace for user and blueprint
    R->>K8s: Find workspace
    K8s-->>R: Workspace details
    alt Workspace running
        R-->>P: Workspace status (ip, tlsCert)
    else Workspace not running
        P->>R: Provision workspace (user string)
        R->>K8s: Create workspace resources
    end

    note over P,K8s: Workspace provisioning events (stream)
    alt Failure
        R-->>P: Failed {reason}
        P-->>C: Report failure
    else Running
        K8s-->>R: Pod Ready, IP, TLS cert
        R-->>P: Workspace status {ip, tlsCert}
    end
```

## SSH Channels Communication

SSH Proxy accepts SSH channel requests and establishes connections with the workspace k8shelld process. Using workspace status details that contain the workspace IP address and TLS certificate, it connects to k8shelld via gRPC protocol on TCP port `2822` and calls the `handshake` operation. 

After the handshake completes, SSH Proxy creates a new SSH session with the Identity service that tracks session information such as SSH Proxy ID, process ID, and workspace name. It uses the SSH session ID to send periodic updates including ingress and egress data volumes, client IP, and client type information. 

SSH Proxy supports session and direct TCP/IP channels. 

### Session Channels

Session channels support shell access with or without PTY, SSH agent forwarding, environment variable requests, command execution, and SFTP/SCP requests. SSH Proxy reads and writes channel data to k8shelld using corresponding gRPC services.

The following diagram shows the communication flow in a session channel after the handshake is completed. 

```mermaid
%%{init:{ "theme": "base", "fontSize": 26 }}%%
sequenceDiagram
    autonumber
    participant C as SSH Client
    participant P as SSH Proxy
    participant K as k8shelld/<br/>shell process
    participant I as Identity

    note over C,K: Open session channel and handle requests
    
    C->>P: Open session channel
    P-->>C: Accepted

    C->>P: Channel request (PTY, env, agent-forward)
    P-->>C: Accepted

    P->>K: start shell, exec, sftp, scp
    
    note over C,K: Data Exchange
    loop Data transfer
        alt Client to shell
            C->>P: stdin data
            P->>K: Write to stdin stream
            P-->>I: Report ingress
        else Shell to client
            K->>P: Read from stdout/stderr stream
            P->>C: stdout data
            P-->>I: Report egress
        end
    end    

    note over C,K: Resize terminal (shell with PTY)

    C->>P: Terminal size {width, height}
    P->>K: Set terminal size {width, height}
```

### File Transfer 

SFTP and SCP are handled using k8shelld `exec` operations when the corresponding binary (`sftp` or `scp`) is executed directly in the workspace. Both binaries must be present in the workspace as part of the container image. SFTP is installed automatically during workspace initialization, while scp must be pre-installed in the image. Note that scp is a legacy protocol that many modern operating systems have replaced with SFTP.

### Agent Forwarding

Agent forwarding lets processes inside the workspace request signatures from the SSH agent on the user’s machine. When the SSH client requests agent forwarding (`auth-agent-req@openssh.com`), the SSH Proxy (via k8shelld) creates a Unix domain socket at `/var/run/ssh-agent-ux-{proxy-id}-{proxy-pid}-{channel-num}.sock` in the workspace and sets the environment variable `SH_AUTH_SOCK` for the session. 

The following sequence diagram shows how agent forwarding works in the workspace when a user uses a GIT CLI to clone a remote repository e.g. `git clone git@github.com:user/repo.git` for which there exists a key on the host machine. This assumes that the session with `auth-agent-req@openssh.com` request has been established. 

```mermaid
%%{init:{ "theme": "base", "fontSize": 26 }}%%
sequenceDiagram
    autonumber
    participant C as Client<br/>(SSH Client and Agent)
    participant P as SSH Proxy
    participant K as k8shelld/<br/>Git CLI
    participant R as Git Server

    note over C,R: Agent forwarding session established

    K->>K: Read SSH_AUTH_SOCK env var
    K->>P: Connect to Unix socket /var/run/ssh-agent-ux-*
    P->>C: Forward agent request
    C->>C: Request SSH identities<br/>with SSH agent
    C-->>P: Forward identities
    P-->>K: Return identities to Git

    K->>R: SSH connection to Git server
    R->>K: SSH challenge (public key auth)
    K->>P: Request signature via Unix socket
    P->>C: Forward signature request
    C->>C: Sign challenge with private key
    C-->>P: Forward signature
    P-->>K: Return signature to Git
    K->>R: Send signed response
    R-->>K: Authentication successful
```
