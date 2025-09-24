# EHR Healthcare Case Study

## Company overview
EHR Healthcare is a leading provider of electronic health record software to the medical industry. EHR Healthcare provides their software as a service to multi-national medical offices, hospitals, and insurance providers.

## Solution concept
Due to rapid changes in the healthcare and insurance industry, EHR Healthcare's business has been growing exponentially year over year. They need to be able to scale their environment, adapt their disaster recovery plan, and roll out new continuous deployment capabilities to update their software at a fast pace. Google Cloud has been chosen to replace their current colocation facilities.

## Existing technical environment
EHR's software is currently hosted in multiple colocation facilities. The lease on one of the data centers is about to expire. Customer-facing applications are web-based, and many have recently been containerized to run on a group of Kubernetes clusters. Data is stored in a mixture of relational and NoSQL databases (MySQL, MS SQL Server, Redis, and MongoDB).

EHR is hosting several legacy file- and API-based integrations with insurance providers on-premises. These systems are scheduled to be replaced over the next several years. There is no plan to upgrade or move these systems at the current time.

Users are managed via Microsoft Active Directory. Monitoring is currently being done via various open source tools. Alerts are sent via email and are often ignored.

## Business requirements
- On-board new insurance providers as quickly as possible.
- Provide a minimum 99.9% availability for all customer-facing systems.
- Provide centralized visibility and proactive action on system performance and usage.
- Increase ability to provide insights into healthcare trends.
- Reduce latency to all customers.
- Maintain regulatory compliance.
- Decrease infrastructure administration costs.
- Make predictions and generate reports on industry trends based on provider data.

## Technical requirements
- Maintain legacy interfaces to insurance providers with connectivity to both on-premises systems and cloud providers.
- Provide a consistent way to manage customer-facing applications that are container-based.
- Provide a secure and high-performance connection between on-premises systems and Google Cloud.
- Provide consistent logging, log retention, monitoring, and alerting capabilities.
- Maintain and manage multiple container-based environments.
- Dynamically scale and provision new environments.
- Create interfaces to ingest and process data from new providers.

## Executive statement
Our on-premises strategy has worked for years but has required a major investment of time and money in training our team on distinctly different systems, managing similar but separate environments, and responding to outages. Many of these outages have been a result of misconfigured systems, inadequate capacity to manage spikes in traffic, and inconsistent monitoring practices. We want to use Google Cloud to leverage a scalable, resilient platform that can span multiple environments seamlessly and provide a consistent and stable user experience that positions us for future growth.

---

## Key Concepts for PCA Exam Questions

1. **HIPAA compliance requirements** - Business Associate Agreement (BAA) with Google Cloud and verifying compliant products for healthcare data handling

2. **GKE private clusters with Binary Authorization** - Secure container deployment using private endpoints with master authorized networks for reduced attack surface

3. **Hybrid connectivity for production workloads** - Dedicated Interconnect with redundancy (99.99% SLA requires 4 connections across 2 metros)

4. **Container security architecture** - Binary Authorization, container signing in CI/CD pipelines, vulnerability scanning before deployment

5. **Active Directory integration** - Managing existing Microsoft AD users in hybrid cloud environment with identity federation

6. **Multi-database migration strategy** - Mixed relational (MySQL, MS SQL Server) and NoSQL (Redis, MongoDB) database migration approaches

7. **Monitoring and alerting modernization** - Moving from open source tools with email alerts to Cloud Monitoring/Logging for centralized visibility

8. **Legacy system integration** - Maintaining file and API-based insurance provider integrations during gradual cloud migration

9. **Organizational policies for security** - Controlling external IP addresses on backend instances to prevent configuration errors

10. **Healthcare analytics platform** - Building predictive models and reporting on industry trends using BigQuery and AI/ML services