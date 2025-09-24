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
5.  **Performance Note**: For optimal performance from Europe, use `europe-west3` (Frankfurt) region.

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
# For European users (Germany, etc.), use europe-west3 for better performance
# For US users, use us-central1
export REGION="europe-west3"  # Frankfurt - optimal for European access
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
> **Important: Region-Specific Repositories**
>
> Artifact Registry repositories are region-specific. If you change regions (e.g., from `us-central1` to `europe-west3`), you must create a new repository in the target region. This ensures optimal performance by keeping Docker images close to your Cloud Run services.
>
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
docker build --no-cache -t ${BACKEND_IMAGE_URI} -f backend/Dockerfile .

# Push the image to Artifact Registry
docker push ${BACKEND_IMAGE_URI}
```
> **Performance Tip: Region Migration**
>
> If you're migrating from a different region (e.g., `us-central1` to `europe-west3`):
> 1. Create a new Artifact Registry in the target region
> 2. Rebuild and push images to the new repository
> 3. Deploy services to the new region for reduced latency
>
> **Troubleshooting: `Requires 1 argument` or `Unauthenticated`**
> - If `docker build` fails with `requires 1 argument`, your `${BACKEND_IMAGE_URI}` variable is empty. Re-run Step 2.
> - If `docker push` fails with `Unauthenticated`, you missed Step 4.

**7. Deploy Backend to Cloud Run with Performance Optimizations**
```bash
# Set your Gemini API key (replace with your actual key)
export GOOGLE_API_KEY="your_gemini_api_key_here"

# Deploy backend with performance optimizations for better response times
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
    --set-env-vars="GOOGLE_API_KEY=${GOOGLE_API_KEY}"

# Get the backend URL (needed for frontend deployment)
export BACKEND_URL=$(gcloud run services describe gcp-guru-backend --platform managed --region=${REGION} --format 'value(status.url)')
echo "✅ Backend deployed at: ${BACKEND_URL}"
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

echo "✅ Backend permissions configured"
```
> **Troubleshooting: `Invalid service account ()`**
> If this fails, the `${SERVICE_ACCOUNT}` variable is empty. This can happen if the previous `gcloud run services describe` command failed. Verify the service exists in the Cloud Console and that your `${REGION}` variable is set correctly.

**9. Build and Deploy Frontend**
Now build the frontend with the backend URL and deploy it:
```bash
# Build frontend with backend URL
export FRONTEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-frontend:latest"
docker build --no-cache --build-arg NEXT_PUBLIC_API_URL=${BACKEND_URL} -t ${FRONTEND_IMAGE_URI} -f frontend/Dockerfile .

# Push frontend image
docker push ${FRONTEND_IMAGE_URI}

# Deploy frontend with performance optimizations
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

