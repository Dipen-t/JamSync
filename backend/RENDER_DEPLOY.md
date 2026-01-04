# Deploy JamSync Backend on Render

## Step-by-Step Guide

### 1. Prepare Your Repository
Make sure your backend code is pushed to GitHub/GitLab/Bitbucket.

### 2. Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up (free) with GitHub/GitLab/Bitbucket

### 3. Create New Web Service
1. Click **"New +"** button in dashboard
2. Select **"Web Service"**
3. Connect your repository (GitHub/GitLab/Bitbucket)
4. Select the repository containing your JamSync backend

### 4. Configure Service Settings

**Basic Settings:**
- **Name:** `jamsync-backend` (or any name you prefer)
- **Region:** Choose closest to your users
- **Branch:** `main` (or your default branch)
- **Root Directory:** `backend` (important!)
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Advanced Settings (Optional):**
- **Environment:** `Node`
- **Node Version:** `20` (or latest)

### 5. Environment Variables (Optional)
Click **"Environment"** tab and add:
- `NODE_ENV` = `production`
- `FRONTEND_URL` = `https://your-frontend-domain.com` (if you have one)

**Note:** `PORT` is automatically set by Render - don't set it manually!

### 6. Deploy
1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait 2-5 minutes for deployment to complete
4. Your backend will be live at: `https://jamsync-backend.onrender.com` (or your custom name)

### 7. Update Frontend
After deployment, update your frontend `client/src/socket.js`:

```javascript
export const SOCKET_URL = "https://jamsync-backend.onrender.com";
```

Or use the URL Render provides in your service dashboard.

---

## Using render.yaml (Alternative Method)

If you prefer using the `render.yaml` file:

1. In Render dashboard, go to **"Blueprints"**
2. Click **"New Blueprint"**
3. Connect your repository
4. Render will auto-detect `render.yaml` in the `backend` folder
5. Click **"Apply"** to deploy

---

## Important Notes

### Free Tier Limitations:
- **Spins down after 15 minutes of inactivity**
- First request after spin-down takes ~30 seconds (cold start)
- **Upgrade to paid plan** for always-on service

### Persistent Storage:
- Files uploaded to `public/uploads/` are **ephemeral** on free tier
- They will be lost on redeploy or service restart
- **Solution:** Use cloud storage (AWS S3, Cloudinary) for production

### WebSocket Support:
- Render **fully supports** Socket.io WebSocket connections
- No additional configuration needed

### Health Check:
- Test your deployment: `https://your-service.onrender.com/health`
- Should return: `{"status":"ok","timestamp":"...","songs":X,"rooms":Y}`

---

## Troubleshooting

### Build Fails:
- Check Root Directory is set to `backend`
- Verify `package.json` has `"start"` script
- Check build logs in Render dashboard

### Service Won't Start:
- Verify `PORT` is not set manually (Render auto-assigns)
- Check server.js uses `process.env.PORT || 4000`
- Review logs in Render dashboard

### Socket.io Not Working:
- Ensure CORS allows your frontend origin
- Check WebSocket connections are enabled (they are by default)
- Verify frontend `SOCKET_URL` matches Render service URL

### Files Disappear:
- This is expected on free tier (ephemeral storage)
- Implement cloud storage for persistent file storage

---

## Upgrading to Paid Plan (Optional)

For always-on service:
1. Go to service settings
2. Click **"Change Plan"**
3. Select **"Starter"** ($7/month) or higher
4. Service stays online 24/7

---

## Quick Checklist

- [ ] Repository pushed to GitHub/GitLab
- [ ] Render account created
- [ ] Web Service created with correct settings
- [ ] Root Directory set to `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Service deployed successfully
- [ ] Frontend `SOCKET_URL` updated
- [ ] Health check endpoint working
- [ ] Socket.io connections working

---

## Support

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
- Render Community: https://community.render.com

