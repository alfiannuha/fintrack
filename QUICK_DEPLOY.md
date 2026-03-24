# 🚀 Quick Deploy - FinTrack PWA

## Deploy in 5 Minutes!

### Option 1: Automated (Recommended)

```bash
# Run the deploy script
./deploy.sh
```

Follow the prompts and it will guide you through everything!

---

### Option 2: Manual Step-by-Step

#### **Step 1: Push to GitHub** (1 min)

```bash
git init
git add .
git commit -m "Deploy FinTrack PWA"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/fintrack.git
git push -u origin main
```

#### **Step 2: Deploy Backend to Railway** (2 min)

1. Go to **[Railway.app](https://railway.app)** → Login with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select your `fintrack` repository
4. **Variables** tab → Add these:

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/fintrack?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-min-32-chars-use-openssl-rand-base64-32
DB_NAME=fintrack_prod
GIN_MODE=release
CORS_ORIGIN=https://your-app.vercel.app  # Will set after Vercel deploy
```

5. Railway will auto-deploy. Copy the **Public Domain** (e.g., `fintrack-production.up.railway.app`)

#### **Step 3: Deploy Frontend to Vercel** (2 min)

1. Go to **[Vercel.com](https://vercel.com)** → Login with GitHub
2. **Add New Project** → Import `fintrack` repository
3. **Configure:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Environment Variables:**
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api/v1
     ```

4. Click **Deploy**
5. Copy your domain (e.g., `fintrack.vercel.app`)

#### **Step 4: Update Backend CORS** (30 sec)

Back in **Railway Dashboard**:
- Update `CORS_ORIGIN` to your Vercel URL
- Redeploy (automatic)

---

## ✅ Test Your Deployment

1. **Open your Vercel URL**
2. **Register** a new account
3. **Create a transaction**
4. **Check dashboard** shows data

If everything works → **Congratulations! Your app is live!** 🎉

---

## 📋 Environment Variables Reference

### Backend (Railway)

| Variable | Example | Required |
|----------|---------|----------|
| `MONGO_URI` | `mongodb+srv://...` | ✅ |
| `JWT_SECRET` | `random-32-chars` | ✅ |
| `DB_NAME` | `fintrack_prod` | ✅ |
| `GIN_MODE` | `release` | ✅ |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | ✅ |
| `PORT` | `8080` | Auto |

### Frontend (Vercel)

| Variable | Example | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | `https://backend.railway.app/api/v1` | ✅ |
| `NEXT_PUBLIC_VAPID_KEY` | (optional) | ❌ |

---

## 🔧 Common Issues & Quick Fixes

### CORS Error

**Problem:** Frontend can't connect to backend

**Fix:**
```bash
# In Railway Dashboard, make sure CORS_ORIGIN is exactly:
https://your-app.vercel.app

# NOT:
https://your-app.vercel.app/  (no trailing slash)
http://your-app.vercel.app    (must be https)
```

### MongoDB Connection Failed

**Problem:** Backend can't connect to MongoDB

**Fix:**
1. Go to **MongoDB Atlas** → **Network Access**
2. Add IP Address → **Allow Access from Anywhere** (0.0.0.0/0)
3. Update `MONGO_URI` with correct credentials

### Build Failed on Vercel

**Problem:** Frontend build fails

**Fix:**
- Make sure Root Directory is set to `frontend`
- Check build logs for specific error
- Run `pnpm build` locally to test

---

## 📊 Cost Breakdown

### Free Tier (Testing)
- **Vercel:** Free
- **Railway:** $5 credit (~500 hours/month)
- **MongoDB Atlas:** Free 512MB
- **Total:** ~$0-5/month

### Production
- **Vercel Pro:** $20/month (optional)
- **Railway:** $5-10/month
- **MongoDB Atlas M2:** $25/month
- **Total:** ~$30-55/month

---

## 🎯 Post-Deployment Checklist

- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] Registration works
- [ ] Login works
- [ ] Can create transaction
- [ ] Dashboard shows data
- [ ] Budget features work
- [ ] Recurring transactions work
- [ ] Insights display correctly
- [ ] Mobile responsive (test on phone)
- [ ] PWA installable (add to homescreen)
- [ ] Custom domain configured (optional)

---

## 📱 Add to Homescreen (PWA Test)

### Android (Chrome):
1. Open your Vercel URL
2. Menu (⋮) → **Install App**
3. Confirm → App added to homescreen

### iOS (Safari):
1. Open your Vercel URL
2. Share → **Add to Home Screen**
3. Confirm → App added to homescreen

---

## 🆘 Need Help?

### Logs

**Railway (Backend):**
```bash
railway logs
```

**Vercel (Frontend):**
- Dashboard → Deployments → View Logs

**MongoDB:**
- Atlas Dashboard → Clusters → Metrics

### Support

- Check `DEPLOYMENT_GUIDE.md` for detailed troubleshooting
- Review `PHASE3_COMPLETE.md` for feature documentation
- Check `README.md` for local development setup

---

## 🎉 Success!

Your FinTrack PWA is now live and ready for users!

**Share your URL:** `https://your-app.vercel.app`

**Next Steps:**
1. Add custom domain (optional)
2. Setup Google Analytics (optional)
3. Add error tracking like Sentry (optional)
4. Marketing & user acquisition

---

**Happy Deploying! 🚀**
