# Communication

The following diagram shows interactions between the client, k8shell-proxy, authentication services, workspace, and storage services. The communcation consists of an initial phase where the client opens a connection to the proxy and exchanges keys. The proxy then checks the user's authorization and, if successful, opens a WebSocket stream with the workspace pod and facilitates the communication with the channel. 

hello 
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
    C->>S: open, key exchange
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
        rect rgb(250, 250, 250)
        note right of C: channels handling
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

## Opening Connection, Authentication and Authorization

The client is any standard client that uses the SSH protocol to connect to the remote system. This can be a standard SSH command-line utility or an IDE such as VSCode or IntelliJ. Such IDEs only use the base setup with SSH capabilities and do not require any third-party plugins to be installed. The client may use various SSH options such as the `-L` or `-D` options to create an SSH tunnel between the local and remote hosts, or the `-A` option to enable SSH agent forwarding with the remote session. 

The client uses the user identity and the remote address to start the connection (&#x2776;). As the client needs to specify which workspace it wants to connect to and there is only a single entry point to the system defined by the remote address, the user identity is a slash-delimited value of a username and a workspace blueprint name. For example, an identity `charles~am1` container user name `charles` and a workspace blueprint name `am1`. The system retrieves the user information from an authorization service (&#x2777;) which in turn checks the user's identity and returns the user's information. If the user is not authorized, the system closes the connection (&#x2778;).



