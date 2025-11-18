# 100% Free Deployment Guide (Student Edition)

Deploy "This Story Does Not Exist" **completely free** using student-friendly services.

## 📚 Total Cost: $0/month

This guide uses only free services. Perfect for students!

---

## 🎓 STEP 0: Get Student Benefits (Do This First!)

### GitHub Student Developer Pack (ESSENTIAL!)

```bash
# Visit: https://education.github.com/pack
# 1. Sign in with GitHub
# 2. Click "Get student benefits"
# 3. Use your university email (.edu)
# 4. Upload proof (student ID or enrollment letter)
# 5. Wait 1-3 days for approval
```

**You'll get:**
- $200 AWS credits (optional, if you want to use AWS later)
- $100 DigitalOcean credits
- Free .me domain name
- And 100+ other developer tools for free!

---

## 🚀 Free Deployment Stack

| Service | Purpose | Free Tier | Setup Time |
|---------|---------|-----------|------------|
| **Neon.tech** | PostgreSQL Database | 3 GB storage, unlimited queries | 2 min |
| **Render.com** | Backend (Flask API) | 750 hours/month | 5 min |
| **Vercel** | Frontend (React) | Unlimited deploys | 3 min |
| **Sentry.io** | Error tracking | 5,000 errors/month | 2 min |
| **OpenAI** | AI API | $5 free credit | 2 min |

**Total setup time: ~15 minutes**

---

## 📋 Step-by-Step Instructions

### STEP 1: Get OpenAI API Key (2 min)

#### Option A: Free Trial (Easiest)
```bash
# 1. Visit: https://platform.openai.com/signup
# 2. Create account (no credit card for trial)
# 3. Go to: https://platform.openai.com/api-keys
# 4. Click "Create new secret key"
# 5. Copy the key (starts with sk-...)
```

**Free tier**: $5 credit (expires in 3 months)
**Enough for**: ~2,500 story interactions

#### Option B: Azure for Students (Best for Students!)
```bash
# 1. Visit: https://azure.microsoft.com/en-us/free/students/
# 2. Sign up with university email
# 3. Get $100 Azure credit + free Azure OpenAI access
# 4. No credit card required!

# After setup:
# - Create Azure OpenAI resource
# - Deploy GPT-3.5-turbo model
# - Get API key
```

#### Option C: Ask Your University
Many universities have:
- Campus-wide Azure subscriptions
- OpenAI research credits
- AWS Educate accounts

Ask your CS department or IT helpdesk!

---

### STEP 2: Set Up Database (Choose One)

#### Option A: Supabase (RECOMMENDED! 🌟)

```bash
# 1. Visit: https://supabase.com
# 2. Click "Start your project" → Sign up with GitHub
# 3. Click "New project"
#    - Name: tsdne-db
#    - Database Password: (generate strong password - SAVE IT!)
#    - Region: Choose closest to you
#    - Plan: Free
# 4. Wait 2-3 minutes for setup
# 5. Go to Settings → Database → Connection string → URI
# 6. Copy and replace [YOUR-PASSWORD] with your actual password
#    postgresql://postgres:YOUR-PASSWORD@db.xxx.supabase.co:5432/postgres
```

**Save this!** You'll need it in Step 3.

**Why Supabase?**
- ✅ No credit card required
- ✅ 500 MB storage + built-in authentication
- ✅ Beautiful dashboard to view your data
- ✅ Auto-generated REST APIs
- ✅ Perfect for adding user auth later (Task 4)!
- ✅ Free forever

**See `SUPABASE_GUIDE.md` for detailed instructions!**

#### Option B: Neon.tech (More storage)

```bash
# 1. Visit: https://neon.tech
# 2. Click "Sign Up" → Choose "Sign up with GitHub"
# 3. Authorize Neon
# 4. Click "Create a project"
#    - Name: tsdne-db
#    - Region: Choose closest to you
#    - PostgreSQL version: 15
# 5. Click on "Connection string"
# 6. Copy the connection string (looks like):
#    postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

**Why Neon?**
- ✅ 3 GB storage (vs Supabase's 500 MB)
- ✅ Faster setup (no password to remember)
- ✅ Free forever

**My recommendation: Use Supabase** - the built-in features are worth it!

---

### STEP 3: Deploy Backend - Render.com (5 min)

#### 3.1: Prepare Backend Code

First, create a Render-specific config:

```bash
cd backend

# Create render.yaml
cat > render.yaml << 'EOF'
services:
  - type: web
    name: tsdne-backend
    env: python
    region: oregon
    plan: free
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn application:application"
    envVars:
      - key: FLASK_ENV
        value: production
      - key: PYTHON_VERSION
        value: 3.10.0
EOF
```

#### 3.2: Deploy to Render

```bash
# 1. Visit: https://render.com
# 2. Click "Get Started" → "Sign up with GitHub"
# 3. Authorize Render
# 4. Click "New +" → "Web Service"
# 5. Connect your GitHub repository (tsdne_v1)
# 6. Configure:
#    - Name: tsdne-backend
#    - Region: Oregon (free tier)
#    - Branch: main (or your branch)
#    - Root Directory: backend
#    - Runtime: Python 3
#    - Build Command: pip install -r requirements.txt
#    - Start Command: gunicorn application:application
# 7. Click "Advanced" → Add Environment Variables:

