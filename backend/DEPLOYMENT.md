# JamSync Backend Deployment Guide

## Quick Deploy Options

### 1. Railway (Recommended - Easiest)
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js and deploy
5. Set environment variable `PORT` (optional, Railway auto-assigns)
6. Your backend will be live at `https://your-app.railway.app`

**Pros:** Free tier, automatic HTTPS, easy setup, persistent storage

---

### 2. Render
1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add environment variable: `PORT=10000`
6. Deploy!

**Pros:** Free tier, automatic HTTPS, easy setup

---

### 3. Heroku
1. Install Heroku CLI: `npm install -g heroku`
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Deploy: `git push heroku main`
5. Set port (auto-handled by Heroku)

**Note:** Heroku free tier discontinued, requires paid plan

---

### 4. Vercel (Serverless)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty)
4. Add environment variables if needed
5. Deploy!

**Note:** May need adjustments for Socket.io long connections

---

### 5. DigitalOcean App Platform
1. Go to [digitalocean.com](https://digitalocean.com)
2. Create new App
3. Connect GitHub repository
4. Configure:
   - **Type:** Web Service
   - **Build Command:** `npm install`
   - **Run Command:** `npm start`
5. Deploy!

---

### 6. Self-Hosted (VPS)
1. Get a VPS (DigitalOcean, Linode, AWS EC2, etc.)
2. SSH into server
3. Install Node.js: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`
4. Clone repository: `git clone your-repo`
5. Install dependencies: `npm install`
6. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name jamsync-backend
   pm2 save
   pm2 startup
   ```
7. Set up Nginx reverse proxy (optional)
8. Configure firewall: `sudo ufw allow 4000`

---

## Environment Variables

Create a `.env` file (or set in deployment platform):

```env
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com  # Optional: restrict CORS
```

**Note:** If `FRONTEND_URL` is not set, CORS allows all origins (`*`). For production, set your frontend URL for security.

---

## Important Notes

1. **File Storage:** Uploaded files are stored in `public/uploads/`. For production:
   - Use cloud storage (AWS S3, Cloudinary) for persistent storage
   - Or use persistent volumes on your hosting platform

2. **CORS:** Update CORS origin in `server.js` to your frontend URL:
   ```javascript
   cors: { origin: "https://your-frontend-domain.com" }
   ```

3. **Socket.io:** Ensure your hosting platform supports WebSocket connections

4. **Port:** Most platforms auto-assign PORT via environment variable

---

## Post-Deployment

1. Update frontend `SOCKET_URL` in `client/src/socket.js`:
   ```javascript
   export const SOCKET_URL = "https://your-backend-domain.com";
   ```

2. Test the deployment:
   - Check health: `https://your-backend.com/songs`
   - Test socket connection
   - Test file upload

---

## Recommended: Railway or Render
Both offer free tiers, easy setup, and work great with Node.js/Socket.io apps.

