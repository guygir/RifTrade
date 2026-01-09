# Deployment Guide - Vercel

## Overview

This app is designed to deploy to **Vercel**, which is the recommended hosting for Next.js apps.

**What's in the guide:**
- ✅ Vercel is mentioned as the hosting solution
- ✅ It's in Phase 8 of the to-do list
- ✅ Free tier is sufficient
- ✅ Automatic HTTPS
- ✅ GitHub integration

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Fastest)

1. **Install Vercel CLI** (if you don't have it):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? **No** (for first deployment)
   - Project name: `riftbound-card-swap` (or your choice)
   - Directory: `./` (current directory)
   - Override settings? **No**

4. **Set Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   # Paste: https://xwjkuxwyfkxbfqwrwpbv.supabase.co
   
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # Paste: sb_publishable_CitxTYS4iWSsDcU_fbTdTQ_HjuCnQTr
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

6. **Your app will be live at**: `https://your-project-name.vercel.app`

### Option 2: Deploy via GitHub (Recommended for ongoing updates)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign in

3. **Import your GitHub repository**:
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

4. **Configure the project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://xwjkuxwyfkxbfqwrwpbv.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_CitxTYS4iWSsDcU_fbTdTQ_HjuCnQTr`
   - Make sure to select **Production**, **Preview**, and **Development** environments

6. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (1-2 minutes)
   - Your app will be live at: `https://your-project-name.vercel.app`

### Option 3: Deploy via Vercel Dashboard (No CLI)

1. **Go to [vercel.com](https://vercel.com)** and sign in

2. **Click "Add New" → "Project"**

3. **Import from Git** (if you have code on GitHub/GitLab/Bitbucket):
   - Select your repository
   - Configure and deploy

4. **Or Upload Project**:
   - Click "Browse" and select your project folder
   - Configure settings
   - Add environment variables (see above)
   - Deploy

## Post-Deployment Checklist

- [ ] Verify app is accessible at the Vercel URL
- [ ] Test sign up / login
- [ ] Test card browsing
- [ ] Test profile creation
- [ ] Test search functionality
- [ ] Check that all cards are displaying (should have 656 cards)

## Important Notes

### Environment Variables
- **DO NOT** commit `.env.local` to GitHub (it's already in `.gitignore`)
- Environment variables must be set in Vercel dashboard/CLI
- Use `NEXT_PUBLIC_*` prefix for variables needed in the browser

### Database
- Your Supabase database is already set up and seeded
- No additional configuration needed - the app will connect automatically

### Custom Domain (Optional)
- In Vercel dashboard → Project Settings → Domains
- Add your custom domain
- Follow DNS configuration instructions
- Vercel handles SSL certificates automatically

### Automatic Deployments
- If connected to GitHub, Vercel will automatically deploy when you push to main
- Preview deployments are created for pull requests

## Troubleshooting

**Build fails?**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check that environment variables are set correctly

**App works locally but not on Vercel?**
- Verify environment variables are set in Vercel dashboard
- Check that Supabase URL and keys are correct
- Look at browser console for errors

**Cards not showing?**
- Verify database is seeded (should have 656 cards)
- Check Supabase connection in browser network tab
- Verify RLS policies allow public reads

## Cost

**Vercel Free Tier includes:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ More than enough for this project

**You'll only pay if you:**
- Exceed the free tier limits (unlikely for this project)
- Upgrade to a paid plan for team features

## Next Steps After Deployment

1. **Share your app URL** with the community
2. **Monitor usage** in Vercel dashboard
3. **Set up analytics** (optional) - Vercel Analytics
4. **Consider custom domain** if you want a branded URL

---

**Status**: Ready to deploy! 🚀

