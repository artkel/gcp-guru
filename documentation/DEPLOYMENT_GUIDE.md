# GCP Deployment Guide for GCP Guru

This guide provides step-by-step instructions for deploying the GCP Guru application (both frontend and backend) to Google Cloud Platform using Cloud Run and Google Cloud Storage.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Part 1: Backend Deployment (FastAPI)](#part-1-backend-deployment-fastapi)
  - [A. Critical Note on Statefulness & GCS](#a-critical-note-on-statefulness--gcs)
  - [B. Step-by-Step Backend Deployment](#b-step-by-step-backend-deployment)
- [Part 2: Frontend Deployment (Next.js)](#part-2-frontend-deployment-nextjs)
- [Part 3: Custom Domain Setup](#part-3-custom-domain-setup)
- [Conclusion](#conclusion)

## Architecture Overview

We will deploy the application using the following architecture:
- **Backend (FastAPI)**: A Dockerized container running on **Google Cloud Run**, a serverless platform.
- **Frontend (Next.js)**: A Dockerized container running on a separate **Google Cloud Run** service.
- **Data Storage**: Application data (`gcp-pca-questions.json`, `session_history.json`) will be stored in a **Google Cloud Storage (GCS)** bucket to ensure data persistence, as Cloud Run instances are stateless.

## Prerequisites

Before you begin, ensure you have the following installed and configured:
1.  **Google Cloud Account**: A GCP account with billing enabled.
2.  **`gcloud` CLI**: The Google Cloud command-line tool, authenticated with your account (`gcloud auth login` and `gcloud config set project YOUR_PROJECT_ID`).
3.  **Docker**: Docker Desktop installed and running on your local machine.
4.  **Node.js & npm**: Required for building the Next.js frontend.
5.  **Python**: Required for the FastAPI backend.
6.  **Domain Name**: Your custom domain (`graspdatascience.com`) registered with a provider like Namecheap.

---

## Part 1: Backend Deployment (FastAPI)

### A. Critical Note on Statefulness & GCS

The backend application reads from and writes to JSON files in the `data/` directory. Cloud Run instances are **stateless (ephemeral)**, meaning any changes written to the local file system will be lost when the instance shuts down or restarts.

To solve this, we must modify the backend to use **Google Cloud Storage (GCS)** for reading and writing these files.

#### Necessary Code Modifications:
You will need to update your service logic (`backend/services/question_service.py` and `backend/services/progress_service.py`) to interact with GCS instead of the local filesystem.

1.  **Add the GCS library to `backend/requirements.txt`**:
    ```
    google-cloud-storage
    ```

2.  **Update your Python services**:
    Replace file operations like `open('data/some-file.json', 'r')` with GCS client library calls. Here is a conceptual example of what a helper function might look like:

    ```python
    # backend/services/gcs_service.py (A new helper service)
    from google.cloud import storage
    import json
    import os

    BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")
    storage_client = storage.Client()

    def download_json_from_gcs(source_blob_name):
        """Downloads a blob from the bucket and loads it as JSON."""
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(source_blob_name)
        data_string = blob.download_as_string()
        return json.loads(data_string)

    def upload_json_to_gcs(data, destination_blob_name):
        """Uploads data as a JSON string to the bucket."""
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_string(
            data=json.dumps(data, indent=2),
            content_type='application/json'
        )
    ```

You would then use these functions in `question_service.py` and `progress_service.py` to manage your JSON data.

### B. Step-by-Step Backend Deployment

**1. Create a GCS Bucket**
This bucket will store your application's data files.

```bash
# Choose a unique bucket name
export BUCKET_NAME="gcp-guru-data-bucket-$(gcloud config get-value project)"

# Create the bucket
gsutil mb -p $(gcloud config get-value project) -l EUROPE-WEST3 gs://${BUCKET_NAME}
```

**2. Upload Initial Data to GCS**
Upload your questions file to the newly created bucket.

```bash
# If you uploaded the files into /home/artkel/data in Cloud Shell, use the following commands:

gsutil cp /home/artkel/data/gcp-pca-questions.json gs://${BUCKET_NAME}/gcp-pca-questions.json
gsutil cp /home/artkel/data/session_history.json gs://${BUCKET_NAME}/session_history.json
```

**3. Dockerize the FastAPI Application**
Create a `Dockerfile` in the `backend/` directory:

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Copy backend source code
COPY . /app

# Expose port and run the application
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**4. Build and Push the Docker Image**
We'll use Google Artifact Registry to store our container image.

```bash
# Set your region
export REGION="us-central1"

# 1. Enable the Artifact Registry API
gcloud services enable artifactregistry.googleapis.com

# 2. Create a Docker repository
gcloud artifacts repositories create gcp-guru-repo \
    --repository-format=docker \
    --location=${REGION} \
    --description="GCP Guru Docker repository"

# 3. Configure Docker to authenticate with Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# 4. Build and push the image (run from the project root directory)
export PROJECT_ID=$(gcloud config get-value project)
export IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-backend:latest"

docker build -t ${IMAGE_URI} -f backend/Dockerfile .

docker push ${IMAGE_URI}
```

**5. Deploy to Cloud Run**
Now, deploy the container image to Cloud Run.

```bash
# Deploy the backend service
gcloud run deploy gcp-guru-backend \
    --image=${IMAGE_URI} \
    --platform=managed \
    --region=${REGION} \
    --allow-unauthenticated \
    --set-env-vars="GCS_BUCKET_NAME=${BUCKET_NAME}" \
    --set-env-vars="GOOGLE_API_KEY=your_gemini_api_key_here"

# After deployment, Cloud Run will provide a service URL. Note this down.
# Example: https://gcp-guru-backend-xxxxxxxxxx-uc.a.run.app
```

**6. Grant GCS Permissions**
The Cloud Run service needs permission to access the GCS bucket.

```bash
# Get the service account email for your Cloud Run service
export SERVICE_ACCOUNT=$(gcloud run services describe gcp-guru-backend --platform managed --region ${REGION} --format 'value(status.serviceAccountName)')

# Grant the 'Storage Object Admin' role to the service account
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:objectAdmin gs://${BUCKET_NAME}
```

Your backend is now live!

---

## Part 2: Frontend Deployment (Next.js)

**1. Dockerize the Next.js Application**
Create a `Dockerfile` in the `frontend/` directory. This uses a multi-stage build for a smaller, more secure production image.

```dockerfile
# frontend/Dockerfile

# 1. Builder Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Set the backend API URL during build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# 2. Production Stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

**2. Build and Push the Frontend Image**
This process is similar to the backend.

```bash
# Run from the project root directory
export FRONTEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-frontend:latest"

# Get your backend URL from the previous step
export BACKEND_URL=$(gcloud run services describe gcp-guru-backend --platform managed --region ${REGION} --format 'value(status.url)')

# Build the image, passing the backend URL as a build argument
docker build \
    --build-arg NEXT_PUBLIC_API_URL=${BACKEND_URL} \
    -t ${FRONTEND_IMAGE_URI} -f frontend/Dockerfile .

# Push the image
docker push ${FRONTEND_IMAGE_URI}
```

**3. Deploy Frontend to Cloud Run**

```bash
gcloud run deploy gcp-guru-frontend \
    --image=${FRONTEND_IMAGE_URI} \
    --platform=managed \
    --region=${REGION} \
    --allow-unauthenticated
```
After deployment, you'll get a public URL for your frontend. You can now access your full application!

---

## Part 3: Custom Domain Setup

You do **not** need to buy separate web hosting. You can point your `graspdatascience.com` domain directly to your Cloud Run frontend service.

**1. Add and Verify Your Domain in GCP**

*   Navigate to the **Google Cloud Run** console.
*   Click on your frontend service (`gcp-guru-frontend`).
*   Go to the **Custom Domains** tab and click **Add Mapping**.
*   Select your service and enter the domain you want to use (e.g., `www.graspdatascience.com` or `app.graspdatascience.com`).
*   Google will ask you to **verify domain ownership**. It will provide a `TXT` record that you must add to your domain's DNS settings in your Namecheap account.

**2. Update DNS Records at Namecheap**

*   Log in to your **Namecheap** account.
*   Go to the DNS management page for `graspdatascience.com`.
*   Add the `TXT` record provided by Google to verify ownership.
*   Once verified, Google will provide the final DNS records (typically `A` and `AAAA` records) to point your domain to the Cloud Run service.
*   Go back to Namecheap and replace any existing `A` or `AAAA` records for your chosen hostname (e.g., `www`) with the ones provided by Google.

**3. Wait for Propagation**
DNS changes can take anywhere from a few minutes to several hours to propagate. Once complete, Google will automatically provision and manage an SSL certificate for your custom domain. You can then access your application at `https://www.graspdatascience.com`.

## Conclusion

Your GCP Guru application is now deployed on a scalable, serverless infrastructure. You have:
- A secure, stateful backend using Cloud Run and GCS.
- A high-performance Next.js frontend on Cloud Run.
- A custom domain with SSL pointing to your application.
