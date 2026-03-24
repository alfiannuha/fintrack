# Production Deployment Guide

## Prerequisites

1. **MongoDB Atlas** - Production cluster ready
2. **GitHub Account** - For Vercel & Railway integration
3. **Vercel Account** - Free tier available
4. **Railway Account** - $5 credit for new users

---

## Step 1: Push to GitHub

```bash
# Initialize git repository
cd /Users/alfiannuha/Documents/belajar/frontend/dompet-pwa/fintrack
git init

# Add all files
git add .

# Create .gitignore if not exists
# Make sure backend/.env and frontend/.env.local are NOT committed

# Commit
git commit -m "Initial commit - FinTrack PWA v1.0"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/fintrack.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

### Option A: Deploy via Railway Dashboard

1. **Go to [Railway.app](https://railway.app)**
2. **Login with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `fintrack` repository**
6. **Select `backend` as root directory** (or use railway.json)

### Set Environment Variables in Railway:

```
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/fintrack_prod
DB_NAME=fintrack_prod
JWT_SECRET=<generate-strong-secret-min-32-chars>
JWT_ACCESS_EXP=15
JWT_REFRESH_EXP=30
CORS_ORIGIN=https://your-domain.vercel.app
PORT=8080
GIN_MODE=release
```

**Generate JWT Secret:**
```bash
# Run this command to generate a random secret
openssl rand -base64 32
```

### Option B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Add environment variables
railway variables set MONGO_URI="your_mongo_uri"
railway variables set JWT_SECRET="your_secret"
railway variables set CORS_ORIGIN="https://your-domain.vercel.app"
railway variables set GIN_MODE="release"

# Deploy
railway up
```

### Get Backend URL:
- Go to Railway Dashboard → Your Project → Settings
- Copy the **Public Domain** (e.g., `fintrack-backend-production.up.railway.app`)

---

## Step 3: Deploy Frontend to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Go to [Vercel.com](https://vercel.com)**
2. **Login with GitHub**
3. **Click "Add New Project"**
4. **Import your `fintrack` repository**
5. **Configure Project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `cd frontend && pnpm install && pnpm run build`
   - **Output Directory:** `.next`

### Set Environment Variables in Vercel:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api/v1
NEXT_PUBLIC_VAPID_KEY=your-vapid-key (optional for push notifications)
```

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

### Get Frontend URL:
- Your app will be deployed to: `https://fintrack-YOUR_USERNAME.vercel.app`
- You can add a custom domain in Vercel Settings

---

## Step 4: Update CORS & API Configuration

### Update Backend CORS:

In Railway Dashboard, update `CORS_ORIGIN`:
```
CORS_ORIGIN=https://fintrack-your-username.vercel.app
```

### Update Frontend API URL:

In Vercel Dashboard, update `NEXT_PUBLIC_API_URL`:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api/v1
```

---

## Step 5: MongoDB Atlas Configuration

### 1. Whitelist All IPs (for Railway):

1. Go to **MongoDB Atlas Dashboard**
2. **Network Access** → **Add IP Address**
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
4. **Confirm**

### 2. Update Connection String:

Make sure your `MONGO_URI` includes:
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/fintrack_prod?retryWrites=true&w=majority
```

### 3. Database User:

Ensure your MongoDB user has:
- **Read & Write to any database** permission
- **Atlas Admin** role (optional)

---

## Step 6: Test Production Deployment

### 1. Test Backend Health:

```bash
curl https://your-backend-url.railway.app/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "time": "2025-01-24T10:00:00Z"
}
```

### 2. Test Frontend:

1. Open `https://your-domain.vercel.app`
2. Click "Daftar Baru"
3. Register a new account
4. Login with credentials
5. Create a transaction
6. Check dashboard shows data

### 3. Test Full Flow:

- ✅ Register → Auto-create wallet
- ✅ Login → JWT tokens work
- ✅ Create transaction → Saved to MongoDB
- ✅ Dashboard → Shows summary
- ✅ Budget → Progress tracking works
- ✅ Recurring → Rules created

