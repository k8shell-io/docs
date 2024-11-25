# Usage Guide

This section provides a guide to using the k8shell services for end-users.

## Prerequisites

Before you can start using the k8shell services, you need to have the following prerequisites:

* Account to access the k8shell services. The account must have necessary permissions to access required blueprint to provision a workspace and capabilities.

* If your account configuration in the system requires the authentication using SSH keys, you need to have a public key registered in the system to authenticate to the workspace.

```{note}
There are various options how the account can be configured that depends on the organization's requirements and authentication system used such as password authentication, SSH key authentication. There are various authentication systems that can be used such as organization-specific system or a standard GitHub, GitLab or LDAP, etc. 
```

## Accessing Workspaces

K8shell workspaces are accessible at the address workspaces.[k8shell.io] and TCP port 22 for SSH access. Depending on your account’s permissions in the system, you can connect to your workspaces using any SSH client, Visual Studio Code (VSCode) (with the SSH Remote plugin), or any SFTP client to transfer files to and from your workspace.

When accessing a workspace, you will need to provide your username along with the name of the workspace blueprint you wish to use. For example, the workspace blueprint “Development” can be abbreviated as `dev`. The first time you access a workspace, the system will automatically provision it. Once logged into the workspace, you will operate under the user `kate`, which is the default username for all workspaces. The kate user is non-privileged; however, depending on your account configuration, you may have sudo privileges. With sudo, you can install additional software, manage packages, and perform administrative tasks within your workspace.

### SSH Access

The SSH command to access your workspace is as follows:

```bash
ssh -i </path/to/key> <username>~<workspace>@workspaces.[k8shell.io]
```

where `</path/to/key>` is the path to your SSH private key stored on your computer (usually `~/.ssh/id_rsa`), `<username>` is your username, and `<workspace>` is the name of the workspace you want to access (e.g., `dev`, `test`, etc.).

For example, to access the workspace `dev` with the username `john`, and the private key `~/.ssh/id_rsa`:

```bash
ssh -i ~/.ssh/id_rsa john~dev@workspaces.k8shell.io
fit-workspaces v0.5.17
Last login: Mon Sep 16 14:43:30 2024 from 10.126.2.67

kate@dev-john:~$
```

After you run the command, you will be logged in to the workspace. The prompt will show you the username and workspace you are currently using. You can now start using the workspace by running commands in the terminal. Note that you can use almost any ssh option with the ssh command, such as `-L` or `-D` for port forwarding, `-A` for agent forwarding etc.

### SSH configuration

You can also configure your SSH client to access the workspaces without specifying the key and username each time. Add the following configuration to your `~/.ssh/config` file:

```bash
Host k8shell-workspaces
    HostName workspaces.k8shell.io
    PreferredAuthentications publickey
    User <username>~<workspace>
    Port 22
    IdentityFile /path/to/key
    ForwardAgent yes # if you want to forward your SSH agent
```

After adding the configuration, you can access the workspaces using the following command:

```bash
ssh k8shell-workspaces
```

You can also use this configuration to access other workspace by overriding the workspace name in the command:

```bash
ssh john~test@k8shell-workspaces
```

### SSH Port Forwarding

You can also use SSH port forwarding to access services running on the workspace from your local machine. For example, if you have a Web server running on the workspace listening on port `tcp/80`, you can forward the port to your local machine using the following command:

```bash
ssh -L 8080::80 john~dev@k8shell-workspaces
```

After running the command, you can access the Web server running on the workspace by opening `http://localhost:8080` in your browser.

### SSH Agent Forwarding

If you need to access other services that require SSH authentication, you can use SSH agent forwarding. To enable SSH agent forwarding, you need to add the `-A` option to the SSH command:

```bash
ssh -A john~dev@k8shell-workspaces
```

Note that this option can also be enabled in the SSH configuration by using `ForwardAgent yes` as described in the previous section. SSH agent forwarding allows you to use your local SSH keys to authenticate to other services from the workspace. The remote workspaces does not store your SSH keys, but it forwards the authentication requests to your local machine.

### VSCode

