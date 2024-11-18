# Communication

The following diagrams show interactions between the **client**, **k8shell-proxy**, **authentication services**, **workspace**, and **storage services**. For brevity, we omit the Kubernetes system services used to manage the Kubernetes resources, such as pods, services, and deployments.

## Client and user identity

The client is any standard client that uses the SSH protocol to connect to the remote system. This can be a standard SSH command-line utility or an IDE such as VSCode or IntelliJ. Such IDEs only use the base setup with SSH capabilities and do not require any third-party plugins to be installed. The client may use various SSH options such as the `-L` or `-D` options to create an SSH tunnel between the local and remote hosts, or the `-A` option to enable SSH agent forwarding with the remote session. 

```{note}
The client initiates the connection using the user’s identity and the remote address. Since the client must specify the workspace to connect to, and there is only a single entry point to the system defined by the remote address, the user identity is formatted as a tilde-delimited value combining the username and workspace blueprint name. For example, the identity `charles~am1` indicates the username is `charles` and the workspace blueprint name is `am1`. 
```

## Authentication and Authorization

The following diagram depicts the process of authenticating and authorizing the user by using the authentication service interface. The k8shell-proxy defines this interface to integrate the authentication process with a third-party services, such as LDAP or GitHub. 

```{mermaid}
%%{    
    init: {
        'theme': 'neutral',
        'themeVariables': {
            'fontSize': '40px'
        },
        'config': {
            'mirrorActors': false, 
            'showSequenceNumbers': true, 
            'height': 40, 
            'width': 120,
            'fontSize': 20
        }
    }
}%%
sequenceDiagram
    participant C as Client
    participant S as k8shell-proxy
    participant A as Auth services
    participant W as Workspace
    participant X as Storage
    
    C->>S: ssh charles~am1@acme.k8shell.io
    activate S
        S->>A: get user info
            activate A
                A->>S: user info
            deactivate A
            S-->>C: not authorized
        S->>A: check user key
            activate A
                A->>S: auth result
            deactivate A
        S-->>C: not authorized
    deactivate S
    note right of C: ↓ channels handling
```

* In &#x2776;, the client opens the SSH connection with the remote host. In the example, we use the address `acme.k8shell.io` that points to a load balancer providing an access to Kubernetes cluster. 

* In &#x2777;, the k8shell-proxy accepts the connection and starts a new process to handle it. Using a separate process for each connection provides several advantages, including enhanced isolation of connections and improved concurrency. This approach ensures that each connection is independently managed, which increases security by preventing issues in one connection from affecting others. Additionally, it allows multiple connections to be handled simultaneously without performance degradation. 

* In &#x2778;, the k8shell-proxy parses the user identity from the SSH connection and looks up the user in the authentication service. When the user is not a valid user or has no permissions to use the workspace blueprint, the process fails (&#x2779;).  

* In &#x277A;, &#x277B;, &#x277C; the k8shell proxy verifies the user's provided credentials such as a password or a key. The key may be retrieved from an external authentication service where the user stores a public key. If the user's provided key and the public key stored in the system do not match, the k8shell-proxy responds to the client with an authentication failure. 

## Channel Handling

If the user is authorized, the system opens a WebSocket stream with the workspace pod (&#x2779;). The workspace pod is a Kubernetes pod that runs a container with the user's environment. The system then facilitates the communication between the client and the workspace pod. The client can send commands to the workspace pod, and the workspace pod can send responses back to the client. The system also handles file transfers between the client and the workspace pod. The system uses a storage service to store and retrieve files. The storage service is a Kubernetes pod that runs a container with a storage backend, such as MinIO or S3. The storage service provides an API for storing and retrieving files. The system uses this API to transfer files between the client and the workspace pod.

```{mermaid}
%%{    
    init: {
        'theme': 'neutral',
        'themeVariables': {
            'fontSize': '40px'
        },
        'config': {
            'mirrorActors': false, 
            'showSequenceNumbers': true, 
            'height': 40, 
            'width': 120,
            'fontSize': 20
        }
  }}%%
sequenceDiagram
    participant C as Client
    participant S as k8shell-proxy
    participant A as Auth services
    participant W as Workspace
    participant X as Storage
    activate S
        rect rgb(250, 250, 250)
        note right of C: login,exec,sftp,portforward
        C->>S: open channel
        alt provision workspace?
            S->>X: provision storage (CSI driver)
            S->>W: provision workspace
            activate W
                X-->>W: mount storage
        end
        C<<->>S: channel stream
        S<<->>W: websocket stream
        deactivate W
        end
    deactivate S
```




