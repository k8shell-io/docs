# Communication flows

```{abstract}
K8shell services are accessed through the k8shell-proxy, which manages authentication, workspace provisioning, and communication using the standard secure shell protocol.
```

The following diagrams illustrate the end-to-end SSH communication flow, involving the **client**, **k8shell-proxy**, **authentication services**, **workspace**, and **storage services**. For simplicity, Kubernetes system services used to manage resources like pods, services, and deployments are not shown.

## Client and user identity

The client is any standard client that uses the SSH protocol to connect to the remote system. This can be a standard SSH command-line utility or an IDE such as VSCode or IntelliJ. Such IDEs only use the base setup with SSH capabilities and do not require any third-party plugins to be installed. The client may use various SSH options such as the `-L` or `-D` options to create an SSH tunnel between the local and remote hosts, or the `-A` option to enable SSH agent forwarding with the remote session. 

```{note}
The client initiates the connection using the user’s identity and the remote address. Since the client must specify the workspace to connect to, and there is only a single entry point to the system defined by the remote address, the user identity is formatted as a tilde-delimited value combining the username and workspace blueprint name. For example, the identity `charles~am1` indicates the username is `charles` and the workspace blueprint name is `am1`. 
```

## Authentication and Authorization

The following diagram illustrates the user authentication and authorization process using defined interfaces. These interfaces, established by the k8shell-proxy, enable seamless integration with third-party services like LDAP, GitHub or proprietary solutions.

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

* In step {c}`1`, the client opens the SSH connection with the remote host. In the example, we use the address `acme.k8shell.io` that points to a load balancer providing an access to Kubernetes cluster. The k8shell-proxy accepts the connection and starts a new process to handle it. Using a separate process for each connection provides several advantages, including enhanced isolation of connections and improved concurrency. This approach ensures that each connection is independently managed, which increases security by preventing issues in one connection from affecting others. Additionally, it allows multiple connections to be handled simultaneously without performance degradation. 

* n step {c}`2`, the k8shell-proxy extracts the user identity (username and workspace blueprint) from the SSH connection and validates it with the Auth service. This ensures the user is authorized and permitted to access the specified blueprint. If the user fails validation or lacks the necessary permissions, the connection is rejected as shown in step {c}`4`.

* In steps {c}`5`, {c}`6`, {c}`7` the k8shell-proxy verifies the user's provided credentials such as a password or a key. The key may be retrieved from an external authentication service where the user stores a public key. If the user's provided key and the public key stored in the system do not match, the k8shell-proxy responds to the client with an authentication failure. 

## SSH Channel Flow

SSH provides various capabilities via channels. There are four channel types that the k8shell-proxy supports, namely interactive login sessions, remote execution of commands, forwarded TCP/IP connections and SFTP subsystem. There may be multiple channels of different types multiplexed into a single connection. This section describes the general flow how k8shell-proxy handles a channel and activities it performs.

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

* In steps {c}`1`, {c}`2` and {c}`3` the client opens a channel of a specific type with the server. The k8shell-proxy verifies that the user has permissions to use the channel type and sends back the response.

* In steps {c}`4` and {c}`5`, the k8shell-proxy checks whether a workspace for the requested blueprint already exists. If it does not, the k8shell-proxy creates the workspace using the Helm chart defined in the blueprint and additional parameters. During this process, Kubernetes provisions the necessary persistent volumes via the specified storage class and driver. This results in the creation of several Kubernetes resources, including the workspace pod with defined container images and mounted volumes, access keys for workspace utilities to interact with the k8shell-proxy API, installation scripts, and more.

* In steps {c}`6`, {c}`7` and {c}`8`, the k8shell-proxy initializes a channel handler for a specific channel type, facilitating communication between the client and the workspace. The handler first establishes a WebSocket stream with the workspace pod through the Kubernetes API. While each of the four channel handler types has unique internal handling processes, they all share the core functionality of performing read and write operations on both the SSH channel and the WebSocket stream. This process transforms SSH channel communication into WebSocket stream communication and vice versa. 