FLASK_ENV=production
DATABASE_URL=<paste your Neon connection string>
OPENAI_API_KEY=<paste your OpenAI key>
SECRET_KEY=<generate below>
ALLOWED_ORIGINS=http://localhost:5173

# 8. Click "Create Web Service"
```

**Generate SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
# Copy the output and paste as SECRET_KEY
```

#### 3.3: Initialize Database

After deployment completes:

```bash
# 1. In Render dashboard, click on your service
# 2. Click "Shell" tab
# 3. Run:
python init_db.py
# You should see: "✓ Database tables created successfully!"
```

#### 3.4: Get Your Backend URL

```bash
# In Render dashboard, copy the URL at the top
# Example: https://tsdne-backend.onrender.com
```

**Save this!** You'll need it for the frontend.

**Note**: Free tier sleeps after 15 min of inactivity. First request after sleep takes ~30 seconds to wake up.

---

### STEP 4: Deploy Frontend - Vercel (3 min)

```bash
# 1. Visit: https://vercel.com
# 2. Click "Sign Up" → "Continue with GitHub"
# 3. Authorize Vercel
# 4. Click "Add New" → "Project"
# 5. Import your GitHub repo (tsdne_v1)
# 6. Configure:
#    - Framework Preset: Vite
#    - Root Directory: frontend
#    - Build Command: npm run build
#    - Output Directory: dist
# 7. Add Environment Variable:
#    - Key: VITE_API_URL
#    - Value: https://tsdne-backend.onrender.com (your Render URL)
# 8. Click "Deploy"
```

Wait 1-2 minutes for deployment to complete.

#### Get Your Frontend URL

```bash
# After deployment, Vercel shows your URL:
# Example: https://tsdne-v1.vercel.app
```

**Save this!** You need to update backend CORS.

---

### STEP 5: Update Backend CORS (1 min)

```bash
# 1. Go back to Render dashboard
# 2. Click on your backend service
# 3. Click "Environment" tab
# 4. Edit ALLOWED_ORIGINS variable:

ALLOWED_ORIGINS=https://your-app.vercel.app

# Replace with your actual Vercel URL
# 5. Click "Save Changes"
# Service will automatically redeploy
```

---

### STEP 6: Set Up Error Tracking - Sentry (Optional, 2 min)

```bash
# 1. Visit: https://sentry.io/signup/
# 2. Sign up (free account)
# 3. Create new project:
#    - Platform: Flask (for backend)
#    - Name: tsdne-backend
# 4. Copy the DSN
# 5. Create another project:
#    - Platform: React
#    - Name: tsdne-frontend
# 6. Copy that DSN

# Add to Render environment variables:
SENTRY_DSN=<your backend Sentry DSN>

# Add to Vercel environment variables:
VITE_SENTRY_DSN=<your frontend Sentry DSN>
```

---

## ✅ Verify Deployment

### Test Backend
```bash
# Visit: https://your-backend.onrender.com/health
# Should return: {"status": "healthy"}

# Note: First request may take 30 seconds (waking from sleep)
```

### Test Frontend
```bash
# Visit: https://your-app.vercel.app
# Should load the app

# Test functionality:
# 1. Start a new story
# 2. Enter a prompt
# 3. Verify AI responds
# 4. Check browser console for errors
```

### Check Database
```bash
# 1. Go to Neon dashboard
# 2. Click "Tables" tab
# 3. Should see:
#    - conversations
#    - messages
```

---

## 📊 Free Tier Limits

### What You Get Free:

| Service | Limit | Enough For |
|---------|-------|------------|
| **Neon** | 3 GB storage | ~300,000 messages |
| **Render** | 750 hours/month | 24/7 operation |
| **Vercel** | 100 GB bandwidth | ~100,000 visitors/month |
| **OpenAI** | $5 credit | ~2,500 AI interactions |
| **Sentry** | 5,000 errors | More than enough |

### When You'll Need to Pay:

- **OpenAI**: After $5 credit expires (3 months) or runs out
  - Cost: ~$0.002 per story interaction
  - $10 = ~5,000 interactions
  - Pro tip: Apply for educational credits!

### How to Stay Free Longer:

1. **OpenAI**:
   - Use Azure for Students ($100 credit)
   - Apply for OpenAI Researcher Access
   - Ask your university about campus OpenAI access

2. **Render** (backend):
   - Stays free as long as you're under 750 hours/month
   - Sleeps after 15 min inactivity (this is fine!)
   - Consider upgrading to Hobby plan ($7/month) only if you get real users

3. **Database**:
   - Neon free tier is 3 GB - plenty for a personal project
   - Clears old data if needed

---

## 🔄 Making Updates

