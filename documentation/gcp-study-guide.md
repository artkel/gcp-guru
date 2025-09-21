# Google Cloud Professional Cloud Architect Certification Study Guide

## I. Core Concepts and Exam Overview

### A. Introduction to the Google Cloud Professional Cloud Architect Certification

* Purpose: Validates the ability to design, implement, and manage cloud solutions on Google Cloud Platform.  
* Target Audience: Aspiring cloud architects and IT professionals aiming for career advancement in cloud computing.  
* Key Skills H.P. (Honed & Practised): Critical cloud architecture skills, solution design, implementation, and management.

### B. Exam Format and Logistics

* Certification Name: Google Cloud Professional Cloud Architect.  
* Exam Duration: 2 hours.  
* Typical Completion Time: Most test-takers finish in 30-40 minutes, indicating ample time.  
* Passing Score: Approximately 80% (based on various databases; no official cutoff yet). Results are available immediately.  
* Exam Availability: Both offline (in-person) and online. Online testing requires a private room to prevent cheating.  
* Cost: $200. Vouchers may be available for students (e.g., Study Jam) or through IT companies.  
* Languages Offered: English and Japanese.  
* Unique Feature: Case Questions: The exam includes case studies based on real enterprise scenarios, describing company pain points and requiring Google Cloud solutions to address them. These cases are provided by Google Cloud.  
* Exam Frequency: Regular schedules with 8 to 20 test dates per month.  
* Post-Exam: Certificates and souvenirs (e.g., fleeces, water bottles) are provided upon passing.

### C. Study Approach

* Lecture Focus: Approximately 40% theoretical explanation and 60% problem-solving.  
* Theory Emphasis: Focuses on unique Google Cloud features and frequently asked points, rather than basic IT concepts (e.g., what a server is).  
* Problem Solving: Crucial for passing the exam; understanding or memorising problems is highly beneficial as they are often similar to test questions.  
* Skipping Basics: If you have infrastructure experience, you can skip basic theory and focus on problem-solving.  
* Recommended Resources:Official Google Cloud resources.  
* High-quality third-party study materials.  
* Consistent hands-on practice.

## II. Google Cloud Platform (GCP) Services Overview

### A. Compute Services (Infrastructure)

* Compute Engine (VMs):Definition: Infrastructure as a Service (IaaS) for provisioning and managing virtual machines (VMs).  
* Key Features: Supports any language, autoscaling, handles common workloads.  
* Machine Types: Predefined or custom. Families include N1, N2 (general purpose), A2, N3 (GPU/high memory/CPU).  
* Core and Memory: Configurable; memory often 4x or 8x cores, but customisation is possible.  
* Storage (Persistent Disks):Zonal Disks: Attached to VMs in a specific zone; data loss if zone fails, cannot be mounted by VMs in other zones. Cost-effective.  
* Regional Disks: For high availability and clustering; higher cost but data persists across zones in a region.  
* Types: HDD (cheaper) and SSD (faster).  
* Local SSDs: Directly attached to the server for very fast I/O; data is lost if the server shuts down (ephemeral).  
* Cloud Storage (GCS): Object storage, not a block device; can be mounted on a VM.  
* Networking: Internal IP, External IP, Network Tags (for routing and firewall rules).  
* Operating Systems: Linux (Red Hat, SuSE), Windows Server. Options for including licenses in Google Cloud billing or Bring Your Own License (BYOL).  
* Google Kubernetes Engine (GKE): Managed service for deploying, managing, and scaling containerised applications using Kubernetes.  
* Kubernetes Concepts: Nodes, Pods, Deployments, Services, Ingress.  
* Tools: gcloud (for cluster creation), kubectl (for Kubernetes object management).  
* Microservices Support: Ideal for microservices architecture due to independent service deployment and management.  
* App Engine: Platform as a Service (PaaS) for web and service environments, providing automatic scaling and management.  
* Cloud Functions: Serverless compute service for event-driven applications, running code in response to events.  
* Cloud Run: Serverless platform for deploying stateless HTTP containers, offering auto-scaling to zero and traffic splitting.  
* Benefits: Build-neutral (OCI standard), fast autoscaling, cost-effective, traffic splitting (Canary/Blue-Green deployments), custom domains/TLS, automatic recovery.

