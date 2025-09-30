#!/bin/bash
# Grant frontend service account permission to invoke the backend
# Run this AFTER the first deployment with authentication enabled

set -e

REGION="europe-west3"
PROJECT_ID=$(gcloud config get-value project)

echo "Granting frontend service account permission to invoke backend..."

# Get the frontend service account
FRONTEND_SA=$(gcloud run services describe gcp-guru-frontend --region=${REGION} --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null)

if [ -z "$FRONTEND_SA" ]; then
  echo "Error: Could not find frontend service account."
  echo "Make sure the frontend service is deployed first."
  exit 1
fi

echo "Frontend service account: ${FRONTEND_SA}"

# Grant invoker permission
gcloud run services add-iam-policy-binding gcp-guru-backend \
  --region=${REGION} \
  --member="serviceAccount:${FRONTEND_SA}" \
  --role="roles/run.invoker"

echo ""
echo "✓ Success! Frontend can now authenticate to backend."
echo ""
echo "You can verify by checking the backend service permissions:"
echo "gcloud run services get-iam-policy gcp-guru-backend --region=${REGION}"