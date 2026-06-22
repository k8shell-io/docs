# k8shell CLI

The `k8shell` CLI is the primary command-line tool for interacting with a k8shell [api-server](../api-server/). It lets you authenticate, manage workspaces, inspect users, and review session history — all from the terminal. The CLI stores its configuration in `~/.config/k8shell/config.yaml` and supports multiple named contexts so you can switch between different server environments without re-authenticating.

<!-- picture goes here -->

## Logging in

`k8shell` authenticates using a [Personal Access Token (PAT)](/concepts/identity/tokens#personal-access-token-pat). Rather than creating a PAT manually, the CLI requests one automatically: it contacts the server, presents the available [identity providers](/concepts/identity/providers), and opens a browser so you complete the OAuth flow. Once login succeeds, the PAT is created on the server and saved to a local context.

```
$ k8shell login --server https://app.k8shell.io
Available login providers:
  1) github
  2) gitlab
Select provider [1]: 1
Opening browser for login...
Waiting for login to complete... done.
Logged in as bruckins. Context "app.k8shell.io-e2edc0ff" saved and set as active.
```

:::info
By default, the CLI enforces one context per server — running `k8shell login` for a server that already has a context will fail with an error. Use `--ignore` to bypass this restriction, which allows multiple contexts for the same server (for example, different usernames on the same instance).
:::

## Contexts

A **context** stores a server URL and the associated credentials. You can have multiple contexts — for example, one per environment — and switch between them as needed.

```bash
# list all configured contexts
k8shell context list

# switch the active context
k8shell context use prod

# remove a context
k8shell context delete staging
```

If you have a PAT already, you can add a context without going through the browser:

```bash
k8shell context add prod --server https://app.k8shell.io --token <pat>
```

Omitting `--token` prompts for it securely. Any command accepts `-c <name>` to use a different context without changing the active one.

### Configuration file

Contexts are stored in `~/.config/k8shell/config.yaml`:

```yaml
current-context: app.k8shell.io
contexts:
  - name: app.k8shell.io-e2edc0ff
    server: https://app.k8shell.io
    token: k8sh_AQlQvU04ENnZTaB8PCBguOrIeHVMyEp0JdO4FHB8RRE
    username: bruckins
    tokenHash: 38c57dcaa2302f293cb0149380c89db98f3f9c90caa1f28df60f9f46349a2152
```

`username` is retrieved automatically after login or `context add` via the [profile API endpoint](/concepts/api-server/api#users). `tokenHash` is a SHA-256 hash of the server name and username, used internally to identify the context.

## Global flags

These flags apply to all commands:

<StandardInlineTable data={`
columns:
  - header: Flag
    width: 200px
  - header: Description
rows:
  - - "\`-c, --context\`"
    - "Override the active context for this command."
  - - "\`--json\`"
    - "Output results as JSON."
  - - "\`--debug\`"
    - "Print request and response headers to stderr."
  - - "\`--insecure\`"
    - "Skip TLS certificate verification."
  - - "\`--no-ansi\`"
    - "Disable ANSI color output."
  - - "\`-w, --wrap\`"
    - "Allow output lines to wrap beyond terminal width."
  - - "\`--config\`"
    - "Use an alternate config file (default: \`~/.config/k8shell/config.yaml\`)."
`} />

## Shell completion

`k8shell` can generate shell completion scripts for bash, zsh, fish, and PowerShell.

```bash
# bash (add to ~/.bashrc)
source <(k8shell completion bash)

# zsh (add to ~/.zshrc)
source <(k8shell completion zsh)

# fish
k8shell completion fish > ~/.config/fish/completions/k8shell.fish
```