### B. Data Analytics Services

* BigQuery: Data warehouse solution for OLAP (Online Analytical Processing); stores large datasets and processes queries quickly.  
* Data Pipeline:Cloud Composer (Airflow as a Service): Open-source solution to automate data pipelines.  
* Dataflow: Managed service for executing Apache Beam pipelines for data processing.  
* Dataproc: Managed Apache Spark and Hadoop service for fast, distributed data processing.  
* Pub/Sub: Message queue service (Kafka-like) for asynchronous messaging between applications.

### C. Networking Services

* Virtual Private Cloud (VPC):Definition: Basic network isolation unit in Google Cloud, acting as an L3 backbone.  
* Scope: Global service; a single VPC can span multiple regions.  
* Subnets: Must be allocated to a single region; cannot overlap CIDR blocks; unique and within valid IP range; expansion possible but not reduction.  
* IP Addresses:Internal IP: Assigned to VMs from subnet range (DHCP or reserved); automatically registered in VPC DNS. VMs only know their private IP.  
* External IP: Provided from Google Cloud's pool; temporary unless reserved. Cost for reserved external IP when not in use.  
* Ephemeral vs. Static: Ephemeral IPs change on VM restart; static IPs persist (regional or global).  
* Firewall Rules: Applied at the VPC level, allowing bulk application to VMs based on IP, port, and network tags.  
* Cloud DNS: Provides name server functionality with 100% SLA, fast record creation/updates, and supports inbound/outbound DNS forwarding.  
* Cloud Interconnect: Connects on-premise environments to Google Cloud for high-bandwidth, low-latency communication.  
* Partner Interconnect: Connects on-premise to Google Cloud through Google Cloud partners.  
* Load Balancing: Distributes traffic across multiple instances for high availability and performance.  
* Types:Global Load Balancers: HTTP(S) Load Balancer, SSL Proxy Load Balancer, TCP Proxy Load Balancer (for global traffic).  
* Regional Load Balancers: Internal TCP/UDP Load Balancer, Network TCP/UDP Load Balancer, Internal HTTP(S) Load Balancer (for regional traffic).  
* Components: Front end (IP, port, SSL), Health Checks (to ensure backend instances are serving), Back end (VMs, instance groups, IP:Port, Cloud Storage buckets).  
* Instance Groups:Managed Instance Group (MIG): Group of identical VMs from a template, offering autoscaling, auto-healing, rolling updates, and Canary deployments.  
* Unmanaged Instance Group (UMIG): Group of VMs with different configurations; no autoscaling or auto-healing. Used when autoscaling is not needed or due to licensing constraints.  
* Cloud Router: Functions as a router, exchanging routing information via BGP sessions (important for VPN/Interconnect).  
* VPN: Used for secure communication between Google Cloud and other clouds or on-premise.  
* Cloud NAT (Network Address Translation): Allows internal VMs without public IPs to communicate with the internet, enhancing security and providing fully managed service. Policies for inbound/outbound traffic.  
* Content Delivery Network (CDN): Delivers static content (images, videos) quickly by caching at edge locations closest to users, reducing latency. Uses a load balancer and a VM/bucket as backend. TTL (Time To Live) for cached content.

### D. Databases

* NoSQL:Bigtable: NoSQL wide-column database for large analytical and operational workloads.  
* Datastore (Firestore in Datastore mode): NoSQL document database.  
* Memorystore: In-memory NoSQL data store (Redis, Memcached).  
* SQL (Relational):Cloud SQL: Managed relational database service (MySQL, PostgreSQL, SQL Server). Similar to AWS RDS.  
* Spanner: Horizontally scalable, globally distributed relational database service.

### E. Management and Operations

* Cloud Logging: Centralised logging for all cloud resources.  
* Cloud Monitoring: User-configurable dashboards for monitoring cloud resources.  
* Cloud Quotas: Manage resource usage limits.  
* Cloud Billing: Monitor and optimize costs, including committed use discounts and free tier offers.  
* FinOps Hub: Tool for financial operations in the cloud.  
* Carbon Footprint: Monitors the carbon emissions of your GCP usage.  
* VM Manager: Suite of tools for managing operating systems across large VM fleets (patch, inventory, config management).  
* Cloud Scheduler: Automates tasks (like cron tab in Linux).

