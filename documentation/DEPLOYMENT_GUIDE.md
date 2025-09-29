# GCP Deployment Guide for GCP Guru (v2)

This guide provides instructions for the one-time setup of the GCP Guru application's cloud environment. After this initial setup, all deployments are fully automated via a Cloud Build CI/CD pipeline.

## Table of Contents
- [New Architecture Overview](#new-architecture-overview)
- [Part 1: One-Time Environment Setup](#part-1-one-time-environment-setup)
- [Part 2: The Automated Deployment Process](#part-2-the-automated-deployment-process)
- [Troubleshooting](#troubleshooting)

## New Architecture Overview

The application is deployed on a robust, production-ready GCP architecture:

- **CI/CD**: **Google Cloud Build** automatically builds, tests, and deploys the application on every push to the `main` branch.
- **Compute**: The frontend (Next.js) and backend (FastAPI) run as separate, secure services on **Google Cloud Run**.
- **Database**: **Google Firestore** is used as the primary database for all transactional data, including questions and user progress.
- **Static Storage**: **Google Cloud Storage (GCS)** is used to host static assets, specifically the case study markdown files.
- **Secret Management**: The Gemini API key is securely stored and accessed via **Google Secret Manager**.
- **Container Registry**: Docker images are stored in **Google Artifact Registry**.

---

## Part 1: One-Time Environment Setup

These steps only need to be performed once for the entire project. It is recommended to run them from the Google Cloud Shell.

**1. Clone Your Project Repository**
```bash
# Replace with your repository's URL
git clone https://github.com/artkel/gcp-guru.git
cd gcp-guru
```

**2. Set Core Environment Variables**
```bash
export REGION="europe-west3"
export PROJECT_ID=$(gcloud config get-value project)
```

**3. Enable Required APIs**
```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com firestore.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com
```

**4. Create GCS Bucket for Static Files**
```bash
export BUCKET_NAME="gcp-guru-data-bucket-${PROJECT_ID}"
gsutil mb -p ${PROJECT_ID} -l ${REGION} gs://${BUCKET_NAME}

# Upload ONLY the case study markdown files
gsutil cp documentation/mountkirk_games.md gs://${BUCKET_NAME}/mountkirk_games.md
gsutil cp documentation/ehr_healthcare.md gs://${BUCKET_NAME}/ehr_healthcare.md
gsutil cp documentation/terramearth.md gs://${BUCKET_NAME}/terramearth.md
gsutil cp documentation/hrl.md gs://${BUCKET_NAME}/hrl.md
```

**5. Create Firestore Database**
```bash
gcloud firestore databases create --location=${REGION} --type=firestore-native
```

**6. Create and Configure API Key Secret**
```bash
# Create the secret container
gcloud secrets create gemini-api-key --replication-policy="automatic"

# Add your API key as the first version of the secret
# Replace "your_gemini_api_key_here" with your actual key
printf "your_gemini_api_key_here" | gcloud secrets versions add gemini-api-key --data-file=-
```

**7. Create Artifact Registry Repository**
```bash
gcloud artifacts repositories create gcp-guru-repo \
    --repository-format=docker \
    --location=${REGION} \
    --description="GCP Guru Docker repository"
```

**8. Seed the Firestore Database**
*This step uploads the local question data to your new database.*
```bash
# Authenticate your local user for this script
gcloud auth application-default login

# Run the migration script
python3 backend/scripts/migrate_data.py
```

**9. Create the Cloud Build Trigger**
*This is the final manual step, which connects your Git repository to the pipeline.*

1.  Go to the [Cloud Build Triggers page](https://console.cloud.google.com/cloud-build/triggers) in the GCP Console.
2.  Click **"Create trigger"**.
3.  Fill in the following:
    *   **Name**: `deploy-on-push-to-main`
    *   **Region**: Select the same region as your services (e.g., `europe-west3`).
    *   **Event**: Select **"Push to a branch"**.
    *   **Source**: Select your Git repository and the `^main branch.
    *   **Configuration**: Select **"Cloud Build configuration file (yaml or json)"**. The default path of `/cloudbuild.yaml` is correct.
    *   **Service Account**: Select the appropriate Cloud Build service account (e.g., `cloud-build-deployer@...` or the default Cloud Build SA).
4.  Click **"Create"**.

**Your one-time setup is now complete!**

---

## Part 2: The Automated Deployment Process

With the CI/CD pipeline in place, the deployment process is now fully automated.

**To deploy any changes to the application, simply push your commits to the `main` branch.**

```bash
git add .
git commit -m "Your feature or fix"
git push origin main
```

Cloud Build will automatically detect the push, build the new container images, and deploy the new versions to Cloud Run. You can monitor the progress of your builds in the [Cloud Build history page](https://console.cloud.google.com/cloud-build/builds).

---

## Troubleshooting

- **Cloud Build Failures**: Check the logs for the specific build run in the Cloud Build history. Common issues include syntax errors in `cloudbuild.yaml` or permission errors for the Cloud Build service account.
- **GCS Permissions**: If case studies are not loading, ensure the backend's service account has the `Storage Object Viewer` role on your GCS bucket.
- **Secret Manager Permissions**: If the application fails to start due to API key issues, ensure the backend's service account has the `Secret Manager Secret Accessor` role on the `gemini-api-key` secret.
