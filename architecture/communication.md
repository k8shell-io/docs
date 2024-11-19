# Communication

The following diagrams show interactions between the **client**, **k8shell-proxy**, **authentication services**, **workspace**, and **storage services**. For brevity, we omit the Kubernetes system services used to manage the Kubernetes resources, such as pods, services, and deployments.

## Client and user identity

The client is any standard client that uses the SSH protocol to connect to the remote system. This can be a standard SSH command-line utility or an IDE such as VSCode or IntelliJ. Such IDEs only use the base setup with SSH capabilities and do not require any third-party plugins to be installed. The client may use various SSH options such as the `-L` or `-D` options to create an SSH tunnel between the local and remote hosts, or the `-A` option to enable SSH agent forwarding with the remote session. 

```{note}
The client initiates the connection using the user’s identity and the remote address. Since the client must specify the workspace to connect to, and there is only a single entry point to the system defined by the remote address, the user identity is formatted as a tilde-delimited value combining the username and workspace blueprint name. For example, the identity `charles~am1` indicates the username is `charles` and the workspace blueprint name is `am1`. 
```

## Authentication and Authorization

The following diagram illustrates the user authentication and authorization process using defined interfaces. These interfaces, established by the K8shell proxy, enable seamless integration with third-party services like LDAP, GitHub or proprietary solutions.

```{mermaid}
:config: { "theme": "neutral", "mirrorActors": false, "height": 50, "showSequenceNumbers": true, "width": 150, "fontSize": 22 }
sequenceDiagram
    participant C as Client
    participant S as k8shell-proxy
    participant A as Auth services
    participant W as Workspace
    participant X as Storage
    
    C->>S: ssh charles~am1@acme.k8shell.io
    activate S
        S->>A: find user
            activate A
                A->>S: user
            deactivate A
            S-->>C: not authorized
        S->>A: check user credentials
            activate A
                A->>S: auth result
            deactivate A
        S-->>C: not authorized
    deactivate S
    note right of C: ↓ channel handler
```

* In step &#x2776;, the client opens the SSH connection with the remote host. In the example, we use the address `acme.k8shell.io` that points to a load balancer providing an access to Kubernetes cluster. The k8shell-proxy accepts the connection and starts a new process to handle it. Using a separate process for each connection provides several advantages, including enhanced isolation of connections and improved concurrency. This approach ensures that each connection is independently managed, which increases security by preventing issues in one connection from affecting others. Additionally, it allows multiple connections to be handled simultaneously without performance degradation. 

* n step &#x2777;, the k8shell-proxy extracts the user identity (username and workspace blueprint) from the SSH connection and validates it with the Auth service. This ensures the user is authorized and permitted to access the specified blueprint. If the user fails validation or lacks the necessary permissions, the connection is rejected as shown in step &#x2779;.

* In steps &#x277A;, &#x277B;, &#x277C; the k8shell proxy verifies the user's provided credentials such as a password or a key. The key may be retrieved from an external authentication service where the user stores a public key. If the user's provided key and the public key stored in the system do not match, the k8shell-proxy responds to the client with an authentication failure. 

## SSH Channel Flow

SSH provides various capabilities via channels. There are four channel types that ssh proxy supports, namely interactive login sessions, remote execution of commands, forwarded TCP/IP connections and SFTP subsystem. There may be multiple channels of different types multiplexed into a single connection. This section describes the general flow how ssh proxy handles a channel and activities it performs.

```{mermaid}
:config: { "theme": "neutral", "mirrorActors": false, "height": 50, "showSequenceNumbers": true, "width": 150, "fontSize": 22 }
sequenceDiagram
    participant C as Client
    participant S as k8shell-proxy
    participant A as Auth services
    participant W as Workspace
    participant X as Storage
    activate S
        C->>S: open channel:<br/>shell,exec,sftp,pf
        S->>A: check channel permissions
        S-->>C: reject channel
        rect rgb(240, 240, 240)
            note right of S: provision workspace?
            S->>W: provision workspace (incl. storage)
            activate W
                X-->>W: mount storage
        end
        activate S
            C<<->>S: channel data
            note right of S: channel handler
            S<<->>W: websocket stream
        deactivate S
        deactivate W
        S->>C: close channel
    deactivate S
```

* In steps &#x2776;, &#x2777; and &#x2778; the client opens a channel of a specific type with the server. The proxy verifies that the user has permissions to use the channel type and sends back the response.

* In steps &#x2779; and &#x277A;, the proxy checks whether a workspace for the requested blueprint already exists. If it does not, the proxy creates the workspace using the Helm chart defined in the blueprint and additional parameters. During this process, Kubernetes provisions the necessary persistent volumes via the specified storage class and driver. This results in the creation of several Kubernetes resources, including the workspace pod with defined container images and mounted volumes, access keys for workspace utilities to interact with the proxy API, installation scripts, and more.

* In steps &#x277B;, &#x277C; and &#x277D;, the proxy initializes a channel handler for a specific channel type, facilitating communication between the client and the workspace. The handler first establishes a WebSocket stream with the workspace pod through the Kubernetes API. While each of the four channel handler types has unique internal handling processes, they all share the core functionality of performing read and write operations on both the SSH channel and the WebSocket stream. This process transforms SSH channel communication into WebSocket stream communication and vice versa. 