### F. Storage Services

* Cloud Storage (Object Storage):Types: Archive, Coldline, Nearline, Standard (different purposes and performance).  
* Buckets: Used for storing objects.  
* File Storage (Filestore): Managed Network Attached Storage (NAS).  
* Block Storage (Persistent Disk): Standard block devices mounted to VMs (like a hard drive).  
* Storage Transfer Service: Used for migrating on-premise storage to Google Cloud Storage.

### G. Hybrid and Multi-Cloud

* Anthos: Platform for managing Kubernetes clusters across on-premise, Google Cloud, and other cloud providers (e.g., AWS, Azure). Allows unified management of Kubernetes.  
* Multi-Cloud and Hybrid Area: Services designed for connectivity between GCP, on-premise, and other CSPs.  
* Private Service Connect (PSC): Connects your VPC to Google-managed services (e.g., Spanner, Cloud SQL) over Google's private API network for enhanced security and managed access. Requires an organization and allows security audits.

### H. Security and Identity

* Cloud IAM (Identity and Access Management): Manages users and their permissions/rights across Google Cloud resources.

### I. AI and Machine Learning

* Vertex AI: Google Cloud's unified platform for machine learning development and deployment.

### J. Resource Hierarchy

* Organization: Highest level, represents a company, requires at least one domain. Contains folders.  
* Folders: Can contain multiple projects and other folders, allowing for multi-layered hierarchy. Used for structuring resources by team or task.  
* Projects: Smallest unit that can hold Google Cloud resources (VMs, GKE, App Engine, etc.). Resources within a project share billing and IAM policies.  
* Shared VPC: A VPC configured in a host project (part of an organization) that can be used by other service projects within the same organization. Reduces repetitive tasks for network configuration (e.g., firewall rules) and simplifies communication.  
* Regions: Specific geographical locations where Google Cloud hosts services (e.g., London, Tokyo). Composed of multiple zones. Important for high availability, low latency, global footprint, and adherence to regulations. Google has 40+ regions.  
* Zones: Physically separated locations within a region (e.g., us-west1-a, us-west1-b, us-west1-c). Each region has at least three zones, connected with low-latency links. Provide increased availability and fault tolerance within the same region.  
* Multi-Region: Bundling multiple regions together (e.g., US, EU). Used for services requiring very high availability and disaster recovery across regional failures. Not always necessary for services targeting a specific geographical area or those tolerant of some downtime.

## III. Disaster Recovery and High Availability

* Zonal Outage: If a service in one zone fails, service can continue from other zones within the same region (e.g., using regional persistent disks, Cloud SQL high availability).  
* Regional Outage: Requires multi-region deployment for continuous service.  
* Cloud SQL DR: Cross-region read replicas (in a compliant region) can be promoted to primary in case of regional failure for near-zero Recovery Point Objective (RPO).

## IV. Cost Management

* Preemptible VMs: Cost-effective for batch workloads that are not time-critical, as they can be preempted.  
* Stopping VMs: Stopping a VM and using the \--no-auto-delete flag on persistent disks helps reduce costs while preserving state.  
* Static IPs: Cost money even when not in use; release them when not needed.  
* Billing Export: Use Google BigQuery billing export and labels to associate costs with specific groups or projects for cost visibility.

## V. Key Architectural Principles

* Stateless vs. Stateful Workloads:Stateless: Applications where no data persists on the instance itself (e.g., web servers, microservices). Ideal for managed instance groups with auto-scaling.  
* Stateful: Applications that require data persistence (e.g., databases). Requires specific configurations like stateful managed instance groups or regional persistent disks.  
* Microservices Architecture (MSA): Trend where services are separated independently, allowing for faster reflection of changing trends and increased flexibility. GKE is well-suited for MSA.  
* Serverless Services: Google Cloud automatically adjusts resources based on usage, with no cluster configuration or autoscaling management needed (e.g., Cloud Run, Cloud Functions, App Engine).

## Quiz

### Ten Short-Answer Questions