### Update Backend:
```bash
# Just push to GitHub
git add .
git commit -m "Update backend"
git push

# Render auto-deploys from GitHub!
# Check deployment in Render dashboard
```

### Update Frontend:
```bash
# Just push to GitHub
git add .
git commit -m "Update frontend"
git push

# Vercel auto-deploys from GitHub!
# Check deployment in Vercel dashboard
```

---

## 🆘 Troubleshooting

### Backend Issues

**Problem**: "Application Error" on backend URL

**Solution**:
```bash
# 1. Check Render logs:
#    - Go to Render dashboard
#    - Click on service
#    - Click "Logs" tab
# 2. Common fixes:
#    - Verify DATABASE_URL is correct
#    - Verify OPENAI_API_KEY is set
#    - Check if database is initialized (run init_db.py)
```

**Problem**: Backend is slow (30+ seconds)

**Solution**: This is normal for free tier! It sleeps after 15 min inactivity.
- First request wakes it up (~30 sec)
- Subsequent requests are fast
- Consider Render Hobby plan ($7/month) for always-on

### Frontend Issues

**Problem**: CORS errors in browser console

**Solution**:
```bash
# 1. Verify ALLOWED_ORIGINS in Render includes your Vercel URL
# 2. Make sure it's https:// not http://
# 3. No trailing slash
```

**Problem**: Can't connect to backend

**Solution**:
```bash
# 1. Check VITE_API_URL in Vercel:
#    - Go to Vercel dashboard
#    - Click on project
#    - Click "Settings" → "Environment Variables"
#    - Verify VITE_API_URL is correct
# 2. Redeploy after fixing:
#    - Click "Deployments" tab
#    - Click "..." → "Redeploy"
```

### OpenAI Issues

**Problem**: "Insufficient credits" error

**Solutions**:
1. **Azure for Students**: Free $100 credit + OpenAI access
2. **AWS Educate**: Get credits through GitHub Student Pack
3. **University**: Ask if your university has OpenAI access
4. **Add payment**: As little as $5 lasts ~2,500 interactions

---

## 💰 Cost Optimization Tips

### Free OpenAI Alternatives for Students:

1. **Azure for Students**:
   ```bash
   # Visit: https://azure.microsoft.com/en-us/free/students/
   # Get $100 credit + Azure OpenAI access
   # No credit card required!
   ```

2. **AWS Educate** (via GitHub Student Pack):
   ```bash
   # Get AWS credits
   # Use AWS Bedrock for AI (includes free tier)
   ```

3. **Google Cloud for Students**:
   ```bash
   # Visit: https://edu.google.com/programs/students/
   # Get $300 credit
   # Use Vertex AI for language models
   ```

4. **Ask Your Professor**:
   - Many research labs have OpenAI credits
   - CS departments often have educational accounts
   - Worth asking!

### Monitor Usage:

```bash
# OpenAI usage:
# Visit: https://platform.openai.com/usage

# Neon database:
# Visit: https://console.neon.tech/app/projects
# Check storage usage

# Render:
# Visit: https://dashboard.render.com
# Check hours used

# Vercel:
# Visit: https://vercel.com/dashboard/usage
# Check bandwidth
```

---

## 🎓 Student Resources

### Get More Free Credits:

1. **GitHub Student Developer Pack**: https://education.github.com/pack
   - $200 AWS credits
   - $100 DigitalOcean
   - Free Heroku credits
   - And 100+ more!

2. **Azure for Students**: https://azure.microsoft.com/en-us/free/students/
   - $100 credit
   - Azure OpenAI access
   - No credit card needed

3. **Google Cloud**: https://cloud.google.com/edu/students
   - $300 credit
   - Vertex AI access

4. **AWS Educate**: https://aws.amazon.com/education/awseducate/
   - Free credits
   - Learning resources

### Educational OpenAI Access:

1. **OpenAI Researcher Access**:
   ```bash
   # Visit: https://openai.com/form/researcher-access-program
   # Explain your project
   # Students often get approved!
   ```

2. **University Subscriptions**:
   - Ask your CS department
   - Many universities have campus-wide AI API access

---

## 🎉 You're Done!

Your app is live and 100% free!

**Your URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`
- Database: Managed by Neon

**Next Steps:**
1. Share with friends!
2. Add to your resume/portfolio
3. Apply for more student credits
4. Keep building!

---

## 📞 Getting Help

**Free Resources:**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- Stack Overflow (tag: render.com, vercel, neon)

**Student Communities:**
- GitHub Education Community Forum
- Your university's CS Discord/Slack
- Reddit: r/webdev, r/learnprogramming

---

## ✨ Cost Summary

| Item | Cost |
|------|------|
| Neon Database | $0/month |
| Render Backend | $0/month |
| Vercel Frontend | $0/month |
| Sentry Errors | $0/month |
| OpenAI API | $0 (with student credits) |
| **TOTAL** | **$0/month** |

**Sustainable?** Yes! As long as:
- You stay within free tier limits
- You use student credits for OpenAI
- You keep Render on free tier (sleeps when idle)

Happy building! 🚀
