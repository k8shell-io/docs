
# Overview

K8shell is your streamlined entry point to Kubernetes, offering standard access interfaces through established protocols. With K8shell, you do not need to install or configure extra tools or plugins on your machines. Whether you are using familiar IDEs such as VSCode or IntelliJ, command-line utilities, or other standard tools, K8shell provides seamless access to your Kubernetes resources. This is possible because K8shell implements the access just by using standard OpenSSH protocol—a widely used standard for accessing remote environments. K8shell also provides full control over dynamic resource provisioning, managing computing resources, and efficient storage allocation within your Kubernetes cluster. Additionally, K8shell allows you to control who, where, how, and when resources are accessed: all without requiring extra tools or specialized knowledge from your team—end-users of your Kubernetes resources.

Beyond its core capabilities, k8shell offers a range of benefits that can significantly enhance your Kubernetes adoption and improve your application development, security, and IT operations. 

### Development Acceleration

K8shell accelerates development by enabling Cloud Development Environments (CDE) and facilitating fast developer onboarding with predefined workspaces tailored to your application services. These workspaces come pre-configured for your software project with all necessary dependencies, reducing the burden on developers to manage and maintain these dependencies individually. Instead of spending time on configuration and troubleshooting, developers can focus on writing code, rapidly testing features, and delivering high-quality applications faster.

### Security

K8shell enhances security by allowing developers to work within remote workspaces where the source code of your application remains securely housed in the Kubernetes cluster. There’s no need for developers to download sensitive code to their local machines, reducing the risk of data breaches and ensuring that your intellectual property stays protected. This approach aligns with best practices for secure development, ensuring teams can work efficiently without compromising security.

### Computing Resources Allocation

K8shell simplifies access to a vast pool of computing resources for data scientists, eliminating the need to deal with the complexities of Kubernetes cluster configurations. You can dynamically provision workspaces with dedicated resources, such as GPUs, tailored to the specific needs of data science projects. These workspaces can be resized on-demand to adapt to evolving project requirements, whether for machine learning, AI tasks, or other resource-intensive activities. k8shell also provides fine-grained control over resource usage, allowing you to schedule and manage exclusive access to critical resources.

### Incident Management

K8shell streamlines incident management by offering controlled, temporary access for both internal teams and third-party experts. When an incident occurs, you can quickly grant specific access to necessary personnel through k8shell workspaces, ensuring secure access to your production resources. All activities can be closely monitored, recorded, and replayed for auditing purposes. Once the incident is resolved, access can be promptly revoked, ensuring your operations remain secure and that access is limited only to the required time frame.

### Honeypot

K8shell can be configured as a honeypot, designed to detect and analyze potential security threats. By deploying deceptive resources that appear vulnerable but are isolated within a controlled environment, k8shell enables you to proactively identify malicious activities, detect breaches, and respond before they affect your actual infrastructure. This adds an extra layer of security, strengthening the resilience of your applications against attacks.


### Training

K8shell is an excellent tool for training, allowing you to provision workspaces with pre-configured software that trainees can use to complete their tasks. These workspaces run on standard Linux distributions, enabling trainees to develop and run applications, perform command-line activities, or perform testing in a sandboxed environment. Additionally, they can seamlessly integrate their work with backend services available within the Kubernetes cluster, gaining hands-on experience in a controlled, secure environment. This approach ensures that trainees can effectively learn and apply new skills without the need for complex setup or additional configuration.