* Explain the difference between a Google Cloud Region and a Zone. Why are both concepts important for deploying applications? A Region is a specific geographical location, like London or Tokyo, composed of multiple Zones. A Zone is a physically isolated location within a Region. Both are important because Regions provide broad geographic distribution for low latency and compliance, while Zones within a Region ensure high availability and fault tolerance against single data center failures.  
* What is the primary purpose of Google Cloud's Shared VPC, and when can it be used? Shared VPC allows multiple projects within an organization to use a common Virtual Private Cloud (VPC) network. Its primary purpose is to simplify network management, reduce redundant configuration tasks (like firewall rules), and enable seamless communication between resources in different projects. It can only be used when projects belong to a specific Google Cloud organization.  
* Describe the key difference between a Zonal Persistent Disk and a Regional Persistent Disk in Google Cloud Compute Engine. When would you choose one over the other? A Zonal Persistent Disk is tied to a specific zone, meaning its data is at risk if that zone experiences an outage and cannot be accessed from another zone. A Regional Persistent Disk, however, provides replication across multiple zones within a single region, offering higher availability. You would choose a Zonal disk for cost savings when high availability is not critical, and a Regional disk for applications requiring high availability, continuity, and clustering within a region.  
* How does Google Cloud's CDN (Content Delivery Network) improve user experience, and what types of content is it best suited for? Google Cloud's CDN improves user experience by delivering static content from edge locations geographically closest to the user. This significantly reduces latency and speeds up content delivery. It is best suited for static content such as images, HTML files, videos, and other media that do not frequently change.  
* What is a Managed Instance Group (MIG) in Google Cloud, and what are two significant benefits it offers compared to an Unmanaged Instance Group (UMIG)? A Managed Instance Group (MIG) is a group of identical virtual machine instances created from an instance template, managed as a single entity. Two significant benefits over an Unmanaged Instance Group (UMIG) are automated autoscaling (scaling instances up or down based on load) and auto-healing (automatically replacing unhealthy instances), which UMIGs do not support.  
* Explain the concept of "ephemeral" versus "static" external IP addresses for Compute Engine VMs. Why might you prefer a static IP? An ephemeral external IP address is temporary and changes whenever a VM instance is stopped and restarted. A static external IP address, once reserved and assigned, remains constant even if the VM is stopped or restarted. You might prefer a static IP to ensure a consistent, predictable public IP for services that need to be always reachable at the same address, avoiding DNS updates or client reconfigurations.  
* What is the role of Network Tags in Google Cloud, particularly in the context of VPC and firewall rules? Network Tags are labels attached to VM instances that allow you to apply certain network rules, such as routing and firewall policies, to a group of VMs. This is a very effective method for bulk application of firewall rules, enabling specific traffic flows (e.g., between application tiers) across all VMs with a given tag without needing individual VM-level configurations.  
* How does Google Cloud's Cloud NAT service enhance security for VMs that do not have public IP addresses? Cloud NAT allows internal VMs without individual public IP addresses to communicate with the internet. It enhances security because all outbound internet communication goes through the NAT, and importantly, unauthorised users from the outside cannot directly access the internal VMs or their private IP addresses, as they are blocked by the NAT.  
* What is the primary function of Google Cloud's Cloud SQL, and to which existing relational database services is it often compared? Cloud SQL is a fully managed relational database service in Google Cloud. Its primary function is to simplify the setup, maintenance, management, and administration of relational databases. It is often compared to Amazon Web Services' (AWS) Relational Database Service (RDS), offering managed instances of databases like MySQL, PostgreSQL, and SQL Server.  
* Discuss the importance of case questions in the Google Cloud Professional Cloud Architect certification exam. How should one prepare for them? Case questions are a notable and unique feature of the exam, providing real-world enterprise scenarios that require candidates to utilise Google Cloud services to solve company pain points. To prepare, one should focus on understanding how various Google Cloud services can be integrated and applied to address specific business needs, rather than just memorising individual service features. Reviewing provided case studies and practicing problem-solving based on them is crucial.

## Answer Key

### Ten Short-Answer Questions

