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

**10. Grant Firestore Permissions to Backend Service Account**
*This critical step allows the backend to read/write data from Firestore.*

The Cloud Run backend service needs permission to access Firestore. Grant the `datastore.user` role to the backend's service account:

```bash
# Get the service account name (typically the same as Cloud Build service account)
BACKEND_SA=$(gcloud run services describe gcp-guru-backend --region=${REGION} --format='value(spec.template.spec.serviceAccountName)')

# Grant Firestore access
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${BACKEND_SA}" \
    --role="roles/datastore.user"
```

**11. Grant Secret Manager Permissions to Backend Service Account**
*This critical step allows the backend to access the Gemini API key for AI features.*

The backend needs permission to read the API key from Secret Manager:

```bash
# Grant Secret Manager access for the Gemini API key
gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:${BACKEND_SA}" \
    --role="roles/secretmanager.secretAccessor"
```

**12. Grant GCS Permissions to Backend Service Account**
*This critical step allows the backend to read case study files from Cloud Storage.*

The backend needs permission to read case study markdown files from the GCS bucket:

```bash
# Grant GCS read access for case study files
gsutil iam ch serviceAccount:${BACKEND_SA}:roles/storage.objectViewer gs://${BUCKET_NAME}
```

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
- **Firestore Permissions (CRITICAL)**: If the app loads but shows no data (empty progress page, no questions, no tags), the backend service account lacks Firestore access. Grant the `roles/datastore.user` role:
  ```bash
  gcloud projects add-iam-policy-binding PROJECT_ID \
      --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
      --role="roles/datastore.user"
  ```
  This permission change takes effect immediately without requiring redeployment.
- **Secret Manager Permissions (CRITICAL)**: If AI explanations and hints don't generate (no response when clicking "Get Explanation" or "Get Hint"), the backend lacks Secret Manager access. Grant the `roles/secretmanager.secretAccessor` role:
  ```bash
  gcloud secrets add-iam-policy-binding gemini-api-key \
      --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
      --role="roles/secretmanager.secretAccessor"
  ```
  This permission change takes effect immediately without requiring redeployment.
- **GCS Permissions (CRITICAL)**: If case study badges are clickable but show no content or return 404 errors, the backend lacks GCS access. Grant the `roles/storage.objectViewer` role:
  ```bash
  gsutil iam ch serviceAccount:SERVICE_ACCOUNT_EMAIL:roles/storage.objectViewer gs://BUCKET_NAME
  ```
  This permission change takes effect immediately without requiring redeployment.
