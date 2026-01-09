# Deployment Steps for RifTrade

## Step 1: Initialize Git Repository

Run these commands in your terminal:

```bash
cd /Users/guygirmonsky/Rift
git init
git add .
git commit -m "Initial commit: RifTrade - Riftbound card swap directory"
```

## Step 2: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: **`RifTrade`**
4. Description: `A lightweight, non-commercial community card swap directory for the Riftbound TCG`
5. Choose **Public** or **Private** (your choice)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

## Step 3: Push to GitHub

After creating the repository, GitHub will show you commands. Run these:

```bash
git remote add origin https://github.com/guygir/RifTrade.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub to sign in for easier integration)

2. Click **"Add New"** → **"Project"**

3. **Import your GitHub repository**:
   - You should see "RifTrade" in the list
   - Click **"Import"** next to it

4. **Configure the project**:
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

5. **Add Environment Variables**:
   - Click **"Environment Variables"** section
   - Add these two variables:
     
     **Variable 1:**
     - Name: `NEXT_PUBLIC_SUPABASE_URL`
     - Value: `https://xwjkuxwyfkxbfqwrwpbv.supabase.co`
     - Environments: ✅ Production, ✅ Preview, ✅ Development
     
     **Variable 2:**
     - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Value: `sb_publishable_CitxTYS4iWSsDcU_fbTdTQ_HjuCnQTr`
     - Environments: ✅ Production, ✅ Preview, ✅ Development

6. **Deploy**:
   - Click **"Deploy"** button
   - Wait 1-2 minutes for the build to complete
   - Your app will be live at: `https://riftrade.vercel.app` (or similar)

## Step 5: Verify Deployment

After deployment, test:
- [ ] App loads at the Vercel URL
- [ ] Can sign up / login
- [ ] Can browse cards
- [ ] Can create/edit profile
- [ ] Can search for matches

## Future Updates

Once connected to GitHub, Vercel will automatically:
- Deploy when you push to `main` branch
- Create preview deployments for pull requests
- No manual deployment needed!

## Custom Domain (Optional)

If you want a custom domain:
1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Vercel handles SSL automatically

---

**Project Name**: RifTrade  
**Ready to deploy!** 🚀

