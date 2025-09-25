# GCP Deployment Guide for GCP Guru

This guide provides step-by-step instructions for deploying the GCP Guru application to Google Cloud Platform. It includes solutions for common issues encountered during deployment.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Part 1: Setting Up The Cloud Environment](#part-1-setting-up-the-cloud-environment)
- [Part 2: Backend Deployment (FastAPI)](#part-2-backend-deployment-fastapi)
- [Part 3: Frontend Deployment (Next.js)](#part-3-frontend-deployment-nextjs)
- [Part 4: Updating Your Deployed Application](#part-4-updating-your-deployed-application)
- [Conclusion](#conclusion)

## Architecture Overview

- **Backend (FastAPI)**: A Dockerized container running on **Google Cloud Run**.
- **Frontend (Next.js)**: A Dockerized container on a separate **Google Cloud Run** service.
- **Data Storage**: Application data (questions, progress, case studies) stored in a **Google Cloud Storage (GCS)** bucket.
- **Container Registry**: Docker images will be stored in **Google Artifact Registry**.

## Prerequisites

1.  **Google Cloud Account**: With billing enabled.
2.  **`gcloud` CLI**: Authenticated with your account (`gcloud auth login`).
3.  **Git Repository**: Your project code hosted on a platform like GitHub.
4.  **Performance Note**: For optimal performance from Europe, use `europe-west3` (Frankfurt) region.

---

## Part 1: Setting Up The Cloud Environment

These steps should be performed within the **Google Cloud Shell**.

**1. Clone Your Project Repository**
```bash
# Replace with your repository's URL
git clone https://github.com/artkel/gcp-guru.git
cd gcp-guru
```

**2. Set Core Environment Variables**
```bash
# For European users (Germany, etc.), use europe-west3 for better performance
export REGION="europe-west3"
export PROJECT_ID=$(gcloud config get-value project)
```

**3. Enable Required APIs**
```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
```

---

## Part 2: Backend Deployment (FastAPI)

### A. Code Modification for GCS
**Crucial:** Cloud Run is stateless. The application code is already configured to read/write all necessary data (questions, progress, case studies) from a GCS bucket instead of the local filesystem.

### B. Step-by-Step Backend Deployment

**1. Create a GCS Bucket**
```bash
export BUCKET_NAME="gcp-guru-data-bucket-${PROJECT_ID}"
gsutil mb -p ${PROJECT_ID} -l ${REGION} gs://${BUCKET_NAME}
```

**2. Upload Initial Data to GCS**
This includes the questions file, an empty session history, and the case study documents.
```bash
# Run from your project's root directory in Cloud Shell
gsutil cp data/gcp-pca-questions.json gs://${BUCKET_NAME}/gcp-pca-questions.json
gsutil cp data/session_history.json gs://${BUCKET_NAME}/session_history.json

# Upload case study files
gsutil cp documentation/mountkirk_games.md gs://${BUCKET_NAME}/mountkirk_games.md
gsutil cp documentation/ehr_healthcare.md gs://${BUCKET_NAME}/ehr_healthcare.md
gsutil cp documentation/terramearth.md gs://${BUCKET_NAME}/terramearth.md
gsutil cp documentation/hrl.md gs://${BUCKET_NAME}/hrl.md
```

**3. Create an Artifact Registry Repository**
```bash
gcloud artifacts repositories create gcp-guru-repo \
    --repository-format=docker \
    --location=${REGION} \
    --description="GCP Guru Docker repository"
```

**4. Authenticate Docker**
This allows the Docker command to push images to your new repository.
```bash
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

**5. Build and Push the Backend Image**
```bash
export BACKEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-backend:latest"
docker build --no-cache -t ${BACKEND_IMAGE_URI} -f backend/Dockerfile .
docker push ${BACKEND_IMAGE_URI}
```

**6. Deploy Backend to Cloud Run**
The `deploy.sh` script handles this automatically. When running manually, you will be prompted for your API key.
```bash
# You will be prompted to enter your Gemini API key
gcloud run deploy gcp-guru-backend \
    --image=${BACKEND_IMAGE_URI} \
    --platform=managed \
    --region=${REGION} \
    --allow-unauthenticated \
    --min-instances=0 \
    --max-instances=10 \
    --cpu=2 \
    --memory=1Gi \
    --concurrency=100 \
    --timeout=300 \
    --set-env-vars="GCS_BUCKET_NAME=${BUCKET_NAME}" \
    --set-env-vars="GOOGLE_API_KEY=YOUR_API_KEY_HERE" # Replace or set in environment

# Get the backend URL (needed for frontend deployment)
export BACKEND_URL=$(gcloud run services describe gcp-guru-backend --platform managed --region=${REGION} --format 'value(status.url)')
echo "✅ Backend deployed at: ${BACKEND_URL}"
```

**7. Grant GCS Permissions**
Allow the new Cloud Run service to access the GCS bucket.
```bash
export SERVICE_ACCOUNT=$(gcloud run services describe gcp-guru-backend --platform managed --region=${REGION} --format 'value(spec.template.spec.serviceAccountName)')
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:objectAdmin gs://${BUCKET_NAME}
echo "✅ Backend permissions configured"
```

---

## Part 3: Frontend Deployment (Next.js)

Now, build the frontend with the backend URL and deploy it.

```bash
# Build frontend with backend URL
export FRONTEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-frontend:latest"
docker build --no-cache --build-arg NEXT_PUBLIC_API_URL=${BACKEND_URL} -t ${FRONTEND_IMAGE_URI} -f frontend/Dockerfile .

# Push frontend image
docker push ${FRONTEND_IMAGE_URI}

# Deploy frontend
gcloud run deploy gcp-guru-frontend \
    --image=${FRONTEND_IMAGE_URI} \
    --platform=managed \
    --region=${REGION} \
    --allow-unauthenticated \
    --min-instances=0 \
    --max-instances=10 \
    --cpu=2 \
    --memory=1Gi \
    --concurrency=100 \
    --timeout=300 \
    --set-env-vars="NEXT_PUBLIC_API_URL=${BACKEND_URL}" \
    --port=3000

# Get the final frontend URL
export FRONTEND_URL=$(gcloud run services describe gcp-guru-frontend --platform managed --region=${REGION} --format 'value(status.url)')
echo "✅ Frontend deployed at: ${FRONTEND_URL}"
```

Your application is now live! Access it via the URL provided.

---

## Part 4: Updating Your Deployed Application

When you make changes to your code, you must rebuild and redeploy the relevant service.

**Using the `deploy.sh` Script (Recommended)**
This script automates the entire deployment process for both services.
```bash
# From the project root, ensure you are authenticated with gcloud.
# The script will prompt for your API key if it's not set as an environment variable.
./deploy.sh
```

**For Code Changes - Manual Rebuild and Deploy**
If you change the backend code, you must rebuild and push the backend image, then redeploy. If you change the frontend, do the same for the frontend image.

Example for backend code change:
```bash
# 1. Rebuild and push backend image
export BACKEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-backend:latest"
docker build --no-cache -t ${BACKEND_IMAGE_URI} -f backend/Dockerfile .
docker push ${BACKEND_IMAGE_URI}

# 2. Redeploy backend service
# The deploy.sh script is the easiest way to do this.
./deploy.sh
```

> **Key Workflow Notes:**
> - For **code changes**: A full rebuild → push → deploy workflow is required for the affected service.
> - For **configuration changes** (like environment variables): You can often just re-run the deployment command or use `./deploy.sh`.

---

## Conclusion

Your GCP Guru application is now successfully deployed on Google Cloud Platform. The application is accessible via the default URL provided by Cloud Run for the frontend service.

### Cost & Performance Notes

- **Cost**: The primary ongoing cost will be from the **Google Gemini API**, which is billed based on the number of characters sent and received in prompts. The Cloud Run services are configured to scale to zero, so their cost will be minimal (often within the free tier) for typical, intermittent usage.
- **Latency**: The first request to the application after a period of inactivity may take 2-3 seconds for the container to start (a "cold start"). Subsequent requests will be much faster.
- **Region**: Deploying to a region physically closer to your users (like `europe-west3` for Europe) will minimize network latency.