# Get the frontend URL
export FRONTEND_URL=$(gcloud run services describe gcp-guru-frontend --platform managed --region=${REGION} --format 'value(status.url)')
echo "✅ Frontend deployed at: ${FRONTEND_URL}"
```

Your application is now live with optimized performance!

---

## Part 3: Performance Optimization Notes

### Regional Deployment Best Practices

**For European Users (Germany, etc.):**
- Use `europe-west3` (Frankfurt) for minimal latency
- Create region-specific Artifact Registry repositories
- Deploy both backend and frontend to the same region

**Performance Configuration Applied:**
```bash
# Configuration used in successful Europe-West3 deployment:
--region=europe-west3
--min-instances=0        # Cost-optimized: scales to zero when not used
--max-instances=10       # Scales under load
--cpu=2                  # Fast processing
--memory=1Gi            # Ample resources
--concurrency=100       # High throughput
--timeout=300           # Extended timeout for AI operations
```

**Cost vs Performance Trade-offs:**
- **Latency**: ~80% reduction (1.5s → 200-300ms from Hamburg) after warm-up
- **Cold Starts**: ~2-3 seconds on first request after inactivity (acceptable for study app)
- **Processing Speed**: 2x faster with dual CPU cores once warmed up
- **Monthly Cost**: Near $0 with typical usage (30 min/day) - stays within free tier

---

## Part 4: Advanced Frontend Configuration

**1. Create the Frontend Dockerfile (Already Created)**
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

> **⚠️ CRITICAL: Frontend-Backend Connection Issue**
>
> During deployment, we encountered a complex issue where the frontend couldn't connect to the backend despite correct environment variable configuration. This section documents the **root cause and solution** to prevent future struggles.
>
> **The Problem**: Frontend was returning 404 errors for all API calls instead of connecting to the deployed backend.
>
> **Root Cause Analysis**:
> 1. **Next.js Config Rewrites**: The `next.config.js` had hardcoded rewrites that redirected all `/api/*` calls to `localhost:8000` in **both development AND production**
> 2. **Incorrect API_BASE_URL Logic**: The fallback logic in `api.ts` was backwards - it used a hardcoded backend URL as fallback instead of letting `NEXT_PUBLIC_API_URL` take precedence
> 3. **Docker Build Caching**: Docker cached old builds without the correct environment variables
>
> **The Solution**:
> 1. **Fix next.config.js**: Only use rewrites in development mode:
>    ```javascript
>    async rewrites() {
>      if (process.env.NODE_ENV === 'development') {
>        return [{ source: '/api/:path*', destination: 'http://localhost:8000/api/:path*' }]
>      }
>      return [] // No rewrites in production
>    }
>    ```
> 2. **Fix api.ts logic**: Prioritize environment variable over fallback:
>    ```javascript
>    // CORRECT - environment variable takes precedence
>    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
>
>    // WRONG - hardcoded fallback always used
>    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hardcoded-backend-url';
>    ```
> 3. **Always use --no-cache**: When changing environment variables, always rebuild without cache:
>    ```bash
>    docker build --no-cache --build-arg NEXT_PUBLIC_API_URL=${BACKEND_URL} ...
>    ```
>
> **Debugging Commands for Future Issues**:
> ```bash
> # 1. Test backend directly
> curl -s ${BACKEND_URL}/api/tags
>
> # 2. Test frontend API routing
> curl -I https://your-frontend-url.com/api/tags
> # Should NOT return "x-powered-by: Next.js" if configured correctly
>
> # 3. Check browser console for debug logs
> # Add temporary logging: console.log('API_BASE_URL:', API_BASE_URL);
>
> # 4. Verify Docker build includes correct environment variable
> # Look for: "Building with NEXT_PUBLIC_API_URL: https://your-backend-url"
> ```
>
> **Key Lesson**: When frontend and backend are deployed separately, ensure the frontend's API configuration properly uses environment variables and doesn't have conflicting route handlers.

```bash
# Define the full URI for your frontend container image
export FRONTEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-frontend:latest"

# Build the frontend image (CRITICAL: ALWAYS use --no-cache when changing environment variables)
docker build --no-cache --build-arg NEXT_PUBLIC_API_URL=${BACKEND_URL} -t ${FRONTEND_IMAGE_URI} -f frontend/Dockerfile .

# Push the frontend image to Artifact Registry
docker push ${FRONTEND_IMAGE_URI}

# Deploy to Cloud Run with performance optimizations
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
    --port=3000
```

### Custom Domain Setup

Once both services are deployed:

```bash
# Get the frontend service URL
export FRONTEND_URL=$(gcloud run services describe gcp-guru-frontend --platform managed --region=${REGION} --format 'value(status.url)')

# Configure your DNS (graspdatascience.com) to point to the frontend URL
# In your domain registrar's DNS settings:
# - Create a CNAME record pointing your domain to your Cloud Run service URL
# - Or use Google Cloud Load Balancer for custom domain mapping
```

---

## Part 4: Custom Domain Setup

To set up a custom domain (like graspdatascience.com) for your deployed application:

**1. Domain Mapping in Cloud Run**
```bash
# Map your custom domain to the frontend service
gcloud run domain-mappings create \
    --service gcp-guru-frontend \
    --domain graspdatascience.com \
    --region=${REGION}
```

**2. DNS Configuration**
Follow the instructions provided by the domain mapping command to configure your DNS records.

---

## Part 5: Updating Your Deployed Application

When you make changes to your code:

**Using the deploy.sh Script (Recommended for Service Updates):**
```bash
# For configuration changes only (CPU, memory, region, etc.)
export GOOGLE_API_KEY="your_gemini_api_key_here"
./deploy.sh
```

**For Code Changes - Full Rebuild and Deploy:**

**Complete Workflow (Backend + Frontend):**
```bash
# 1. Set environment variables
export REGION="europe-west3"  # Or your preferred region
export PROJECT_ID=$(gcloud config get-value project)
export GOOGLE_API_KEY="your_gemini_api_key_here"

# 2. Build and push backend
export BACKEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-backend:latest"
docker build --no-cache -t ${BACKEND_IMAGE_URI} -f backend/Dockerfile .
docker push ${BACKEND_IMAGE_URI}

# 3. Deploy backend (get URL for frontend)
gcloud run deploy gcp-guru-backend \
    --image=${BACKEND_IMAGE_URI} \
    --region=${REGION} \
    --min-instances=0 --max-instances=10 --cpu=2 --memory=1Gi \
    --set-env-vars="GCS_BUCKET_NAME=gcp-guru-data-bucket-${PROJECT_ID}" \
    --set-env-vars="GOOGLE_API_KEY=${GOOGLE_API_KEY}"

export BACKEND_URL=$(gcloud run services describe gcp-guru-backend --platform managed --region=${REGION} --format 'value(status.url)')

# 4. Build and push frontend with backend URL
export FRONTEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-frontend:latest"
docker build --no-cache --build-arg NEXT_PUBLIC_API_URL=${BACKEND_URL} -t ${FRONTEND_IMAGE_URI} -f frontend/Dockerfile .
docker push ${FRONTEND_IMAGE_URI}

# 5. Deploy frontend
gcloud run deploy gcp-guru-frontend \
    --image=${FRONTEND_IMAGE_URI} \
    --region=${REGION} \
    --min-instances=0 --max-instances=10 --cpu=2 --memory=1Gi \
    --set-env-vars="NEXT_PUBLIC_API_URL=${BACKEND_URL}"
```

> **Key Workflow Notes:**
> - For **code changes**: Full rebuild → push → deploy workflow required
> - For **performance tweaks** (CPU, memory, region): Use `deploy.sh` script only
> - **Backend must be deployed first** to get URL for frontend build
> - **Region-specific repositories** needed when changing regions

---

## Conclusion

Your GCP Guru application is now successfully deployed on Google Cloud Platform with:
- ✅ Backend API running on Cloud Run with GCS storage
- ✅ Frontend application on separate Cloud Run service
- ✅ Custom domain configuration
- ✅ Persistent data storage in GCS
- ✅ Proper environment variable configuration

The application should be accessible at your custom domain and fully functional for GCP certification exam preparation.