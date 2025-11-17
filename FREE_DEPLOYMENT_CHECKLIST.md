# 🆓 Free Deployment Checklist

Quick reference checklist for deploying "This Story Does Not Exist" completely free!

## ✅ Pre-Deployment Checklist

### Account Setup (One-time only)
- [ ] GitHub account created
- [ ] Applied for GitHub Student Developer Pack (https://education.github.com/pack)
- [ ] OpenAI account created
- [ ] Neon.tech account (database)
- [ ] Render.com account (backend)
- [ ] Vercel account (frontend)
- [ ] Sentry account (optional - error tracking)

### Get Credentials
- [ ] OpenAI API key obtained (starts with `sk-`)
- [ ] Secret key generated: `python3 -c "import secrets; print(secrets.token_hex(32))"`
- [ ] Neon database connection string copied

---

## 🗄️ Database Setup (Choose ONE)

### Option A: Supabase (RECOMMENDED! 🌟)
**Why:** Built-in auth, beautiful dashboard, 500 MB free

1. **Create Database**
   - [ ] Go to https://supabase.com
   - [ ] Sign up with GitHub
   - [ ] Click "New project"
   - [ ] Name: `tsdne-db`
   - [ ] Generate strong password (save it!)
   - [ ] Choose region (closest to you)
   - [ ] Wait 2-3 minutes for setup

2. **Get Connection String**
   - [ ] Settings → Database → Connection string → URI
   - [ ] Copy and replace `[YOUR-PASSWORD]` with actual password
   ```bash
   postgresql://postgres:YOUR-PASSWORD@db.xxx.supabase.co:5432/postgres
   ```
   - [ ] Connection string saved securely

3. **Initialize Database (Optional - do now or after backend deployment)**
   - [ ] Click "SQL Editor" in Supabase dashboard
   - [ ] Run the CREATE TABLE SQL from `SUPABASE_GUIDE.md`
   - [ ] OR do this later via Render Shell: `python init_db.py`

**See `SUPABASE_GUIDE.md` for detailed Supabase setup!**

### Option B: Neon.tech
**Why:** 3 GB storage (vs 500 MB), simpler

1. **Create Database**
   - [ ] Go to https://neon.tech
   - [ ] Sign up with GitHub
   - [ ] Create new project: `tsdne-db`
   - [ ] Copy connection string (postgresql://...)

2. **Save Connection String**
   ```bash
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```
   - [ ] Connection string saved securely

---

## 🖥️ Backend Deployment (Render.com)

### Setup
1. **Connect Repository**
   - [ ] Go to https://render.com
   - [ ] Sign up with GitHub
   - [ ] Click "New +" → "Web Service"
   - [ ] Connect repository: `tsdne_v1`

2. **Configure Service**
   - [ ] Name: `tsdne-backend`
   - [ ] Region: Oregon
   - [ ] Branch: `main` (or your branch)
   - [ ] Root Directory: `backend`
   - [ ] Runtime: Python 3
   - [ ] Build Command: `pip install -r requirements.txt`
   - [ ] Start Command: `gunicorn application:application`

3. **Set Environment Variables**
   Click "Advanced" → Add Environment Variables:
   - [ ] `FLASK_ENV` = `production`
   - [ ] `DATABASE_URL` = `<your Neon connection string>`
   - [ ] `OPENAI_API_KEY` = `sk-...`
   - [ ] `SECRET_KEY` = `<generated secret key>`
   - [ ] `ALLOWED_ORIGINS` = `http://localhost:5173` (update later)

4. **Deploy**
   - [ ] Click "Create Web Service"
   - [ ] Wait for deployment (2-3 minutes)
   - [ ] Deployment successful (check logs)

5. **Initialize Database**
   - [ ] In Render dashboard → Click "Shell" tab
   - [ ] Run: `python init_db.py`
   - [ ] Verify: See "✓ Database tables created successfully!"

6. **Save Backend URL**
   ```
   https://your-backend.onrender.com
   ```
   - [ ] Backend URL saved

7. **Test Backend**
   - [ ] Visit: `https://your-backend.onrender.com/health`
   - [ ] Response: `{"status": "healthy"}`

---

## 🌐 Frontend Deployment (Vercel)

### Setup
1. **Import Project**
   - [ ] Go to https://vercel.com
   - [ ] Sign up with GitHub
   - [ ] Click "Add New" → "Project"
   - [ ] Import repository: `tsdne_v1`

2. **Configure Project**
   - [ ] Framework: Vite
   - [ ] Root Directory: `frontend`
   - [ ] Build Command: `npm run build`
   - [ ] Output Directory: `dist`

3. **Set Environment Variable**
   - [ ] Key: `VITE_API_URL`
   - [ ] Value: `https://your-backend.onrender.com` (your Render URL)

4. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait for deployment (1-2 minutes)
   - [ ] Deployment successful

5. **Save Frontend URL**
   ```
   https://your-app.vercel.app
   ```
   - [ ] Frontend URL saved

6. **Test Frontend**
   - [ ] Visit: `https://your-app.vercel.app`
   - [ ] App loads without errors

---

## 🔗 Connect Frontend & Backend

### Update Backend CORS
1. **Update ALLOWED_ORIGINS**
   - [ ] Go to Render dashboard
   - [ ] Click on backend service
   - [ ] Click "Environment" tab
   - [ ] Edit `ALLOWED_ORIGINS`:
     ```
     https://your-app.vercel.app
     ```
   - [ ] Save changes
   - [ ] Wait for auto-redeploy

2. **Test Connection**
   - [ ] Visit frontend: `https://your-app.vercel.app`
   - [ ] Open browser console (F12)
   - [ ] Start a new story
   - [ ] Enter a prompt
   - [ ] Verify AI responds
   - [ ] No CORS errors in console

---

## 🎯 Optional: Error Tracking (Sentry)

### Backend Sentry
1. **Create Project**
   - [ ] Go to https://sentry.io
   - [ ] Create account (free)
   - [ ] Create new project: Platform = Flask
   - [ ] Copy DSN (https://xxx@sentry.io/xxx)

2. **Add to Render**
   - [ ] Go to Render → Environment
   - [ ] Add: `SENTRY_DSN` = `<your backend Sentry DSN>`
   - [ ] Save

### Frontend Sentry
1. **Create Project**
   - [ ] In Sentry, create new project: Platform = React
   - [ ] Copy DSN

2. **Add to Vercel**
   - [ ] Go to Vercel → Settings → Environment Variables
   - [ ] Add: `VITE_SENTRY_DSN` = `<your frontend Sentry DSN>`
   - [ ] Redeploy

---

## 🧪 Final Testing

### End-to-End Test
- [ ] Visit frontend URL
- [ ] Create a new story
- [ ] Enter: "You wake up in a mysterious forest"
- [ ] AI responds with story
- [ ] Verify response streams in
- [ ] Check Sentry dashboards (if set up)
- [ ] No errors in browser console

### Database Test
- [ ] Go to Neon dashboard
- [ ] Click "Tables"
- [ ] Verify tables exist:
  - [ ] `conversations`
  - [ ] `messages`
- [ ] Check data was inserted

---

## 📊 Monitor Usage (Weekly)

### OpenAI
- [ ] Check: https://platform.openai.com/usage
- [ ] Credits remaining: $___

### Neon Database
- [ ] Check: https://console.neon.tech
- [ ] Storage used: ___ MB / 3000 MB

### Render
- [ ] Check: https://dashboard.render.com
- [ ] Hours used: ___ / 750 hours

### Vercel
- [ ] Check: https://vercel.com/dashboard/usage
- [ ] Bandwidth used: ___ GB / 100 GB

---

## 🎓 Get More Free Credits

### Apply for Student Benefits
- [ ] GitHub Student Pack: https://education.github.com/pack
  - [ ] $200 AWS credits
  - [ ] $100 DigitalOcean credits
  - [ ] Free domains

- [ ] Azure for Students: https://azure.microsoft.com/students
  - [ ] $100 credit (no credit card!)
  - [ ] Azure OpenAI access

- [ ] Google Cloud: https://cloud.google.com/edu/students
  - [ ] $300 credit

- [ ] OpenAI Researcher Access: https://openai.com/form/researcher-access-program

### Ask Your University
- [ ] CS department about OpenAI access
- [ ] IT department about Azure subscriptions
- [ ] Research lab about cloud credits

---

## 🎉 Success!

### You Now Have:
✅ Live application at: `https://your-app.vercel.app`
✅ API backend at: `https://your-backend.onrender.com`
✅ PostgreSQL database (Neon)
✅ Error tracking (Sentry)
✅ All running for **$0/month**!

### Share Your Work:
- [ ] Add to GitHub README
- [ ] Share link with friends
- [ ] Add to resume/portfolio
- [ ] Post on LinkedIn/Twitter

---

## 🆘 Troubleshooting

### Backend won't start
1. Check Render logs
2. Verify all environment variables are set
3. Verify DATABASE_URL format is correct
4. Run `python init_db.py` in Shell

### Frontend can't connect
1. Check CORS errors in browser console
2. Verify ALLOWED_ORIGINS in Render
3. Verify VITE_API_URL in Vercel
4. Backend might be sleeping (wait 30 sec)

### Out of OpenAI credits
1. Apply for Azure for Students ($100 free)
2. Ask university about OpenAI access
3. Add $5-10 to OpenAI account

---

## 📝 Important URLs

| Service | Dashboard | Purpose |
|---------|-----------|---------|
| Neon | https://console.neon.tech | Database |
| Render | https://dashboard.render.com | Backend |
| Vercel | https://vercel.com/dashboard | Frontend |
| Sentry | https://sentry.io | Errors |
| OpenAI | https://platform.openai.com | API usage |
| GitHub | https://education.github.com | Student pack |

---

**Estimated completion time**: 20-30 minutes
**Total cost**: $0/month
**Sustainability**: Unlimited (with student credits)

Happy deploying! 🚀
