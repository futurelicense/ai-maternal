# 🔍 NetworkError Troubleshooting Guide

## Quick Diagnostic Steps

Follow these steps **in order** to identify the issue:

### Step 1: Check Backend is Running ✅

Open a new browser tab and visit your backend health endpoint:
```
https://YOUR-BACKEND-URL.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-09T...",
  "environment": "production"
}
```

**If you get an error:**
- ❌ **"This site can't be reached"** → Backend not deployed
- ❌ **Takes 30+ seconds** → Backend is waking up (Render free tier sleeps)
- ❌ **404 Not Found** → Wrong URL or backend crashed
- ❌ **500 Error** → Check Render logs for errors

**Action if backend fails:**
- Go to Render dashboard → Check deployment status
- Click "Logs" to see errors
- Verify all environment variables are set

---

### Step 2: Check Vercel Environment Variable 🔧

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Look for** `VITE_API_URL`

**Expected Value:**
```
https://your-backend.onrender.com/api
```

**Common Mistakes:**
- ❌ Missing the `/api` at the end
- ❌ Has trailing slash: `/api/`
- ❌ Using `http://` instead of `https://`
- ❌ Still pointing to `http://localhost:5000/api`
- ❌ Variable not set at all

**Correct Format:**
```
https://ai-maternal-backend.onrender.com/api
              ↑                              ↑
         Your subdomain               Must end with /api
```

---

### Step 3: Verify Vercel Redeployment 🔄

**Environment variables only apply to NEW deployments!**

1. Go to **Deployments** tab
2. Check the **timestamp** of latest deployment
3. Was it **after** you added `VITE_API_URL`?

**If NO:**
- Click **⋯** (three dots) on latest deployment
- Click **"Redeploy"**
- Wait for deployment to complete
- Try logging in again

---

### Step 4: Check Browser Console 🐛

1. Open your Vercel site
2. Press **F12** or **Cmd+Option+I** (Mac)
3. Go to **Console** tab
4. Try to login
5. Look for the error message

**What to look for:**

#### Error Type A: `Failed to fetch`
```
NetworkError when attempting to fetch resource
```
**Means:** Frontend can't reach backend URL

**Check:**
- Is `VITE_API_URL` set in Vercel?
- Is backend URL correct?
- Is backend running? (Test Step 1)

#### Error Type B: CORS Error
```
Access to fetch at 'https://backend...' from origin 'https://vercel-app...'
has been blocked by CORS policy
```
**Means:** Backend CORS not configured for your Vercel domain

**Fix:**
- Go to Render → Environment Variables
- Update `CORS_ORIGIN` to your Vercel URL
- Redeploy backend

#### Error Type C: `404 Not Found`
```
POST https://backend.../api/auth/login 404 (Not Found)
```
**Means:** Backend route doesn't exist or wrong URL

**Fix:**
- Check backend is actually running
- Verify backend routes in logs
- Ensure URL ends with `/api` not `/api/`

---

### Step 5: Check Network Tab 🌐

In browser DevTools:
1. Go to **Network** tab
2. Try to login
3. Find the **login** request

**Click on it and check:**

**Request URL:** Should be:
```
https://your-backend.onrender.com/api/auth/login
```

**If it shows:**
- `http://localhost:5000/api/auth/login` → Vercel env var not set
- Wrong domain → Check `VITE_API_URL`
- `undefined` or `null` → Environment variable missing

**Status Code:**
- `0` or `(failed)` → Can't reach backend
- `404` → Wrong URL or backend route missing
- `500` → Backend error (check Render logs)
- `CORS error` → CORS not configured

---

## 🎯 Most Common Issues & Fixes

### Issue #1: Vercel Still Using Localhost ❌
**Symptom:** Network tab shows `localhost:5000`

**Fix:**
```bash
# Vercel Dashboard → Settings → Environment Variables
# Add or update:
VITE_API_URL=https://your-backend.onrender.com/api

# Then redeploy!
```

### Issue #2: Backend Not Running ❌
**Symptom:** Can't access `/health` endpoint

**Fix:**
1. Go to Render dashboard
2. Check if service shows "Deploy failed" or "Suspended"
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. Check logs for errors

### Issue #3: CORS Error ❌
**Symptom:** Console shows CORS policy error

**Fix:**
```bash
# Render Dashboard → Environment Variables
# Set:
CORS_ORIGIN=https://your-vercel-app.vercel.app

# Important: No trailing slash!
# Redeploy backend after changing
```

### Issue #4: Environment Variable Not Applied ❌
**Symptom:** Variable is set but still doesn't work

**Fix:**
- Variables only apply to NEW deployments
- Must redeploy both frontend AND backend after changes
- Clear browser cache
- Try in incognito/private window

---

## 🛠️ Debug Commands

### Test Backend from Terminal:
```bash
# Test health endpoint
curl https://your-backend.onrender.com/health

# Test login endpoint
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@healthai.com","password":"password123"}'
```

### Check What Vercel Is Using:
```javascript
// In browser console on your Vercel site:
console.log(import.meta.env.VITE_API_URL)

// Should show your backend URL, NOT localhost
```

---

## 📋 Complete Checklist

Go through this checklist **one by one**:

- [ ] Backend deployed on Render successfully
- [ ] Backend health endpoint returns `{"status":"ok"}`
- [ ] Backend environment variables all set (check Render dashboard)
- [ ] `CORS_ORIGIN` in Render = your Vercel URL (no trailing slash)
- [ ] `VITE_API_URL` in Vercel = your Render URL + `/api`
- [ ] Vercel redeployed AFTER adding `VITE_API_URL`
- [ ] Browser console checked for error details
- [ ] Network tab shows correct backend URL (not localhost)
- [ ] Tried in incognito/private window (clears cache)

---

## 🆘 Still Not Working?

**Please provide:**

1. **Your Vercel URL:** `https://...`
2. **Your Render backend URL:** `https://...`
3. **Backend health check result:** (Visit `/health` endpoint)
4. **Browser console error:** (Full error message)
5. **Network tab request URL:** (What URL is it trying to call?)

**Screenshots needed:**
- Vercel environment variables page
- Render environment variables page
- Browser console error
- Browser network tab showing the failed request

---

## 💡 Quick Test

**Run this in your browser console on the Vercel site:**

```javascript
// This will tell you if environment variable is set
console.log('API URL:', import.meta.env.VITE_API_URL);

// Try to fetch health endpoint
fetch(import.meta.env.VITE_API_URL.replace('/api', '/health'))
  .then(r => r.json())
  .then(data => console.log('Backend Health:', data))
  .catch(err => console.error('Backend Error:', err));
```

**Expected output:**
```javascript
API URL: https://your-backend.onrender.com/api
Backend Health: { status: "ok", timestamp: "...", environment: "production" }
```

**If you see:**
- `API URL: undefined` → Environment variable not set
- `API URL: http://localhost:5000/api` → Not redeployed after setting
- `Backend Error: Failed to fetch` → Backend not running or wrong URL
- `CORS error` → Update `CORS_ORIGIN` on backend

---

## 🔧 Emergency Reset

If nothing works, start fresh:

1. **Delete Render service** and create new one
2. **Delete Vercel deployment** and redeploy
3. **Clear all browser data** for both sites
4. Follow setup guide again from scratch

This forces everything to rebuild with correct settings.

