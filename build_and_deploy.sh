#!/bin/bash

# This script builds and pushes Docker images, uploads data,
# and then runs the main deployment script.

set -e # Exit on any error

echo "🚀 Starting full build and deployment process..."

# 1. Set up environment variables (borrowed from deploy.sh)
export REGION="europe-west3"
export PROJECT_ID=$(gcloud config get-value project)
export BUCKET_NAME="gcp-guru-data-bucket-${PROJECT_ID}"
export REPO_NAME="gcp-guru-repo"
export BACKEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/gcp-guru-backend:latest"
export FRONTEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/gcp-guru-frontend:latest"

echo "✅ Environment variables set."

# 2. Authenticate Docker
echo "🔐 Authenticating Docker with gcloud..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev
echo "✅ Docker authenticated."

# 3. Build and push backend image
echo "🏗️ Building backend Docker image..."
docker build --no-cache -t ${BACKEND_IMAGE_URI} -f backend/Dockerfile .
echo "⬆️ Pushing backend image to Artifact Registry..."
docker push ${BACKEND_IMAGE_URI}
echo "✅ Backend image pushed."

# 4. Build and push frontend image
# The backend URL is passed as a runtime env var by deploy.sh, so we can use a placeholder here.
echo "🎨 Building frontend Docker image..."
docker build --no-cache --build-arg NEXT_PUBLIC_API_URL="http://placeholder.com" -t ${FRONTEND_IMAGE_URI} -f frontend/Dockerfile .
echo "⬆️ Pushing frontend image to Artifact Registry..."
docker push ${FRONTEND_IMAGE_URI}
echo "✅ Frontend image pushed."

# 5. Upload updated data files to GCS
echo "🔄 Uploading updated data files to GCS..."
gsutil cp data/gcp-pca-questions.json gs://${BUCKET_NAME}/gcp-pca-questions.json
gsutil cp documentation/mountkirk_games.md gs://${BUCKET_NAME}/mountkirk_games.md
gsutil cp documentation/ehr_healthcare.md gs://${BUCKET_NAME}/ehr_healthcare.md
gsutil cp documentation/terramearth.md gs://${BUCKET_NAME}/terramearth.md
gsutil cp documentation/hrl.md gs://${BUCKET_NAME}/hrl.md
echo "✅ Data files uploaded."

# 6. Run the deployment script
echo "🚀 Handing off to deployment script..."
./deploy.sh

echo "🎉 Full build and deployment process complete!"