```{note}
The implementation of the channel handler is a critical component of the proxy, directly influencing SSH communication performance and client-perceived latency. To enhance efficiency, we optimized key handler parameters, including buffer sizes, thread types and counts, and the transformation protocol. These adjustments were tailored to meet the performance requirements of commonly used clients and IDEs, ensuring smooth and responsive interactions.
```

### Port Forwarding

Port forwarding is a feature provided by the SSH protocol that allows the SSH client to forward TCP/IP connections from a local port to a remote host. The ssh-proxy supports port forwarding for local ports. 

```{mermaid}
:config: { "theme": "neutral", "mirrorActors": false, "height": 50, "showSequenceNumbers": true, "width": 150, "fontSize": 22 }
sequenceDiagram
    participant LP as Local Process
    participant C as Client
    participant P as Proxy
    participant PF as Port Forwarder
    participant W as Workspace Pod<br/>(remote process)

    C->>P: open connection<br/>ssh -L or ssh -D
    note right of LP: ↓ SSH tunnel
    LP->>P: open HTTP connection (:8080)
    activate LP
    P->>PF: create<br/>port forward channel
    activate PF
    loop
    LP->>PF: request
    PF->>W: forward request
    activate W
    W-->>PF: response
    deactivate W
    PF-->>LP: response
    end
    W<<-->>PF: close HTTP conn.
    PF-->>LP: close HTTP conn. 
    deactivate LP
    deactivate PF
```

* In step &#x2776;, the client opens an SSH connection with the `-L` or `-D` option to enable port forwarding. The client specifies the local port to forward to the remote host. This creates an SSH tunnel between the client and the proxy.

* In step &#x2777;, the local process opens an HTTP connection on port 8080. In step &#x2778;, the proxy creates a port forwarder channel handler to handle the port forwarding request.

* In steps &#x2779;, the local process sends a request to the local port. The port forwarder receives the request and forwards it to the remote process running in the workspace pod (step &#x277A;). The remote process processes the request and sends a response back (step &#x277B;, &#x277C;).

* The steps &#x2779; to &#x277C; are repeated for each request sent by the local process until the connection is closed either by the local process or the remote process (steps &#x277D;, &#x277E;).

The port forward algorithm handles all port forward channels in a single SSH connection, which can be shared by all clients running on the user host. For example, if a user starts a HTTP/1.1 web server in the workspace listening on `127.0.0.1:9090`, creates a port forwarding using `ssh -L 8080::9090 acme.k8shell.io`, and points a browser to `http://localhost:8080`, the browser may create up to 6 sockets that correspond to 6 channels in the proxy. When the user opens another browser session on the same address, the new session opens an additional 6 channels/sockets. In a typical scenario, users would only open a single browser session. 

```{note}
We designed the port forwarding algorithm to handle large number of channels, however, there is an upper limit of the number of port forwarding threads that the proxy can create for a single SSH connection. When the number of channels exceeds the limit, the requests are queued and processed in a FIFO manner. This ensures that the system remains responsive and performs well under various conditions.
```

### Agent Forwarding

SSH agent forwarding is a feature provided by the SSH protocol that allows the SSH agent running on the user’s machine to connect with the SSH client running on a remote machine. It is used primarily during interactive login sessions. When the user requests SSH agent forwarding (e.g., using the -A option on the SSH CLI), the ssh-proxy, after verifying the user’s permissions, starts the Agent Forwarder in a dedicated thread within the proxy. Its primary function is to serve as a proxy between a Unix socket in the workspace pod and the SSH agent running on the client host. The SSH client in the workspace pod then communicates with the SSH agent via the Unix socket, enabling it to request key authentication with remote hosts.

```{mermaid}
:config: { "theme": "neutral", "mirrorActors": false, "height": 50, "showSequenceNumbers": true, "width": 150, "fontSize": 22 }
sequenceDiagram
    participant C as Client (Charles)
    participant P as Proxy
    participant AF as Agent<br/>Forwarder
    participant W as Workspace Pod
    participant G as GitHub

    C->>P: open connection<br/>ssh -A
    note right of C: ↓ shell handler
    P->>AF: start agent forwarder<br>thread
    W->>G: clone repository 
    G->>W: connection request
    W->>AF: request authentication 
    AF->>C: request private key
    C->>AF: provide key details
    AF->>W: forward key details 
    W->>G: authenticate with key
    G-->>W: repository data
```

* In step &#x2776;, user Charles opens ssh connection with `-A` option. The proxy creates the handler for the shell channel and starts the Agent Forwarder thread (step &#x2777;).

* In step &#x2778;, user Charles clones a github repository (e.g. `git@github.com:charles/repo.git`) from the workspace pod. 

* In steps &#x2779;, &#x277A; and &#x277B;, the git requests key details with the SSH agent running on Charles' host via the Agent Forwarder.

* In step &#x277C;, the SSH agent provides the necessary key details for authentication with GitHub.

```{note}
It’s important to note that SSH agent forwarding is a standard SSH feature that our ssh-proxy implements at the protocol level. When users utilize this feature, they do not need to copy their private keys to the workspace pod to access remote systems, such as cloning git repositories. If users have security concerns, they can disable SSH agent forwarding or implement additional security measures, such as requiring explicit approval requests on the SSH agent host before providing the respective key. 
```