# 🚀 Quick Deploy to Render - 5 Minutes

## Prerequisites
- ✅ Code pushed to GitHub/GitLab/Bitbucket
- ✅ Render account (sign up at render.com)

## Steps

### 1. Go to Render Dashboard
Visit [render.com](https://render.com) and login

### 2. Create Web Service
- Click **"New +"** → **"Web Service"**
- Connect your repository
- Select your JamSync repository

### 3. Configure (IMPORTANT!)
```
Name: jamsync-backend
Root Directory: backend          ← CRITICAL!
Environment: Node
Build Command: npm install
Start Command: npm start
```

### 4. Deploy
- Click **"Create Web Service"**
- Wait 2-5 minutes
- ✅ Done! Your URL: `https://jamsync-backend.onrender.com`

### 5. Update Frontend
Edit `client/src/socket.js`:
```javascript
export const SOCKET_URL = "https://jamsync-backend.onrender.com";
```

---

## ⚠️ Important Notes

1. **Root Directory MUST be `backend`** - This tells Render where your backend code is
2. **Don't set PORT** - Render auto-assigns it
3. **Free tier spins down** after 15 min inactivity (first request takes ~30s)
4. **Files are ephemeral** - Uploaded files disappear on restart (use cloud storage for production)

---

## ✅ Test Your Deployment

1. Health check: `https://your-service.onrender.com/health`
2. Should return: `{"status":"ok",...}`

---

## 📖 Full Guide
See `RENDER_DEPLOY.md` for detailed instructions and troubleshooting.

