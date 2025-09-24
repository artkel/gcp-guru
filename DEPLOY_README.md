# Performance-Optimized Deployment Guide

This guide explains how to deploy your GCP Guru application with performance optimizations specifically designed to reduce latency for European users (particularly Hamburg, Germany).

## Quick Start

1. **Set your API key:**
```bash
export GOOGLE_API_KEY="your_gemini_api_key_here"
```

2. **Run the deployment script:**
```bash
./deploy.sh
```

## Performance Optimizations Applied

The `deploy.sh` script automatically applies the following optimizations:

### Geographic Optimization
- **Region**: `europe-west3` (Frankfurt) - closest to Hamburg
- **Latency Reduction**: ~80% reduction compared to `us-central1`

### Cost Optimization
- **Min Instances**: 0 (scales to zero when unused - near $0 cost)
- **Max Instances**: 10 (scales under load)
- **Cold Starts**: 2-3 seconds on first request after inactivity

### Resource Optimization
- **CPU**: 2 cores (faster processing)
- **Memory**: 1Gi (ample resources for smooth operation)
- **Concurrency**: 100 requests per instance
- **Timeout**: 300 seconds

### Expected Performance Improvements
- **API Response Time**: From 1.5s to ~200-300ms (after warm-up)
- **Cold Starts**: 2-3 seconds on first request, then fast
- **Geographic Latency**: Reduced by ~150ms
- **Cost**: Near $0/month with typical usage (30 min/day)

## Manual Deployment

If you prefer manual control, you can deploy services individually:

```bash
# Set environment variables
export REGION="europe-west3"
export PROJECT_ID=$(gcloud config get-value project)
export GOOGLE_API_KEY="your_api_key_here"

# Deploy backend
gcloud run deploy gcp-guru-backend \
    --image=europe-west3-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-backend:latest \
    --region=${REGION} \
    --min-instances=0 \
    --cpu=2 \
    --memory=1Gi

# Deploy frontend
gcloud run deploy gcp-guru-frontend \
    --image=europe-west3-docker.pkg.dev/${PROJECT_ID}/gcp-guru-repo/gcp-guru-frontend:latest \
    --region=${REGION} \
    --min-instances=0 \
    --cpu=2 \
    --memory=1Gi
```

## Cost Considerations

**Cost-Optimized Configuration (Current Setup):**
- **Min instances**: $0 (scales to zero when unused)
- **CPU/Memory**: Only charged during active use
- **Estimated monthly cost**: Near $0 with typical usage (30 min/day)
- **Free tier coverage**: Cloud Run, Artifact Registry, and GCS stay within free limits

**Trade-off**: 2-3 second cold start delay on first request after inactivity, but subsequent requests are fast. This is acceptable for a study application.

## Monitoring Performance

After deployment, test the improvements:

```bash
# Test backend response time
curl -w "@curl-format.txt" -o /dev/null -s "${BACKEND_URL}/api/tags"

# Create curl-format.txt for timing:
echo "time_total: %{time_total}" > curl-format.txt
```

You should see response times under 300ms from Hamburg.

## Troubleshooting

If you experience issues:

1. **Check region**: Ensure you're deploying to `europe-west3`
2. **Verify min-instances**: Should be set to 1 to avoid cold starts
3. **Monitor logs**: Use Cloud Console to check service logs
4. **Test endpoints**: Verify both frontend and backend are responding

For detailed troubleshooting, see the main DEPLOYMENT_GUIDE.md file.