---

## Step 7: Custom Domain (Optional)

### For Vercel:

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Domains**
2. Add your domain: `fintrack.yourdomain.com` or `yourdomain.com`
3. Update DNS records as instructed
4. SSL certificate auto-generated

### For Railway:

1. Go to **Railway Dashboard** → **Your Project** → **Settings** → **Domains**
2. Add custom domain
3. Update DNS CNAME record
4. SSL certificate auto-generated

---

## Step 8: Monitoring & Maintenance

### Backend Logs (Railway):

```bash
# View logs
railway logs

# Follow logs in real-time
railway logs --follow
```

### Frontend Logs (Vercel):

- Go to **Vercel Dashboard** → **Your Project** → **Deployments**
- Click on deployment → **View Logs**

### Database Monitoring (MongoDB Atlas):

- **Atlas Dashboard** → **Clusters** → **Metrics**
- Monitor: Connections, Operations, Memory usage

---

## Troubleshooting

### Issue 1: CORS Error

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Fix:**
- Update `CORS_ORIGIN` in Railway to match your Vercel domain exactly
- Include `https://` prefix
- Redeploy backend after change

### Issue 2: MongoDB Connection Failed

**Error:** `Failed to connect to MongoDB`

**Fix:**
- Check MongoDB Atlas Network Access (whitelist 0.0.0.0/0)
- Verify connection string is correct
- Ensure database user has correct permissions
- Check MongoDB cluster is running

### Issue 3: 500 Internal Server Error

**Fix:**
- Check Railway logs for error details
- Verify all environment variables are set
- Check database collections exist
- Ensure indexes are created

### Issue 4: Frontend Can't Connect to Backend

**Fix:**
- Verify `NEXT_PUBLIC_API_URL` is correct in Vercel
- Ensure backend is running (check Railway status)
- Test backend health endpoint directly
- Check for typos in API URL

---

## Production Checklist

- [ ] MongoDB Atlas cluster running
- [ ] MongoDB user created with read/write permissions
- [ ] Network Access: 0.0.0.0/0 whitelisted
- [ ] Backend deployed to Railway
- [ ] All backend environment variables set
- [ ] Frontend deployed to Vercel
- [ ] All frontend environment variables set
- [ ] CORS configured correctly
- [ ] Health endpoint responds
- [ ] Register/Login flow tested
- [ ] Transaction creation tested
- [ ] Dashboard data loads
- [ ] Budget features work
- [ ] Recurring transactions work
- [ ] Insights display correctly
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled (automatic)
- [ ] Monitoring setup

---

## Cost Estimation

### Free Tier (Development/Testing):

- **Vercel:** Free (unlimited deployments)
- **Railway:** $5 credit (enough for ~500 hours/month)
- **MongoDB Atlas:** Free M0 cluster (512MB)
- **Total:** ~$0-5/month

### Production Tier:

- **Vercel Pro:** $20/month (optional, for team features)
- **Railway:** $5-10/month (depending on usage)
- **MongoDB Atlas M2:** ~$25/month (2GB, dedicated)
- **Total:** ~$30-55/month

---

## Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use strong JWT secrets** (min 32 characters)
3. **Enable MongoDB IP whitelist** (don't use 0.0.0.0/0 in production if possible)
4. **Use HTTPS only** (automatic with Vercel/Railway)
5. **Rotate secrets regularly** (JWT, database passwords)
6. **Monitor logs** for suspicious activity
7. **Rate limit** authentication endpoints (can add middleware)
8. **Validate all inputs** (already implemented)

---

## Next Steps After Deployment

1. **Setup Google Analytics** (optional)
2. **Add error tracking** (Sentry, LogRocket)
3. **Configure push notifications** (VAPID keys)
4. **Setup automated backups** (MongoDB Atlas automatic)
5. **Add custom domain** for branding
6. **Submit to PWA directories** (optional)
7. **Marketing & user acquisition**

---

**Your FinTrack PWA is now live! 🚀**

Share your production URL with users and start tracking finances!
