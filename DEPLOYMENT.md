# Deployment Guide: GitHub & Vercel

This guide will walk you through uploading your HomeMate project to GitHub and deploying it on Vercel.

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Git installed on your machine
- Node.js installed

---

## Part 1: Upload to GitHub

### Step 1: Initialize Git Repository (if not already done)

```bash
cd /Users/varunmukherjee/Public/work/homemate
git init
```

### Step 2: Check Current Git Status

```bash
git status
```

### Step 3: Add All Files to Git

```bash
git add .
```

### Step 4: Create Initial Commit

```bash
git commit -m "Initial commit: HomeMate PWA application"
```

### Step 5: Create a New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `homemate` (or your preferred name)
3. Description: "HomeMate - Staff Management PWA"
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### Step 6: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/homemate.git

# Verify remote was added
git remote -v
```

### Step 7: Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

### Step 8: Verify Upload

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/homemate`
2. Verify all files are uploaded correctly

---

## Part 2: Deploy on Vercel

### Step 1: Sign Up / Login to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub (recommended) or email
3. Complete the verification process

### Step 2: Import Your GitHub Repository

1. Click **Add New...** → **Project**
2. Click **Import Git Repository**
3. Find and select your `homemate` repository
4. Click **Import**

### Step 3: Configure Project Settings

Vercel will auto-detect your project structure. Configure as follows:

#### Root Directory
- Set to: `frontend` (since Vercel will deploy the frontend)

#### Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install`

**Note**: If you get import resolution errors, ensure all imports in `App.jsx` have explicit `.jsx` extensions (already fixed in the codebase).

#### Environment Variables
Click **Environment Variables** and add:

```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

(We'll set this after backend deployment)

### Step 4: Deploy Frontend

1. Click **Deploy**
2. Wait for build to complete (2-3 minutes)
3. Vercel will provide a deployment URL like: `homemate.vercel.app`

### Step 5: Deploy Backend (Separate Project)

Since Vercel supports full-stack deployments, you can deploy the backend too:

#### Option A: Deploy Backend as Separate Vercel Project

1. Create a new Vercel project
2. **Root Directory**: `backend`
3. **Build Command**: Leave empty or `npm install`
4. **Output Directory**: Leave empty
5. **Install Command**: `npm install`

#### Environment Variables for Backend:
```
MONGODB_URI=mongodb+srv://homemate_user:nhhqag73t6xnw3dQ@homemate-cluster.adeclup.mongodb.net/?appName=homemate-cluster
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=production
```

#### Option B: Use Vercel Serverless Functions

Create `api` folder in frontend and move backend routes there (more complex setup).

### Step 6: Update Frontend Environment Variables

After backend is deployed:

1. Go to Frontend project settings → Environment Variables
2. Update `VITE_API_URL` to your backend URL:
   ```
   VITE_API_URL=https://your-backend-project.vercel.app/api
   ```
3. Redeploy frontend

---

## Part 3: Post-Deployment Configuration

### Step 1: Update CORS Settings

In your backend code (`backend/server.js`), ensure CORS allows your Vercel frontend domain:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://homemate.vercel.app',
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true
}
```

### Step 2: Update MongoDB Atlas Network Access

1. Go to MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0` (allows all IPs) OR add Vercel's IP ranges
3. Save changes

### Step 3: Test Deployment

1. Visit your frontend URL: `https://homemate.vercel.app`
2. Test login, registration, and other features
3. Check browser console for any errors

---

## Part 4: Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

1. Make changes locally
2. Commit changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. Vercel will automatically build and deploy

### Preview Deployments

- Every pull request gets a preview deployment URL
- Perfect for testing before merging

---

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Check Node.js version compatibility

### API Calls Fail

1. Verify `VITE_API_URL` environment variable is set
2. Check CORS settings in backend
3. Verify backend is deployed and accessible

### MongoDB Connection Issues

1. Check MongoDB Atlas network access settings
2. Verify connection string in environment variables
3. Check MongoDB Atlas logs

### Environment Variables Not Working

1. Ensure variables are prefixed with `VITE_` for frontend
2. Redeploy after adding/changing variables
3. Check variable names match exactly

---

## Quick Reference Commands

### Git Commands
```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

### Vercel CLI (Optional)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## Project Structure for Vercel

```
homemate/
├── frontend/          # Deploy this as main project
│   ├── package.json
│   ├── vite.config.js
│   └── src/
├── backend/           # Deploy separately or use serverless functions
│   ├── package.json
│   └── server.js
└── package.json       # Root package.json (for monorepo)
```

---

## Notes

- **Frontend**: Deploy from `frontend/` directory
- **Backend**: Deploy separately or use Vercel serverless functions
- **Environment Variables**: Must be set in Vercel dashboard
- **MongoDB**: Ensure network access allows Vercel IPs
- **CORS**: Update backend CORS to allow Vercel domain

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure MongoDB connection is working