```{note}
The implementation of the channel handler is a critical component of the k8shell-proxy, directly influencing SSH communication performance and client-perceived latency. To enhance efficiency, we optimized key handler parameters, including buffer sizes, thread types and counts, and the transformation protocol. These adjustments were tailored to meet the performance requirements of commonly used clients and IDEs, ensuring smooth and responsive interactions.
```

### Port Forwarding

Port forwarding is a feature provided by the SSH protocol that allows the SSH client to forward TCP/IP connections from a local port to a remote host. The k8shell-proxy supports port forwarding for local ports. 

```{mermaid}
:config: { "theme": "neutral", "mirrorActors": false, "height": 50, "showSequenceNumbers": true, "width": 150, "fontSize": 22 }
sequenceDiagram
    participant LP as Local Process
    participant C as Client
    participant P as k8shell-proxy
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

* In step {c}`1`, the client opens an SSH connection with the `-L` or `-D` option to enable port forwarding. The client specifies the local port to forward to the remote host. This creates an SSH tunnel between the client and the k8shell-proxy.

* In step {c}`2`, the local process opens an HTTP connection on tcp port `8080`. In step {c}`3`, the k8shell-proxy creates a port forwarder channel handler to handle the port forwarding request.

* In steps {c}`4`, the local process sends a request to the local port. The port forwarder receives the request and forwards it to the remote process running in the workspace pod (step {c}`5`). The remote process processes the request and sends a response back (step {c}`6`, {c}`7`).

* The steps {c}`4` to {c}`7` are repeated for each request sent by the local process until the connection is closed either by the local process or the remote process (steps {c}`8`, {c}`9`).

The port forward algorithm handles all port forward channels in a single SSH connection, which can be shared by all clients running on the user host. For example, if a user starts a HTTP/1.1 web server in the workspace listening on `127.0.0.1:9090`, creates a port forwarding using `ssh -L 8080::9090 acme.k8shell.io`, and points a browser to `http://localhost:8080`, the browser may create up to 6 sockets that correspond to 6 channels in the k8shell-proxy. When the user opens another browser session on the same address, the new session opens an additional 6 channels/sockets. In a typical scenario, users would only open a single browser session. 

```{note}
We designed the port forwarding algorithm to handle large number of channels, however, there is an upper limit of the number of port forwarding threads that the k8shell-proxy can create for a single SSH connection. When the number of channels exceeds the limit, the requests are queued and processed in a FIFO manner. This ensures that the system remains responsive and performs well under various conditions.
```

### Agent Forwarding

SSH agent forwarding is a feature provided by the SSH protocol that allows the SSH agent running on the user’s machine to connect with the SSH client running on a remote machine. It is used primarily during interactive login sessions. When the user requests SSH agent forwarding (by using the `-A` option on the SSH CLI), the k8shell-proxy, after verifying the user’s permissions, starts the Agent Forwarder in a dedicated thread within the k8shell-proxy. Its primary function is to serve as a reverse proxy between a Unix socket in the workspace pod and the SSH agent running on the client host. The SSH client in the workspace pod then communicates with the SSH agent via the Unix socket, enabling it to request key authentication with remote hosts.

```{warning}
SSH agent forwarding is a standard SSH feature that the k8shell-proxy implements at the protocol level. If users have security concerns, they can disable SSH agent forwarding on client side or implement additional security measures, such as requiring explicit approval requests on the SSH agent host before providing the respective key. 
```

```{mermaid}
:config: { "theme": "neutral", "mirrorActors": false, "height": 50, "showSequenceNumbers": true, "width": 150, "fontSize": 22 }
sequenceDiagram
    participant C as Client (Charles)
    participant P as k8shell-proxy
    participant AF as Agent<br/>Forwarder
    participant W as Workspace Pod
    participant G as GitHub

    C->>P: open connection<br/>ssh -A
    note right of C: ↓ shell handler
    P->>AF: start agent forwarder<br>thread
    AF->>W: create Unix socket
    W->>G: clone repository 
    G->>W: connection request
    W->>AF: request authentication 
    AF->>C: request private key
    C->>AF: provide key details
    AF->>W: forward key details 
    W->>G: authenticate with key
    G-->>W: repository data
```

