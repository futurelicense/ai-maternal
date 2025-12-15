# 🚀 Vercel Deployment Guide

## The Problem
You deployed the frontend to Vercel, but the backend is still running locally. This causes a **NetworkError** because:
- Frontend tries to connect to `http://localhost:5000/api`
- Localhost doesn't exist in production
- You need a deployed backend URL

## 📋 Solution Overview

1. **Deploy Backend** (to Render/Railway)
2. **Configure Vercel** with backend URL
3. **Update Backend CORS** to allow Vercel domain

---

## 🔧 Step 1: Deploy Backend to Render

### 1.1 Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 1.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `futurelicense/ai-maternal`
3. Configure:
   - **Name**: `ai-maternal-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 1.3 Set Environment Variables on Render
Add these in the "Environment" section:

```
NODE_ENV=production
PORT=10000
HUGGINGFACE_API_KEY=your_actual_huggingface_key_here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=https://your-vercel-app.vercel.app
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
LOAD_DEMO_DATA=false
```

**Important**: 
- Get your Hugging Face key from: https://huggingface.co/settings/tokens
- Replace `your-vercel-app.vercel.app` with your actual Vercel domain

### 1.4 Deploy
- Click **"Create Web Service"**
- Wait for deployment (5-10 minutes)
- Copy your backend URL: `https://ai-maternal-backend.onrender.com`

---

## 🌐 Step 2: Configure Vercel

### 2.1 Set Environment Variable
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://ai-maternal-backend.onrender.com/api`
   - **Environment**: All (Production, Preview, Development)

### 2.2 Redeploy
- Go to **Deployments** tab
- Click **⋯** (three dots) on latest deployment
- Click **Redeploy**

---

## 🔒 Step 3: Update Backend CORS

Your backend `.env` on Render should have:
```env
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

If you want to allow multiple domains:
```env
CORS_ORIGIN=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

---

## 📝 Alternative: Use Railway

### Railway Deployment (Free Alternative)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select `futurelicense/ai-maternal`
5. Configure:
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add same environment variables as above
7. Copy the Railway URL: `https://ai-maternal-backend.up.railway.app`
8. Update Vercel's `VITE_API_URL` to Railway URL

---

## 🧪 Testing

### 1. Test Backend
```bash
curl https://your-backend-url.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-09T...",
  "environment": "production"
}
```

### 2. Test Login
Try logging in on your Vercel site:
- Email: `demo@healthai.com`
- Password: `password123`

---

## 🐛 Troubleshooting

### Network Error Persists
1. **Check environment variable**:
   - Vercel → Settings → Environment Variables
   - Ensure `VITE_API_URL` is set correctly
   - Must end with `/api` (e.g., `https://backend.com/api`)

2. **Check backend is running**:
   - Visit `https://your-backend-url/health`
   - Should see status: "ok"

3. **Check CORS configuration**:
   - Backend `.env` must have correct Vercel URL
   - No trailing slash in `CORS_ORIGIN`

### Backend Crashes on Render
- Check logs in Render dashboard
- Common issues:
  - Missing environment variables
  - Invalid Hugging Face API key
  - Build errors

### TypeScript Build Error: "Cannot find type definition file for 'node'"
- **Fixed in latest commit!** Pull latest changes
- This happens when TypeScript dependencies are in devDependencies
- Solution: TypeScript and @types packages are now in dependencies
- If still having issues, clear build cache and redeploy

### CSV Upload Fails
- Ensure backend has write permissions for `./uploads`
- Check `MAX_FILE_SIZE` setting
- Render free tier has disk limitations

---

## 📊 Architecture After Deployment

```
┌─────────────────┐
│  Vercel         │ ← Frontend (React)
│  your-app.vercel│   VITE_API_URL points to ↓
└─────────────────┘
         ↓ HTTPS
┌─────────────────┐
│  Render/Railway │ ← Backend (Node.js)
│  backend.render │   Stores data in JSON files
└─────────────────┘
```

---

## 🎯 Quick Setup Checklist

- [ ] Deploy backend to Render/Railway
- [ ] Set environment variables on backend
- [ ] Copy backend URL
- [ ] Add `VITE_API_URL` to Vercel
- [ ] Redeploy Vercel
- [ ] Update backend `CORS_ORIGIN`
- [ ] Test login on Vercel site
- [ ] Upload CSV data

---

## 💡 Pro Tips

1. **Free Tiers**:
   - Render: 750 hours/month (sleeps after 15 min inactivity)
   - Railway: $5 free credit/month
   - Vercel: Unlimited for hobby projects

2. **Wake Up Time**:
   - Render free tier sleeps when inactive
   - First request may take 30-60 seconds to wake up
   - Consider upgrading for production use

3. **Data Persistence**:
   - JSON files persist on Render as long as the service runs
   - Consider backing up `backend/data/` directory regularly

4. **Custom Domain**:
   - Add custom domain in Vercel settings
   - Update backend `CORS_ORIGIN` with new domain

---

## 🆘 Still Having Issues?

1. Check browser console (F12) for exact error
2. Check backend logs on Render dashboard
3. Verify all environment variables are set
4. Test backend health endpoint directly
5. Ensure no trailing slashes in URLs

**Common Error Messages**:
- `NetworkError`: Backend not reachable → Check `VITE_API_URL`
- `CORS Error`: Wrong CORS_ORIGIN → Update backend env
- `401 Unauthorized`: Token issue → Clear browser localStorage
- `Connection Refused`: Backend not running → Check Render deployment

---

## 📚 Resources

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Repository: https://github.com/futurelicense/ai-maternal

