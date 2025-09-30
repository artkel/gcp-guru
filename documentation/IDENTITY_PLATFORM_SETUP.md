# Adding Google Sign-In with Identity Platform

This guide walks through adding authentication to protect your single-user app.

## Part 1: Enable Identity Platform in GCP Console

### 1. Enable Identity Platform API

```bash
gcloud services enable identitytoolkit.googleapis.com --project=gcp-guru-473011
```

### 2. Configure Identity Platform in Console

1. Go to: https://console.cloud.google.com/customer-identity
2. Click **"Go to Identity Platform"**
3. Click **"Enable"** if prompted

### 3. Add Google as Sign-In Provider

1. In Identity Platform, go to **"Providers"** tab
2. Click **"Add a provider"**
3. Select **"Google"**
4. Click **"Enable"**
5. Leave default settings (uses your project's OAuth client)
6. Click **"Save"**

### 4. Get Your Identity Platform Config

After enabling, you'll need these values for your frontend:

1. Go to **"Application setup details"** in Identity Platform
2. Copy these values:
   - **API Key**: `AIza...` (for frontend)
   - **Auth Domain**: `gcp-guru-473011.firebaseapp.com`
   - **Project ID**: `gcp-guru-473011`

---

## Part 2: Frontend Implementation (Next.js)

The frontend will be updated to:
- Show a sign-in page if not authenticated
- Store the ID token in localStorage
- Include the token in all API requests
- Show user info and sign-out button

---

## Part 3: Backend Implementation (FastAPI)

The backend will:
- Verify the ID token on each request
- Extract the user's email from the token
- Check if email is in the whitelist
- Return 401 if not authenticated or not whitelisted

---

## Part 4: Whitelist Your Email

Add your email to the backend's allowed users list:

```python
# In backend, create a simple whitelist
ALLOWED_USERS = [
    "artkel@gmail.com",  # Your email
]
```

---

## Testing

1. Visit the app URL
2. You'll see Google Sign-In button
3. Sign in with your Google account (artkel@gmail.com)
4. App loads normally with all your data
5. Anyone else who signs in gets "Access Denied" message

---

## Cost

- **Identity Platform**: Free tier covers 50,000 MAU
- **Your usage**: 1 user = $0/month