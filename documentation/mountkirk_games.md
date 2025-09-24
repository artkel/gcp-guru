# Mountkirk Games Case Study

## Company overview
Mountkirk Games makes online, session-based, multiplayer games for mobile platforms. They have recently started expanding to other platforms after successfully migrating their on-premises environments to Google Cloud. Their most recent endeavor is to create a retro-style first-person shooter (FPS) game that allows hundreds of simultaneous players to join a geo-specific digital arena from multiple platforms and locations. A real-time digital banner will display a global leaderboard of all the top players across every active arena.

## Solution concept
Mountkirk Games is building a new multiplayer game that they expect to be very popular. They plan to deploy the game's backend on Google Kubernetes Engine so they can scale rapidly and use Google's global load balancer to route players to the closest regional game arenas. In order to keep the global leader board in sync, they plan to use a multi-region Spanner cluster.

## Existing technical environment
The existing environment was recently migrated to Google Cloud, and five games came across using lift-and-shift virtual machine migrations, with a few minor exceptions. Each new game exists in an isolated Google Cloud project nested below a folder that maintains most of the permissions and network policies. Legacy games with low traffic have been consolidated into a single project. There are also separate environments for development and testing.

## Business requirements
- Support multiple gaming platforms.
- Support multiple regions.
- Support rapid iteration of game features.
- Minimize latency.
- Optimize for dynamic scaling.
- Use managed services and pooled resources.
- Minimize costs.

## Technical requirements
- Dynamically scale based on game activity.
- Publish scoring data on a near real–time global leaderboard.
- Store game activity logs in structured files for future analysis.
- Use GPU processing to render graphics server-side for multi-platform support.
- Support eventual migration of legacy games to this new platform.

## Executive statement
Our last game was the first time we used Google Cloud, and it was a tremendous success. We were able to analyze player behavior and game telemetry in ways that we never could before. This success allowed us to bet on a full migration to the cloud and to start building all-new games using cloud-native design principles. Our new game is our most ambitious to date and will open up doors for us to support more gaming platforms beyond mobile. Latency is our top priority, although cost management is the next most important challenge. As with our first cloud-based game, we have grown to expect the cloud to enable advanced analytics capabilities so we can rapidly iterate on our deployments of bug fixes and new functionality.

---

## Key Concepts for PCA Exam Questions

1. **Multi-region architecture with GKE** - Essential for scaling and managing containerized game backends across regions with managed instance groups

2. **Global Load Balancing for latency optimization** - Critical for routing players to nearest regional game arenas (L7 load balancers for REST APIs)

3. **Cloud Spanner for globally consistent data** - Multi-region cluster for real-time global leaderboard synchronization with strong consistency

4. **Project hierarchy and isolation** - Each game in separate projects under folders for resource isolation, with consolidated projects for legacy low-traffic games

5. **Dynamic autoscaling requirements** - Both GKE horizontal pod autoscaling and managed instance groups for handling variable game loads

6. **GPU processing for server-side rendering** - Supporting multi-platform gaming through server-side graphics rendering using GPU-enabled instances

7. **Analytics architecture decisions** - Cloud Bigtable for time-series game activity data, BigQuery for historical analytics (10TB+), and Dataflow for real-time processing

8. **Cost optimization with managed services** - Balancing preemptible vs non-preemptible instances, using pooled resources, and leveraging fully managed services

9. **CI/CD pipeline requirements** - Supporting rapid feature iteration with tools like Jenkins/Spinnaker for automated deployments and rollbacks

10. **Organizational policies for compliance** - Implementing location constraints to restrict resource deployment to specific regions