* Explain the difference between a Google Cloud Region and a Zone. Why are both concepts important for deploying applications? A Region is a broad geographical area containing multiple data centers, while a Zone is a distinct, physically isolated data center within a region. Both are critical because Regions enable global reach, low latency for distributed users, and regulatory compliance, while Zones provide high availability and fault tolerance within a single region by isolating failures to one physical location.  
* What is the primary purpose of Google Cloud's Shared VPC, and when can it be used? The primary purpose of Shared VPC is to allow multiple projects within an organisation to connect to a common Virtual Private Cloud (VPC) network. This simplifies network administration, reduces operational overhead for common network configurations (like firewall rules), and enables seamless internal communication between resources hosted in different service projects. It can only be used if your projects are part of a Google Cloud organisation.  
* Describe the key difference between a Zonal Persistent Disk and a Regional Persistent Disk in Google Cloud Compute Engine. When would you choose one over the other? A Zonal Persistent Disk is located in a single Google Cloud zone, meaning it's unavailable if that zone experiences an outage. A Regional Persistent Disk is synchronously replicated across two zones within a single region, providing higher availability and the ability to attach to a VM in the alternate zone if one fails. You would choose a Zonal disk for cost efficiency when downtime tolerance is higher, and a Regional disk for high-availability applications that require data persistence even during a zonal outage.  
* How does Google Cloud's CDN (Content Delivery Network) improve user experience, and what types of content is it best suited for? Google Cloud's CDN improves user experience by reducing latency and speeding up content delivery. It achieves this by caching static content (like images, videos, HTML files) at edge locations around the world, closer to end-users. It is best suited for frequently accessed, unchanging content that benefits from being served from the network site closest to the user.  
* What is a Managed Instance Group (MIG) in Google Cloud, and what are two significant benefits it offers compared to an Unmanaged Instance Group (UMIG)? A Managed Instance Group (MIG) is a collection of identical VM instances, typically created from a single instance template, that are managed as a single entity. Two significant benefits it offers over an Unmanaged Instance Group (UMIG) are automatic scaling based on defined metrics (e.g., CPU utilisation) and automatic healing, which replaces unhealthy instances to maintain application availability.  
* Explain the concept of "ephemeral" versus "static" external IP addresses for Compute Engine VMs. Why might you prefer a static IP? An "ephemeral" external IP address is temporary and is released and potentially reassigned when a VM instance is stopped and started. A "static" external IP address is reserved and remains assigned to a VM even after restarts or can be re-assigned to other VMs. You would prefer a static IP for services that require a consistent, unchanging public IP address, such as public web servers, VPN endpoints, or applications with external dependencies that rely on a fixed IP.  
* What is the role of Network Tags in Google Cloud, particularly in the context of VPC and firewall rules? Network Tags are metadata labels that you can attach to Compute Engine VM instances. Their role in VPC and firewall rules is to allow you to define firewall rules that apply to all instances with a specific tag, rather than requiring individual IP addresses. This simplifies network security management, making it easier to control traffic flow between different application tiers or groups of VMs.  
* How does Google Cloud's Cloud NAT service enhance security for VMs that do not have public IP addresses? Cloud NAT enhances security by enabling VMs without individual public IP addresses to initiate outbound connections to the internet. This setup means that these internal VMs are not directly exposed to the internet, as all their outbound traffic is translated through a shared public IP managed by Cloud NAT. This effectively blocks unsolicited inbound connections, providing an additional layer of security.  
* What is the primary function of Google Cloud's Cloud SQL, and to which existing relational database services is it often compared? The primary function of Google Cloud SQL is to provide a fully managed relational database service, simplifying the setup, operation, and scaling of databases like MySQL, PostgreSQL, and SQL Server. It handles database patching, backups, replication, and scaling automatically. It is often compared to Amazon Web Services' (AWS) Relational Database Service (RDS), which offers similar managed database capabilities.  
* Discuss the importance of case questions in the Google Cloud Professional Cloud Architect certification exam. How should one prepare for them? Case questions are crucial because they assess a candidate's ability to apply theoretical knowledge to complex, real-world business scenarios, mimicking the role of a Cloud Architect. They test problem-solving, critical thinking, and the ability to integrate various Google Cloud services into a cohesive solution. Preparation should involve thoroughly studying the provided case studies, identifying pain points, and practicing designing comprehensive Google Cloud solutions that address business requirements and constraints like cost, availability, and compliance.

## Essay Format Questions