You can also access the workspaces using Visual Studio Code (VSCode). To do this, you can follow the [official documentation](https://code.visualstudio.com/docs/remote/ssh) on how to connect to a remote SSH server. You do not need to install any other plugins or extensions to connect to the k8shell workspaces.

Below are simple steps to connect to the k8shell workspaces:

1. Install the [Remote - SSH extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh) in VSCode.
2. Open the Command Palette (`Ctrl+Shift+P`) and run the `Remote-SSH: Connect to Host...` command.
3. Select `k8shell-workspaces` from the list of hosts (assuming you have the SSH configuration from the previous section).
4. You will be connected to the workspace.

Note that if you do not specify `User` in the SSH configuration, you will need to provide the username and workspace name in the `User` field in the VSCode connection dialog.

If you have VSCode `code` CLI installed on your computer, you can also open the VSCode directly from the terminal by running the following command:

```bash
code -n --folder-uri=vscode-remote://ssh-remote+john~dev@k8shell-workspaces/home/kate/workspace
```

When you connect to the workspace using VSCode, it will first install the VSCode server on the workspace, and then it will connect to the server using the SSH protocol's port forwarding. You use the VSCode like you would use it on your local machine. When you develop an application in VSCode and run it in the debug mode, the application will run on the workspace, but you can debug it from your local machine. VSCode will automatically forward the port your application is listening on to your local machine so you can access it from your browser.

## Git access

For development of your projects, you can use Git to manage your source code. You can access Git repositories using several methods. 

### SSH access

You can access Git repositories using SSH. When you access the workspace using SSH, you can use Git to clone, push, and pull repositories using the SSH protocol. For example, to clone a repository from GitLab, you can use the following command:

```bash
git clone git@github.com:<repo>.git
```

This approach requires that you have your SSH keys and Agent forwarding set up correctly. Please refer to the [SSH Access](#ssh-access) section.


### HTTPS access

If you prefer to use HTTPS to access Git repositories, you can use the HTTPS URL provided by GitHub. You can use the HTTPS URL to clone, push, and pull repositories using the HTTPS protocol. For example, to clone a repository from GitHub, you can use the following command:

```bash
git clone https://github.com/<repo>.git
```

When you use the HTTPS protocol, you will be prompted to enter your GitHub credentials (username and password or access token). You can create a personal access token in your GitHub account settings.

Repeating the process of entering your username and password/token can be cumbersome. To avoid this, you can use the Git credential manager to store your credentials. The Git credential manager will store your credentials and use them to authenticate you when you access the Git repository.

To store your credentials in the Git credential manager, you can use the following command:

```bash
git config --global credential.helper store
```

After running the command, Git will store your credentials in the `.git-credentials` file in your home directory. Note that the credentials will be stored in plain text, so make sure to secure your directory.


You can also use the token in the URL to avoid entering your credentials each time you access the repository. For example, to clone a repository using a personal access token, you can use the following command:

```bash
git clone https://<username>:<access_token>@github.com/<repo>
```

For more information on how to use personal access tokens, please refer to the [GitHub documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

## Workspace Usage

Please note that the workspace is ephemeral which means that when the workspace is deleted or restarted, any data stored in the workspace will be lost (such as when you install new package or software). Although the workspace should not be restarted often, it is recommended to store your data in the persistent volume mounted at `/home/kate/workspace` which will be available even if the workspace is restarted. Also, you should create scripts to automate the setup of your workspace to avoid manual setup each time your workspace will be restarted.

### Folder Structure

The default configuration of the workspace has the following folders:

- `/home/kate/workspace`: the main workspace folder where you can store your project files. Note that the `workspace` folder is mounted to a persistent volume, so your data will be preserved even if the workspace is restarted. The amount of storage available in the workspace depends on the workspace and account configuration.
- `/home/kate/shared`: a shared folder to provide various files by workspace administrator and is shared by all users of the same workspace type (blueprint). When you account has workspace admin privileges, you have read-write access to the shared folder, otherwise you have read-only access to the shared folder. 

### CPU and Memory

Each workspace has a limited amount of CPU and memory available. This limit is defined by the workspace blueprint configuration.

## Workspace Management

Once you are connected to the workspace, the workspace will be automatically created for you which usually takes around 4-5 seconds. In some situations, you may need to restart the workspace manually. If you do so, the workspace will be re-created and all changes you made to the workspace will be lost (such as installed software, configuration changes, etc.), however, the data stored on the persistent volume (in the `/home/kate/workspace` folder) will be retained and will be available for you when you create the workspace again.

Below are some commands you can use to manage your workspace from the terminal:

```bash
ssh john~tdp@fit-workspaces 'workspace --help'
ssh john~tdp@fit-workspaces 'workspace delete --help'
ssh john~tdp@fit-workspaces 'workspace create --help'
```

### Ugrading the workspace 

When the workspace blueprint is updated, your workspace will not be automatically updated. You can update the workspace by deleting the workspace and creating it again. The data you have stored in the persistent volume will be preserved. In some situations the workspace version may provide new VSCode configuration and it will only be updated when you manually delete the `.vscode-server` folder in your workspace. 

Follow the below steps:

1. Make sure you are not connected to the workspace by any client (SSH, VSCode, SFTP, etc.).

2. Connect to the workspace using SSH and delete the `.vscode-server` folder:

   ```bash
   $ ssh john~dev@k8shell-workspaces
   $ rm -rf /opt/workspace/.vscode-server
   ```

3. Delete the workspace from your client machine:

   ```bash
   $ ssh john~dev@k8shell-workspaces 'workspace delete'
   ```

4. Connect to the workspace using ssh or vscode. The workspace will be created again with the updated configuration.

