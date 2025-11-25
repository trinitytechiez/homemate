# Quick Deployment Checklist

## GitHub Upload (5 minutes)

- [ ] `git init` (if not already done)
- [ ] `git add .`
- [ ] `git commit -m "Initial commit"`
- [ ] Create repository on GitHub.com
- [ ] `git remote add origin https://github.com/YOUR_USERNAME/homemate.git`
- [ ] `git push -u origin main`

## Vercel Frontend Deployment (10 minutes)

- [ ] Sign up/login at vercel.com
- [ ] Import GitHub repository
- [ ] Set **Root Directory** to `frontend`
- [ ] Framework: **Vite** (auto-detected)
- [ ] Add environment variable: `VITE_API_URL` (set after backend deploy)
- [ ] Click **Deploy**

## Vercel Backend Deployment (10 minutes)

- [ ] Create new Vercel project
- [ ] Set **Root Directory** to `backend`
- [ ] Add environment variables:
  - `MONGODB_URI` (your MongoDB connection string)
  - `JWT_SECRET` (any random secret string)
  - `PORT=5000`
  - `NODE_ENV=production`
- [ ] Click **Deploy**

## Final Steps (5 minutes)

- [ ] Update frontend `VITE_API_URL` with backend URL
- [ ] Redeploy frontend
- [ ] Update MongoDB Atlas Network Access (allow all IPs: `0.0.0.0/0`)
- [ ] Test the deployed app

**Total Time: ~30 minutes**

