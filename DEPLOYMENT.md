# Deployment Guide

This guide covers deploying "This Story Does Not Exist" to production using AWS Elastic Beanstalk (backend) and Vercel (frontend).

## 📋 Prerequisites

Before deploying, ensure you have:

- **AWS Account** with appropriate permissions
- **AWS CLI** installed and configured
- **EB CLI** (Elastic Beanstalk CLI) installed
- **Vercel Account** (free tier works)
- **Vercel CLI** installed
- **PostgreSQL database** (AWS RDS or similar)
- **OpenAI API Key**
- **Sentry Account** (optional, for error tracking)

## 🔧 Pre-Deployment Setup

### 1. Install Required Tools

```bash
# Install AWS EB CLI
pip install awsebcli

# Install Vercel CLI
npm install -g vercel

# Verify installations
eb --version
vercel --version
```

### 2. Set Up PostgreSQL Database

#### Option A: AWS RDS PostgreSQL

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier tsdne-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --publicly-accessible

# Wait for database to be available (takes 5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier tsdne-db

# Get the database endpoint
aws rds describe-db-instances \
  --db-instance-identifier tsdne-db \
  --query 'DBInstances[0].Endpoint.Address'
```

Your DATABASE_URL will be:
```
postgresql://admin:YOUR_SECURE_PASSWORD@YOUR-ENDPOINT:5432/postgres
```

#### Option B: Heroku Postgres

```bash
# Create Heroku app (if using Heroku)
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Get DATABASE_URL
heroku config:get DATABASE_URL
```

### 3. Set Up Sentry (Optional but Recommended)

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project for Flask
3. Copy your DSN (looks like: `https://xxxxx@sentry.io/xxxxx`)

## 🚀 Backend Deployment (AWS Elastic Beanstalk)

### Step 1: Initialize Elastic Beanstalk

```bash
cd backend

# Initialize EB application
eb init -p python-3.10 tsdne-backend --region us-east-1

# Follow prompts:
# - Application name: tsdne-backend
# - Use default settings for other options
```

### Step 2: Create Environment Variables

Create a file `backend/environment.config` (DO NOT commit this file):

```bash
# Required Environment Variables
OPENAI_API_KEY=sk-your-actual-openai-key
DATABASE_URL=postgresql://username:password@host:5432/dbname
SECRET_KEY=your-very-secure-random-secret-key-here
FLASK_ENV=production

# CORS - Add your Vercel domain after frontend deployment
ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com

# Optional: Sentry DSN
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Step 3: Create and Deploy Environment

```bash
# Create production environment
eb create tsdne-production \
  --instance-type t3.small \
  --region us-east-1

# This will take 5-10 minutes

# Set environment variables from file
eb setenv $(cat environment.config | xargs)

# OR set them individually:
eb setenv OPENAI_API_KEY=sk-xxx \
          DATABASE_URL=postgresql://... \
          SECRET_KEY=xxx \
          FLASK_ENV=production \
          ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Step 4: Initialize Database

```bash
# SSH into EB instance
eb ssh

# Navigate to app directory
cd /var/app/current

# Run database initialization
source /var/app/venv/*/bin/activate
python init_db.py

# Exit SSH
exit
```

### Step 5: Verify Backend Deployment

```bash
# Get the EB URL
eb status

# Test health endpoint
curl https://your-eb-url.elasticbeanstalk.com/health

# Expected response: {"status": "healthy"}
```

### Step 6: Configure Security Group (AWS Console)

1. Go to EC2 → Security Groups
2. Find the security group for your EB environment
3. Ensure these inbound rules exist:
   - HTTP (80) from anywhere (0.0.0.0/0)
   - HTTPS (443) from anywhere (0.0.0.0/0)

## 🌐 Frontend Deployment (Vercel)

### Step 1: Update Production Environment

Edit `frontend/.env.production` with your actual backend URL:

```bash
VITE_API_URL=https://your-eb-url.elasticbeanstalk.com
```

### Step 2: Deploy to Vercel

```bash
cd frontend

# Login to Vercel
vercel login

# Deploy to preview
vercel

# After verifying preview, deploy to production
vercel --prod
```

### Step 3: Set Environment Variables in Vercel

```bash
# Set production environment variable
vercel env add VITE_API_URL production

# When prompted, enter: https://your-eb-url.elasticbeanstalk.com
```

### Step 4: Update Backend CORS

Now that you have your Vercel URL, update backend CORS:

```bash
cd backend

# Update ALLOWED_ORIGINS to include your Vercel domain
eb setenv ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com

# Restart environment
eb deploy
```

## 🔄 Updating Deployments

### Update Backend

```bash
cd backend

# Make your changes, then:
git add .
git commit -m "Your changes"

# Deploy to EB
eb deploy

# View logs if needed
eb logs
```

### Update Frontend

```bash
cd frontend

# Make your changes, commit to git, then:
vercel --prod

# OR if linked to GitHub, just push:
git push origin main  # Vercel auto-deploys
```

## 🔐 Security Checklist

Before going live, verify:

- [ ] HTTPS enabled (automatic on EB/Vercel)
- [ ] Environment variables secured (not in code)
- [ ] Database credentials are strong and unique
- [ ] CORS configured with specific origins (no wildcards)
- [ ] SECRET_KEY is random and secure (generate with: `python -c "import secrets; print(secrets.token_hex(32))"`)
- [ ] OpenAI API key has usage limits set
- [ ] Sentry error tracking configured
- [ ] Database backups enabled (RDS automated backups)

## 📊 Post-Deployment Verification

### Backend Health Checks

