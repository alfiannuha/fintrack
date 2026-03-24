# 🚀 Railway Deployment - Easy Mode!

## Option 1: Using Nixpacks (Recommended - No Dockerfile Needed!)

Railway automatically detects Go projects and uses Nixpacks. Ini cara termudah:

### Steps:

1. **Go to [Railway.app](https://railway.app)**
2. **Login with GitHub**
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: `alfiannuha/fintrack`
5. **Railway will auto-detect** it's a Go project!

### Set Environment Variables:

In Railway Dashboard → **Variables** → Add these:

```bash
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/fintrack_prod?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-min-32-characters
DB_NAME=fintrack_prod
GIN_MODE=release
CORS_ORIGIN=https://fintrack-alfiannuha.vercel.app
PORT=8080
```

### That's it! Railway will:
- Auto-install Go
- Auto-run `go build`
- Auto-deploy your app

---

## Option 2: Using Dockerfile (If You Prefer)

If you want to use the Dockerfile:

1. In Railway Dashboard → **Settings** → **Build**
2. Select **Dockerfile** as Builder
3. Set Dockerfile Path to: `backend/Dockerfile`

Then set the same environment variables as above.

---

## Quick Test

After deployment, test your backend:

```bash
# Get your Railway URL from Dashboard
curl https://your-app.up.railway.app/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "time": "2025-01-24T..."
}
```

---

## Troubleshooting

### Build Failed: "go.mod not found"

**Fix**: Make sure you're deploying from the root of the repository, Railway will auto-detect the `backend/` folder.

### Port Error

**Fix**: Make sure `PORT=8080` is set in environment variables.

### MongoDB Connection Failed

**Fix**: 
1. Check MongoDB Atlas → Network Access → Allow 0.0.0.0/0
2. Verify connection string is correct

---

**That's all! Nixpacks makes deployment super easy!** 🎉
