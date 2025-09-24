# TerramEarth Case Study

## Company overview
TerramEarth manufactures heavy equipment for the mining and agricultural industries. They currently have over 500 dealers and service centers in 100 countries. Their mission is to build products that make their customers more productive.

## Solution concept
There are 2 million TerramEarth vehicles in operation currently, and we see 20% yearly growth. Vehicles collect telemetry data from many sensors during operation. A small subset of critical data is transmitted from the vehicles in real time to facilitate fleet management. The rest of the sensor data is collected, compressed, and uploaded daily when the vehicles return to home base. Each vehicle usually generates 200 to 500 megabytes of data per day.

## Existing technical environment
TerramEarth's vehicle data aggregation and analysis infrastructure resides in Google Cloud and serves clients from all around the world. A growing amount of sensor data is captured from their two main manufacturing plants and sent to private data centers that contain their legacy inventory and logistics management systems. The private data centers have multiple network interconnects configured to Google Cloud. The web frontend for dealers and customers is running in Google Cloud and allows access to stock management and analytics.

## Business requirements
- Predict and detect vehicle malfunction and rapidly ship parts to dealerships for just-in-time repair where possible.
- Decrease cloud operational costs and adapt to seasonality.
- Increase speed and reliability of development workflow.
- Allow remote developers to be productive without compromising code or data security.
- Create a flexible and scalable platform for developers to create custom API services for dealers and partners.

## Technical requirements
- Create a new abstraction layer for HTTP API access to their legacy systems to enable a gradual move into the cloud without disrupting operations.
- Modernize all CI/CD pipelines to allow developers to deploy container-based workloads in highly scalable environments.
- Allow developers to run experiments without compromising security and governance requirements.
- Create a self-service portal for internal and partner developers to create new projects, request resources for data analytics jobs, and centrally manage access to the API endpoints.
- Use cloud-native solutions for keys and secrets management and optimize for identity-based access.
- Improve and standardize tools necessary for application and network monitoring and troubleshooting.

## Executive statement
Our competitive advantage has always been our focus on the customer, with our ability to provide excellent customer service and minimize vehicle downtimes. After moving multiple systems into Google Cloud, we are seeking new ways to provide best-in-class online fleet management services to our customers and improve operations of our dealerships. Our 5-year strategic plan is to create a partner ecosystem of new products by enabling access to our data, increasing autonomous operation capabilities of our vehicles, and creating a path to move the remaining legacy systems to the cloud.

---

## Key Concepts for PCA Exam Questions

1. **Hybrid cloud architecture** - Multiple network interconnects between private data centers and Google Cloud for legacy system integration

2. **IoT data ingestion patterns** - Real-time critical data streaming vs. batch upload of compressed sensor data (200-500 MB/vehicle/day)

3. **Scalability requirements** - 2 million vehicles with 20% yearly growth, requiring auto-scaling solutions for seasonal demand

4. **API Gateway/Abstraction layer** - Creating HTTP API abstraction for legacy systems to enable gradual cloud migration without disruption

5. **CI/CD modernization** - Container-based workloads using GKE/Cloud Run, supporting developer productivity and experiments

6. **Self-service developer portal** - Project creation, resource provisioning, and centralized API endpoint management

7. **Security and governance** - Cloud-native key management (Cloud KMS), secrets management (Secret Manager), and identity-based access control

8. **Cost optimization strategies** - Addressing seasonality through auto-scaling, preemptible instances, and committed use discounts

9. **Monitoring and observability** - Standardized tools for application and network monitoring (Cloud Monitoring, Cloud Logging, Cloud Trace)

10. **Partner ecosystem enablement** - Secure data sharing and API access for external partners while maintaining governance