```bash
# Test endpoints
curl https://your-eb-url.elasticbeanstalk.com/health
curl https://your-eb-url.elasticbeanstalk.com/conversations
```

### Frontend Verification

1. Open https://your-app.vercel.app
2. Start a new story
3. Verify AI responses are streaming
4. Check browser console for errors
5. Test theme switching

### End-to-End Testing

1. Create a new story conversation
2. Send multiple messages
3. Refresh page and verify persistence
4. Open browser DevTools → Network tab
5. Verify all API calls return 200 status

## 📈 Monitoring

### CloudWatch Logs (Backend)

```bash
# View live logs
eb logs --stream

# Download recent logs
eb logs
```

### Sentry Error Tracking

- Visit your Sentry dashboard: https://sentry.io
- Monitor errors in real-time
- Set up alerts for critical errors

### Database Monitoring

```bash
# Monitor database performance
aws rds describe-db-instances \
  --db-instance-identifier tsdne-db \
  --query 'DBInstances[0].[DBInstanceStatus,StorageType,AllocatedStorage]'
```

## 🚨 Troubleshooting

### Backend Issues

**Issue:** Environment shows "Degraded" health

```bash
# Check logs
eb logs

# Common causes:
# 1. Database connection failed → Check DATABASE_URL
# 2. Missing OPENAI_API_KEY
# 3. Python package installation failed → Check requirements.txt
```

**Issue:** CORS errors in browser

```bash
# Verify ALLOWED_ORIGINS includes your frontend URL
eb printenv | grep ALLOWED_ORIGINS

# Update if needed
eb setenv ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Frontend Issues

**Issue:** API calls fail with 404

- Verify `VITE_API_URL` in `.env.production`
- Check environment variable in Vercel dashboard
- Ensure backend is deployed and healthy

**Issue:** Build fails on Vercel

```bash
# Check build logs in Vercel dashboard
# Common causes:
# 1. TypeScript errors → Fix in development
# 2. Missing dependencies → Run npm install locally
```

### Database Issues

**Issue:** Cannot connect to database

```bash
# Test connection from EB instance
eb ssh
psql $DATABASE_URL

# If connection fails:
# 1. Check RDS security group allows inbound from EB
# 2. Verify DATABASE_URL is correct
# 3. Check database is in "available" state
```

## 💰 Cost Optimization

### AWS Costs (Approximate)

- **EB t3.small instance:** ~$15-25/month
- **RDS db.t3.micro:** ~$15/month
- **Data transfer:** ~$1-5/month
- **Total:** ~$30-45/month

### Reduce Costs

```bash
# Use smaller instance for low traffic
eb scale 1 --instance-type t3.micro

# Enable auto-scaling to scale down during low traffic
# (Already configured in .ebextensions/02_autoscaling.config)
```

### OpenAI API Costs

- Set usage limits in OpenAI dashboard
- Monitor usage: https://platform.openai.com/usage
- Consider caching common responses (future enhancement)

## 🔄 Backup and Recovery

### Database Backups

AWS RDS automated backups are enabled by default (7-day retention).

```bash
# Manual snapshot
aws rds create-db-snapshot \
  --db-snapshot-identifier tsdne-manual-backup-$(date +%Y%m%d) \
  --db-instance-identifier tsdne-db

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier tsdne-db
```

### Restore from Backup

```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier tsdne-db-restored \
  --db-snapshot-identifier your-snapshot-id

# Update DATABASE_URL to point to restored database
```

## 🎯 Production Readiness Checklist

Before announcing your app to users:

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] End-to-end story creation works
- [ ] HTTPS working on both frontend and backend
- [ ] Error tracking (Sentry) receiving data
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] OpenAI API usage limits configured
- [ ] CORS properly restricted
- [ ] Security headers configured
- [ ] All secrets secured (not in code)
- [ ] Domain name configured (optional)

## 🌟 Custom Domain Setup (Optional)

### Backend Custom Domain

1. Get SSL certificate in AWS Certificate Manager
2. Configure custom domain in EB console
3. Update DNS records

### Frontend Custom Domain

```bash
# Add domain in Vercel
vercel domains add yourdomain.com

# Follow Vercel's DNS instructions
# Typically:
# A record @ → 76.76.21.21
# CNAME www → cname.vercel-dns.com
```

Update backend CORS after adding custom domain:

```bash
eb setenv ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 📞 Support Resources

- **AWS EB Documentation:** https://docs.aws.amazon.com/elasticbeanstalk/
- **Vercel Documentation:** https://vercel.com/docs
- **OpenAI API:** https://platform.openai.com/docs
- **Sentry Documentation:** https://docs.sentry.io/

---

## Quick Command Reference

```bash
# Backend (EB)
eb deploy                    # Deploy updates
eb logs --stream            # View live logs
eb ssh                      # SSH into instance
eb printenv                 # View environment variables
eb setenv KEY=value         # Set environment variable
eb health                   # Check health status
eb terminate                # Delete environment (careful!)

# Frontend (Vercel)
vercel                      # Deploy to preview
vercel --prod               # Deploy to production
vercel env ls               # List environment variables
vercel logs                 # View deployment logs
vercel domains              # Manage domains

# Database
aws rds describe-db-instances --db-instance-identifier tsdne-db
psql $DATABASE_URL          # Connect to database
```

## 🎉 Congratulations!

Your app is now live in production! Remember to:

1. Monitor error logs regularly (Sentry)
2. Check CloudWatch for performance issues
3. Review OpenAI API usage monthly
4. Keep dependencies updated
5. Back up your database regularly

Happy storytelling! 📖✨
