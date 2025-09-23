# GCP Deployment Guide for GCP Guru

This guide provides step-by-step instructions for deploying the GCP Guru application to Google Cloud Platform. It includes solutions for common issues encountered during deployment.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Part 1: Setting Up The Cloud Environment](#part-1-setting-up-the-cloud-environment)
- [Part 2: Backend Deployment (FastAPI)](#part-2-backend-deployment-fastapi)
- [Part 3: Frontend Deployment (Next.js)](#part-3-frontend-deployment-nextjs)
- [Part 4: Custom Domain Setup](#part-4-custom-domain-setup)
- [Part 5: Updating Your Deployed Application](#part-5-updating-your-deployed-application)
- [Conclusion](#conclusion)

## Architecture Overview

- **Backend (FastAPI)**: A Dockerized container running on **Google Cloud Run**.
- **Frontend (Next.js)**: A Dockerized container on a separate **Google Cloud Run** service.
- **Data Storage**: `gcp-pca-questions.json` and `session_history.json` stored in a **Google Cloud Storage (GCS)** bucket to ensure data persistence.
- **Container Registry**: Docker images will be stored in **Google Artifact Registry**.

## Prerequisites

1.  **Google Cloud Account**: With billing enabled.
2.  **`gcloud` CLI**: Authenticated with your account (`gcloud auth login`).
3.  **Git Repository**: Your project code hosted on a platform like GitHub.
4.  **Domain Name (Optional)**: Required if you want a custom URL.

---

## Part 1: Setting Up The Cloud Environment

These steps should be performed within the **Google Cloud Shell**.

**1. Clone Your Project Repository**
The Cloud Shell environment is a separate machine and does not have your local files. You must clone your project from your Git repository.

```bash
# Replace with your repository's URL
git clone https://github.com/your-username/gcp-guru.git

# Navigate into the project directory. All subsequent commands should be run from here.
cd gcp-guru
```

**2. Set Core Environment Variables**
Cloud Shell sessions can time out. If you get errors about missing variables, re-run this step.

```bash
# We use us-central1 as it is a widely available region.
# If you have issues, your organization may have location policies.
export REGION="us-central1"
export PROJECT_ID=$(gcloud config get-value project)
```

**3. Enable Required APIs**
This ensures Cloud Run and Artifact Registry are ready to use.
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

---

## Part 2: Backend Deployment (FastAPI)

### A. Code Modification for GCS
**Crucial:** Cloud Run is stateless. Your application code must be modified to read/write JSON data from GCS instead of the local filesystem. This involves:
1.  Adding `google-cloud-storage` to `backend/requirements.txt`.
2.  Updating your Python services (`question_service.py`, `progress_service.py`) to use the GCS client library.

*This guide assumes these code modifications have been made.*

### B. Step-by-Step Backend Deployment

**1. Create a GCS Bucket**
```bash
# Create a unique bucket name
export BUCKET_NAME="gcp-guru-data-bucket-${PROJECT_ID}"

# Create the bucket
gsutil mb -p ${PROJECT_ID} -l ${REGION} gs://${BUCKET_NAME}
```

**2. Upload Initial Data to GCS**
```bash
# Run from your project's root directory in Cloud Shell
gsutil cp data/gcp-pca-questions.json gs://${BUCKET_NAME}/gcp-pca-questions.json
gsutil cp data/session_history.json gs://${BUCKET_NAME}/session_history.json
```

**3. Create an Artifact Registry Repository**
```bash
gcloud artifacts repositories create gcp-guru-repo \
    --repository-format=docker \
    --location=${REGION} \
    --description="GCP Guru Docker repository"
```
> **Troubleshooting: `LOCATION_POLICY_VIOLATED`**
> If you see this error, your GCP project has a policy restricting which regions you can use. The easiest fix is to use a different, permitted region (e.g., `us-central1`, `europe-west1`).

**4. Authenticate Docker**
This crucial step allows the Docker command to push images to your new repository.
```bash
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

**5. Update the Backend Dockerfile**
Ensure your `backend/Dockerfile` is corrected to work with Cloud Run's port requirements. The `CMD` line is the most important part.

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt
COPY . /app
EXPOSE 8080
# This command dynamically uses the port Cloud Run provides
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
```
> **Note:** If you edit this file locally, make sure to `git commit` and `git pull` the changes into your Cloud Shell environment before building.

**6. Build and Push the Backend Image**
```bash
# Define the full URI for your backend container image
export BACKEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-backend:latest"

# Build the image (the final '.' refers to the current directory)
docker build -t ${BACKEND_IMAGE_URI} -f backend/Dockerfile .

# Push the image to Artifact Registry
docker push ${BACKEND_IMAGE_URI}
```
> **Troubleshooting: `Requires 1 argument` or `Unauthenticated`**
> - If `docker build` fails with `requires 1 argument`, your `${BACKEND_IMAGE_URI}` variable is empty. Re-run Step 2.
> - If `docker push` fails with `Unauthenticated`, you missed Step 4.

**7. Deploy to Cloud Run**
```bash
# Remember to replace with your actual Gemini API key
export GOOGLE_API_KEY="your_gemini_api_key_here"

gcloud run deploy gcp-guru-backend \
    --image=${BACKEND_IMAGE_URI} \
    --platform=managed \
    --region=${REGION} \
    --allow-unauthenticated \
    --set-env-vars="GCS_BUCKET_NAME=${BUCKET_NAME}" \
    --set-env-vars="GOOGLE_API_KEY=${GOOGLE_API_KEY}"
```
> **Troubleshooting: `container failed to start`**
> This error means the app inside your container crashed. The most common cause is the port mismatch. Ensure your `Dockerfile` (Step 5) is correct, then rebuild and push a new image.

**8. Grant GCS Permissions**
The final step is allowing the Cloud Run service to access the GCS bucket.
```bash
# Get the service account email using the CORRECT path
export SERVICE_ACCOUNT=$(gcloud run services describe gcp-guru-backend --platform managed --region=${REGION} --format 'value(spec.template.spec.serviceAccountName)')

# Grant the 'Storage Object Admin' role
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:objectAdmin gs://${BUCKET_NAME}
```
> **Troubleshooting: `Invalid service account ()`**
> If this fails, the `${SERVICE_ACCOUNT}` variable is empty. This can happen if the previous `gcloud run services describe` command failed. Verify the service exists in the Cloud Console and that your `${REGION}` variable is set correctly.

Your backend is now live! The deployment command will output the **Service URL**.

---

## Part 3: Frontend Deployment (Next.js)

**1. Create the Frontend Dockerfile**
Place this file at `frontend/Dockerfile`. This version is specifically designed to handle the project's structure with nested `package.json` files.

```dockerfile
# frontend/Dockerfile

# 1. Builder Stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package.json files for both root and frontend
# This allows us to install dependencies and leverage Docker's cache
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies for the root directory
RUN npm install

# Install dependencies for the frontend directory
# Using --prefix is a clean way to target a subdirectory
RUN npm install --prefix frontend

# Copy the rest of the source code
COPY . .

# Set the backend API URL for the Next.js build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# The root build script is "cd frontend && npm run build", which is what we want.
# This will now work because frontend dependencies are installed.
RUN npm run build

# ---

# 2. Production Stage
FROM node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy only the necessary production artifacts from the builder stage
# We only need the contents of the 'frontend' directory
COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/next.config.js ./

EXPOSE 3000

# The start command is in the frontend's package.json ("next start")
CMD ["npm", "start"]
```

**2. Build and Push the Frontend Image**
```