* A global e-commerce company wants to migrate its existing monolithic on-premises application to Google Cloud Platform. The application experiences unpredictable traffic spikes, especially during holiday sales, and requires extremely low latency for customers worldwide. Design a comprehensive Google Cloud architecture that leverages serverless compute, global load balancing, and efficient storage solutions to meet these requirements, ensuring high availability, scalability, and cost-effectiveness.  
* Your organisation handles sensitive financial data and is subject to strict regulatory compliance, requiring data to reside within the European region and demanding a near-zero Recovery Point Objective (RPO) in case of a regional outage. Outline a disaster recovery strategy for critical Cloud SQL instances and associated storage, detailing how Google Cloud's multi-region capabilities and specific services can ensure business continuity while adhering to regulatory constraints.  
* An IT department manages thousands of Linux virtual machines across multiple projects within a Google Cloud organization. They are struggling with manual OS patch management, inventory tracking, and configuration consistency, leading to security vulnerabilities and operational inefficiencies. Propose a solution utilising Google Cloud's management tools and hierarchical resource organisation to automate these tasks, enhance security, and provide better cost visibility.  
* A media company frequently uploads large video files from on-premises storage to Google Cloud Storage. They need to ensure the integrity of the uploaded content, verify it's identical to the source, and then quickly distribute it to global users with minimal latency. Describe the end-to-end process and Google Cloud services required to achieve this, from data transfer and verification to efficient content delivery.  
* Your development team is adopting a microservices architecture for a new application on Google Kubernetes Engine (GKE). They need to ensure that individual microservices can be updated with minimal downtime, traffic can be gradually shifted to new versions for testing (Canary deployments), and internal communication between microservices is secure and efficient. Explain how GKE, along with relevant Google Cloud networking and deployment strategies, can support these requirements.

## Glossary of Key Terms