* In step {c}`1`, user Charles opens a remote shell by initiating an SSH connection with the command `ssh -A charles~am1@acme.k8shell.io`. The k8shell-proxy processes this request by creating a handler for the shell channel, verifying Charles’ permissions for agent forwarding, and starting an Agent Forwarder thread (step {c}`2`). In step {c}`3`, the thread creates a Unix socket within the workspace, begins listening for incoming connections, and facilitates secure communication.

* In step {c}`4`, user Charles in the workspace pod has `SSH_AUTH_SOCK` environment variable set to the location of the unix socket. The user then clones a github repository by running `git clone git@github.com:charles/repo.git`. In steps {c}`5`, {c}`6` and {c}`7`, the git CLI that requires an access to the user's key, requests the key details from the SSH agent running on Charles' host via the Agent Forwarder. 

* In step {c}`8`, the SSH agent provides the necessary key details for authentication with GitHub.

## Docker 

The k8shell-proxy supports Docker in the workspace by enabling dind (Docker in Docker) container. The following diagram shows components involved in the Docker workflow in the workspace. Please note that K8shell-main and k8shell-dind are part of the workspace pod, local DNS is running in k8shell-dind container and registry is an external container registry service. For more details on the architecture please see the [Workspace architecure](workspace.md) and [k8shell-dind](workspace.md#k8shell-dind) sections.

```{mermaid}
:config: { "theme": "neutral", "mirrorActors": false, "height": 50, "showSequenceNumbers": true, "width": 150, "fontSize": 22 }
sequenceDiagram
    participant P as k8shell-proxy
    participant M as k8shell-main
    participant D as k8shell-dind
    participant N as local DNS
    participant R as Registry

    M->>M: docker pull
    activate M
        M->>P: get credentials
        P-->>M: username,password
        M->>D: authenticate, docker pull
        D->>R: authenticate, image pull
        R-->>D: image content, store image in filesystem
        D-->>M: image available
    deactivate M
    M->>D: docker run
    activate M
    activate D
        note right of D: container running
        D->>N: add entry to local DNS
        D-->>M: container running
    deactivate M
        M->>N: resolve container name
        activate M
            note left of M: access container<br/>process on container<br/>name and port
            N-->>M: container IP
            M->>D: access process
        deactivate M
    deactivate D
```

* In steps {c}`1`, {c}`2`, {c}`3`, and {c}`4`, the user in the workspace runs the docker pull command to fetch an image from the registry. The Docker CLI uses the credential helper configured in the workspace, which retrieves credentials via an API call to the k8shell proxy. In steps {c}`5`, {c}`6`, and {c}`7`, the Docker daemon authenticates the user with the registry and pulls the image, storing it in the workspace filesystem.

* In steps {c}`8`, {c}`9`, and {c}`10`, the user executes the docker run command to start a container. The Docker daemon creates the container, and the local DNS service retrieves the associated event, creating a DNS entry for the new container.

* In step {c}`11`, the user starts a local process in the workspace that connects to a container process by resolving its name and accessing a specific TCP port where the container process is listening. In step {c}`12`, the local DNS (`dnsmasq` service) resolves the container name to its IP address, enabling the local process to communicate with the container.

```{note}
The local DNS allows direct access to container processes from the workspace network. This works because the container IP is part of a subnet attached to the bridge interface accessible from the workspace network. The IP address is routable within the workspace network, enabling direct communication with container processes without exposing ports using Docker's `-P` option.
```

Users can access all Docker features within the workspace, including running containers, building images, and pushing them to a registry. While the k8shell proxy provides access to the system’s registered container registry, users can also configure the Docker CLI with their own credentials to use a custom registry.

