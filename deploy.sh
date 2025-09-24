#!/bin/bash

# Performance-optimized deployment script for GCP Guru
# This script deploys both backend and frontend with optimizations for Hamburg, Germany access

set -e  # Exit on any error

echo "🚀 Starting GCP Guru deployment with performance optimizations..."

# Set the region to Frankfurt (closest to Hamburg)
export REGION="europe-west3"

# Get the project ID from gcloud config
export PROJECT_ID=$(gcloud config get-value project)

# Set the bucket name
export BUCKET_NAME="gcp-guru-data-bucket-${PROJECT_ID}"

# Set the repository name
export REPO_NAME="gcp-guru-repo"

# Set the image URIs
export BACKEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/gcp-guru-backend:latest"
export FRONTEND_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/gcp-guru-frontend:latest"

# Get the Google API key from environment or prompt user
export GOOGLE_API_KEY="AIzaSyAKIaCr9kPbGW7N24H3_bLYt-PXjU9egJw"

echo "📍 Deploying to region: ${REGION}"
echo "🏗️  Project ID: ${PROJECT_ID}"
echo ""

echo "🔧 Deploying gcp-guru-backend with performance optimizations..."
gcloud run deploy gcp-guru-backend \
    --image=${BACKEND_IMAGE_URI} \
    --platform=managed \
    --region=${REGION} \
    --allow-unauthenticated \
    --min-instances=1 \
    --max-instances=10 \
    --cpu=2 \
    --memory=1Gi \
    --concurrency=100 \
    --timeout=300 \
    --set-env-vars="GCS_BUCKET_NAME=${BUCKET_NAME}" \
    --set-env-vars="GOOGLE_API_KEY=${GOOGLE_API_KEY}"

# Get the backend URL
export BACKEND_URL=$(gcloud run services describe gcp-guru-backend --platform managed --region=${REGION} --format 'value(status.url)')

echo "✅ Backend deployed successfully at: ${BACKEND_URL}"
echo ""

echo "🎨 Deploying gcp-guru-frontend with performance optimizations..."
gcloud run deploy gcp-guru-frontend \
    --image=${FRONTEND_IMAGE_URI} \
    --platform=managed \
    --region=${REGION} \
    --allow-unauthenticated \
    --min-instances=1 \
    --max-instances=10 \
    --cpu=2 \
    --memory=1Gi \
    --concurrency=100 \
    --timeout=300 \
    --set-env-vars="NEXT_PUBLIC_API_URL=${BACKEND_URL}"

# Get the frontend URL
export FRONTEND_URL=$(gcloud run services describe gcp-guru-frontend --platform managed --region=${REGION} --format 'value(status.url)')

echo "✅ Frontend deployed successfully at: ${FRONTEND_URL}"
echo ""

echo "🎉 Deployment complete!"
echo "📊 Performance optimizations applied:"
echo "   - Region: ${REGION} (Frankfurt - closest to Hamburg)"
echo "   - Min instances: 1 (eliminates cold starts)"
echo "   - CPU: 2 cores (faster processing)"
echo "   - Memory: 1Gi (ample resources)"
echo "   - High concurrency: 100 requests per instance"
echo ""
echo "🌐 Your application should now be much faster when accessed from Hamburg!"
echo "🔗 Frontend URL: ${FRONTEND_URL}"