* Anthos: A Google Cloud platform that extends Kubernetes and Google Cloud services to hybrid and multi-cloud environments, allowing unified management of Kubernetes clusters across on-premises data centers, Google Cloud, and other cloud providers.  
* App Engine: A Platform as a Service (PaaS) in Google Cloud that allows developers to build and deploy scalable web applications and mobile backends without managing the underlying infrastructure.  
* Autoscaling: The ability of a cloud service (e.g., Managed Instance Groups, Cloud Run) to automatically adjust the number of compute resources (e.g., VMs, containers) in response to demand or predefined metrics, ensuring performance and cost efficiency.  
* BigQuery: A fully managed, serverless enterprise data warehouse that enables scalable analysis over petabytes of data, often used for online analytical processing (OLAP).  
* Bigtable: A fully managed, scalable NoSQL wide-column database service designed for large analytical and operational workloads with high throughput and low latency.  
* BYOL (Bring Your Own License): A licensing model that allows users to use their existing software licenses for applications running on Google Cloud VMs, rather than purchasing new licenses from Google.  
* Canary Deployment: A deployment strategy where a new version of an application is rolled out to a small subset of users or instances first, allowing for testing and monitoring before a full rollout to all users.  
* CDN (Content Delivery Network): A geographically distributed network of proxy servers and their data centers used to accelerate the delivery of static web content by caching it closer to users.  
* CIDR Block (Classless Inter-Domain Routing): A method for allocating IP addresses and routing IP packets, denoted as a base IP address and a prefix length (e.g., 10.0.0.0/16). Used for defining subnets in a VPC.  
* Cloud Composer: A fully managed workflow orchestration service built on Apache Airflow, used to create, schedule, and monitor data pipelines.  
* Cloud DNS: A scalable, high-performance, and global Domain Name System (DNS) service that publishes your domain names to the global DNS in a cost-effective way.  
* Cloud Functions: A serverless execution environment for building and connecting cloud services, allowing you to run small, single-purpose functions in response to events without managing servers.  
* Cloud IAM (Identity and Access Management): A service that lets you define who has what access to which resources within your Google Cloud project, allowing for granular control over permissions.  
* Cloud Interconnect: A service that provides a dedicated, high-throughput connection between your on-premises network and Google Cloud's network, bypassing the public internet.  
* Cloud Logging: A fully managed service for collecting, ingesting, and analysing logs from Google Cloud resources, on-premises systems, and other cloud providers.  
* Cloud Monitoring: A comprehensive monitoring solution that collects metrics, events, and metadata from Google Cloud, AWS, and application instrumentation to provide insights into performance and availability.  
* Cloud NAT (Network Address Translation): A service that enables private VMs in a Virtual Private Cloud (VPC) network to send outbound traffic to the internet without public IP addresses, enhancing security.  
* Cloud Router: A Google Cloud service that allows your Virtual Private Cloud (VPC) network to dynamically exchange route information with your on-premises network using BGP (Border Gateway Protocol).  
* Cloud Run: A fully managed, serverless platform that allows you to deploy and run stateless containers that are invocable via web requests or Pub/Sub events, scaling automatically from zero to many instances.  
* Cloud SQL: A fully managed relational database service for MySQL, PostgreSQL, and SQL Server, simplifying the setup, maintenance, management, and administration of your relational databases on Google Cloud.  
* Cloud Storage: Google Cloud's highly scalable and durable object storage service, used for storing unstructured data like images, videos, and backup files. It offers different storage classes (e.g., Standard, Nearline, Coldline, Archive).  
* Compute Engine: Google Cloud's Infrastructure as a Service (IaaS) offering that allows users to create and run virtual machines on Google's infrastructure.  
* Custom Image: A user-created image of a Compute Engine VM that includes custom configurations, software installations, or specific operating system versions, used to create new VMs with consistent environments.  
* Dataproc: A fully managed, scalable service for running Apache Spark, Hadoop, Presto, and other open-source data processing frameworks on Google Cloud.  
* Datastore (Firestore in Datastore mode): A highly scalable NoSQL document database service for web, mobile, and IoT applications.  
* DHCP (Dynamic Host Configuration Protocol): A network protocol that enables a server to automatically assign an IP address and other communication parameters to devices connected to the network.  
* Ephemeral IP Address: A temporary external IP address assigned to a Compute Engine VM that changes if the VM is stopped and restarted.  
* FinOps Hub: A Google Cloud tool that helps organizations understand and optimize their cloud costs, providing insights and recommendations for financial operations in the cloud.  
* Firewall Rules: Network configurations in Google Cloud VPC that control incoming (ingress) and outgoing (egress) traffic to and from VM instances based on specified criteria (e.g., source/destination IP, port, protocol, network tags).  
* GKE (Google Kubernetes Engine): A managed service for deploying, managing, and scaling containerized applications using Kubernetes, an open-source container orchestration system.  
* Global Load Balancer: A type of Google Cloud Load Balancer that distributes traffic globally across multiple regions, providing low latency and high availability for users worldwide.  
* Health Check: A mechanism used by Load Balancers to determine the readiness and availability of backend instances (e.g., VMs in an instance group) to receive traffic.  
* IaaS (Infrastructure as a Service): A cloud computing service model that provides virtualized computing resources over the internet, such as virtual machines, storage, and networks.  
* Instance Template: A resource in Google Cloud that defines the machine type, boot disk image, network settings, and other VM properties. It acts as a blueprint for creating single VM instances or Managed Instance Groups.  
* Internal IP Address: A private IP address assigned to a Compute Engine VM that is only reachable within the same VPC network and associated networks (e.g., via VPN or Shared VPC).  
* IOPS (Input/Output Operations Per Second): A common performance metric used to characterise computer storage devices, measuring the number of read/write operations per second.  
* Kubernetes: An open-source container orchestration system for automating deployment, scaling, and management of containerized applications.  
* kubectl: The command-line tool used to run commands against Kubernetes clusters, enabling users to deploy applications, inspect and manage cluster resources, and view logs.  
* Latency: The delay before a transfer of data begins following an instruction for its transfer, often measured in milliseconds. Lower latency is desirable for faster application response times.  
* Local SSD: A physically attached solid-state drive (SSD) to a Compute Engine VM, offering very high I/O performance but with ephemeral data storage (data is lost if the VM is stopped or terminated).  
* Managed Instance Group (MIG): A group of homogeneous VM instances managed as a single entity, providing features like autoscaling, auto-healing, and rolling updates.  
* Memorystore: A fully managed in-memory data store service for Redis and Memcached, offering high performance and low latency for caching and real-time data processing.  
* Microservices Architecture (MSA): A software development approach where an application is built as a collection of small, independently deployable services that communicate with each other, rather than a single monolithic application.  
* Multi-Region: A deployment strategy where application resources are distributed across multiple Google Cloud Regions to achieve maximum availability and disaster recovery capabilities against regional outages.  
* Network Tags: Labels assigned to VM instances in Google Cloud that enable the application of firewall rules and route policies to specific groups of VMs.  
* NoSQL (Not Only SQL): A class of database management systems that do not adhere to the traditional relational database model, offering flexible schemas, horizontal scalability, and high performance for specific data models.  
* Object Storage: A data storage architecture that manages data as objects, offering high scalability, durability, and accessibility over HTTP APIs, suitable for unstructured data.  
* OLAP (Online Analytical Processing): A category of software tools that provide analysis of data for business intelligence, typically involving complex queries on large historical datasets (e.g., BigQuery).  
* OLTP (Online Transaction Processing): A class of software programs capable of handling large numbers of concurrent transactions typically involving many users and frequent small transactions (e.g., Cloud SQL).  
* Organisation: The top-level resource in the Google Cloud resource hierarchy, representing a company and acting as a central point of control for all Google Cloud resources.  
* PaaS (Platform as a Service): A cloud computing service model that provides a platform for developers to build, run, and manage applications without the complexity of building and maintaining the infrastructure.  
* Persistent Disk: A durable block storage device that can be attached to Compute Engine VMs, used for operating systems, application binaries, and data. Can be zonal or regional.  
* Preemptible VM: A Compute Engine VM instance that you can run at a much lower price than regular instances. Google Cloud can terminate these instances if it needs to reclaim capacity, making them suitable for fault-tolerant, batch jobs.  
* Private Service Connect (PSC): A networking service that enables private and secure consumption of services across VPC networks, including Google-managed services (e.g., Cloud SQL, Spanner) and services in other VPCs.  
* Project: A fundamental organisational unit in Google Cloud, acting as a container for all your cloud resources. It is used for billing, managing permissions, and enabling APIs.  
* Pub/Sub: A fully managed real-time messaging service that allows you to send and receive messages between independent applications, acting as a scalable message queue.  
* Recovery Point Objective (RPO): The maximum tolerable period in which data might be lost from an IT service due to a major incident. A near-zero RPO means very little to no data loss is acceptable.  
* Regional Load Balancer: A type of Google Cloud Load Balancer that distributes traffic within a specific Google Cloud region, suitable for services with regional user bases.  
* Rolling Update: A software deployment strategy that updates instances of an application incrementally, replacing old versions with new ones one by one, to ensure continuous service availability with minimal downtime.  
* Shared VPC: (See above)  
* Sole-Tenant Nodes: Dedicated physical Compute Engine servers for your VMs, providing hardware isolation and enabling compliance with specific licensing or security requirements.  
* Spanner: A globally distributed, horizontally scalable, and strongly consistent relational database service built for mission-critical applications.  
* Static IP Address: A reserved external IP address that remains constant even if the associated VM instance is stopped or restarted, providing a stable public endpoint.  
* Startup Script: A script that runs automatically when a Compute Engine VM instance starts up, used for automating initial setup tasks like software installation or configuration.  
* Storage Transfer Service: A service that enables the transfer of large amounts of data into and out of Google Cloud Storage, as well as between different cloud storage providers and on-premises systems.  
* Subnet: A logical subdivision of an IP network within a VPC, located in a specific region, used to organise and manage network resources.  
* Throughput: The rate at which data is processed or transferred, often measured in bits per second (bps) or bytes per second (Bps). Higher throughput indicates better performance.  
* TTL (Time To Live): A setting that dictates how long data or a content record should be cached before it's refreshed from the source. Used in DNS and CDN caching.  
* UMIG (Unmanaged Instance Group): A collection of independently managed VM instances that can have different configurations. Unlike MIGs, UMIGs do not offer features like autoscaling or auto-healing.  
* Vertex AI: Google Cloud's unified machine learning platform that allows developers and data scientists to build, deploy, and manage ML models throughout their lifecycle.  
* VPC (Virtual Private Cloud): A logically isolated section of the Google Cloud network that you define, where you can launch Google Cloud resources in a virtual network that you control.  
* VPN (Virtual Private Network): A technology that creates a secure, encrypted connection over a public network, allowing remote users or networks to securely access resources as if they were directly connected to the private network.  
* Zone: (See above)

