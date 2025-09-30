# Securing Backend with Service-to-Service Authentication

This guide explains how to secure the backend Cloud Run service so it's only accessible by the frontend, not the public internet.

## Architecture

- **Frontend** (Cloud Run) → Authenticates using its service account
- **Backend** (Cloud Run) → Requires authentication, only accepts requests from frontend SA

## Implementation Steps

### Step 1: Remove Public Access from Backend

Update the backend deployment in `cloudbuild.yaml` to remove `--allow-unauthenticated`:

```yaml
# In cloudbuild.yaml, update the backend deployment step:
gcloud run deploy gcp-guru-backend \
  --image=europe-west3-docker.pkg.dev/$PROJECT_ID/gcp-guru-repo/gcp-guru-backend:$SHORT_SHA \
  --region=europe-west3 \
  --platform=managed \
  --no-allow-unauthenticated \  # Changed from --allow-unauthenticated
  --set-env-vars=GCS_BUCKET_NAME=gcp-guru-data-bucket-$PROJECT_ID,GCP_PROJECT_ID=$PROJECT_ID,GCP_FIRESTORE_DATABASE=\(default\),FORCE_REDEPLOY=$SHORT_SHA \
  --format='value(status.url)' > /workspace/backend_url.txt
```

### Step 2: Grant Frontend Service Account Invoker Role

Allow the frontend's service account to invoke the backend:

```bash
# Set variables
export REGION="europe-west3"
export PROJECT_ID=$(gcloud config get-value project)

# Get the frontend service account
FRONTEND_SA=$(gcloud run services describe gcp-guru-frontend --region=${REGION} --format='value(spec.template.spec.serviceAccountName)')

# Grant invoker permission
gcloud run services add-iam-policy-binding gcp-guru-backend \
  --region=${REGION} \
  --member="serviceAccount:${FRONTEND_SA}" \
  --role="roles/run.invoker"
```

### Step 3: Update Frontend to Include Auth Tokens

The Next.js frontend needs to fetch an identity token and include it in API requests.

**Update `frontend/src/lib/api.ts`** (or wherever you make API calls):

```typescript
// frontend/src/lib/api.ts

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetch an identity token for authenticating to Cloud Run backend.
 * This runs server-side on Cloud Run and uses the service account automatically.
 */
async function getAuthToken(): Promise<string | null> {
  // Only get auth token when running in Cloud Run (server-side)
  if (typeof window === 'undefined' && process.env.K_SERVICE) {
    try {
      const metadataServerUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=';
      const audience = BACKEND_URL;

      const response = await fetch(metadataServerUrl + audience, {
        headers: {
          'Metadata-Flavor': 'Google',
        },
      });

      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.error('Failed to fetch auth token:', error);
    }
  }
  return null;
}

/**
 * Make an authenticated API request to the backend.
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BACKEND_URL}${endpoint}`;

  // Get auth token (only works server-side on Cloud Run)
  const token = await getAuthToken();

  // Add authorization header if we have a token
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
```

**Update API route handlers** to use `authenticatedFetch`:

```typescript
// Example: frontend/src/app/api/questions/route.ts
import { authenticatedFetch } from '@/lib/api';

export async function GET(request: Request) {
  const response = await authenticatedFetch('/api/questions');
  const data = await response.json();
  return Response.json(data);
}
```

### Step 4: Update cloudbuild.yaml

Modify `cloudbuild.yaml` to deploy backend without public access:

```yaml
# Find the "Deploy Backend" step and change:
--allow-unauthenticated
# To:
--no-allow-unauthenticated
```

### Step 5: Deploy Changes

```bash
git add .
git commit -m "feat(security): add service-to-service authentication"
git push origin main
```

After deployment, grant the frontend invoker permission (Step 2 above).

---

## Testing

After implementation:

1. **Test backend directly (should fail):**
   ```bash
   curl https://gcp-guru-backend-[hash].run.app/api/questions
   # Expected: 403 Forbidden
   ```

2. **Test through frontend (should work):**
   - Open your frontend URL
   - Navigate the app normally
   - All features should work as before

---

## Troubleshooting

**"403 Forbidden" errors in frontend:**
- Verify frontend SA has `run.invoker` role on backend
- Check that `authenticatedFetch` is being used for all backend calls
- Verify the metadata server is accessible (only works on Cloud Run)

**"401 Unauthorized" errors:**
- Token might be expired or invalid
- Check that the audience matches the backend URL exactly

**Still works without authentication:**
- Verify backend was deployed with `--no-allow-unauthenticated`
- Check Cloud Run console → backend service → Security tab

---

## Security Benefits

✅ **Backend completely inaccessible to public**
✅ **No additional infrastructure costs**
✅ **Automatic token rotation via service accounts**
✅ **Audit trail of all requests in Cloud Logging**
✅ **Protection against API abuse and scraping**

---

## Alternative: Rate Limiting (If keeping public)

If you prefer to keep the backend public but add protection, consider:

1. **Cloud Armor** - DDoS protection and rate limiting (requires Load Balancer)
2. **API Gateway** - Rate limiting, quotas, API key management
3. **Firebase App Check** - Verify requests come from your app

These add complexity and cost, so service-to-service auth is preferred.