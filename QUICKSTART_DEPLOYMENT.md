# Quick Deployment Guide

This is a condensed version of the full deployment guide. For detailed instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🚀 Deploy in 15 Minutes

### Prerequisites Installed?

```bash
# Check if you have the required tools
aws --version
eb --version
vercel --version

# If not, install them:
pip install awsebcli
npm install -g vercel
```

### 1. Set Up Database (5 min)

**Quick Option: Heroku Postgres (Easiest)**

```bash
heroku create tsdne-backend
heroku addons:create heroku-postgresql:mini
DATABASE_URL=$(heroku config:get DATABASE_URL)
echo $DATABASE_URL  # Save this!
```

**OR AWS RDS (More control)**

```bash
aws rds create-db-instance \
  --db-instance-identifier tsdne-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourSecurePass123! \
  --allocated-storage 20

# Wait 5-10 minutes, then get endpoint
aws rds describe-db-instances --db-instance-identifier tsdne-db \
  --query 'DBInstances[0].Endpoint.Address'
```

### 2. Deploy Backend to AWS EB (5 min)

```bash
cd backend

# Initialize EB
eb init -p python-3.10 tsdne-backend --region us-east-1

# Create environment
eb create tsdne-production --instance-type t3.small

# Set environment variables
eb setenv \
  OPENAI_API_KEY=sk-your-key-here \
  DATABASE_URL=postgresql://user:pass@host:5432/db \
  SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))") \
  FLASK_ENV=production \
  ALLOWED_ORIGINS=https://localhost:5173

# Initialize database
eb ssh
source /var/app/venv/*/bin/activate
cd /var/app/current
python init_db.py
exit

# Get backend URL
eb status | grep CNAME
# Save this URL!
```

### 3. Deploy Frontend to Vercel (3 min)

```bash
cd frontend

# Update .env.production with your backend URL
echo "VITE_API_URL=https://your-eb-url.elasticbeanstalk.com" > .env.production

# Deploy
vercel login
vercel --prod

# Set environment variable
vercel env add VITE_API_URL production
# Enter: https://your-eb-url.elasticbeanstalk.com

# Get frontend URL
vercel domains
# Save this URL!
```

### 4. Update CORS (1 min)

```bash
cd backend

# Update backend to allow your Vercel domain
eb setenv ALLOWED_ORIGINS=https://your-app.vercel.app

# Redeploy
eb deploy
```

### 5. Test Your Deployment (1 min)

```bash
# Test backend
curl https://your-eb-url.elasticbeanstalk.com/health

# Open frontend
open https://your-app.vercel.app

# Try creating a story!
```

## ✅ Verification Checklist

- [ ] Backend health endpoint returns `{"status": "healthy"}`
- [ ] Frontend loads without errors
- [ ] Can create a new story
- [ ] AI responses stream correctly
- [ ] No CORS errors in browser console

## 🐛 Quick Troubleshooting

### Backend Issues

```bash
# View logs
eb logs --stream

# Common fixes
eb setenv OPENAI_API_KEY=sk-your-actual-key
eb setenv DATABASE_URL=postgresql://correct-url
eb deploy
```

### Frontend Issues

```bash
# Check environment variables
vercel env ls

# Redeploy
vercel --prod
```

### CORS Errors

```bash
# Update allowed origins
eb setenv ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://yourdomain.com
```

## 📋 Environment Variables Summary

### Backend (AWS EB)

```bash
OPENAI_API_KEY=sk-xxxxx              # Required
DATABASE_URL=postgresql://...        # Required
SECRET_KEY=random-secure-key         # Required
FLASK_ENV=production                 # Required
ALLOWED_ORIGINS=https://your-app...  # Required
SENTRY_DSN=https://...               # Optional
```

### Frontend (Vercel)

```bash
VITE_API_URL=https://your-eb-url.elasticbeanstalk.com
```

## 💡 Pro Tips

1. **Generate Secure Keys**
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Monitor Costs**
   - Set OpenAI usage limits: https://platform.openai.com/usage
   - Use t3.micro for testing (cheaper)

3. **Quick Updates**
   ```bash
   # Backend
   cd backend && eb deploy

   # Frontend (if not using GitHub auto-deploy)
   cd frontend && vercel --prod
   ```

4. **View Logs Easily**
   ```bash
   # Backend logs
   eb logs --stream

   # Frontend logs
   vercel logs your-deployment-url
   ```

## 🎯 Next Steps

1. ✅ Set up custom domain (optional)
2. ✅ Configure Sentry for error tracking
3. ✅ Enable database backups
4. ✅ Set up monitoring alerts
5. ✅ Test on mobile devices

## 📖 Full Documentation

For detailed instructions, troubleshooting, and advanced configuration:
- See [DEPLOYMENT.md](DEPLOYMENT.md)
- See [COMPLETION_ROADMAP.md](COMPLETION_ROADMAP.md) for remaining tasks

---

**Estimated Total Time:** 15-20 minutes
**Estimated Monthly Cost:** $30-45 (AWS) + Usage-based (OpenAI)

🎉 Happy deploying!
