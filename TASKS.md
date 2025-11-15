# Development Tasks - Quick Reference

This is a condensed task list for quick reference. See [COMPLETION_ROADMAP.md](COMPLETION_ROADMAP.md) for detailed implementation guides.

---

## 🔴 HIGH PRIORITY

### ✅ Task 1: Conversation Management UI
**Effort:** 12-16 hours | **Status:** Not Started

**What to Build:**
- [ ] Create ConversationList component to display all user stories
- [ ] Add "New Story" and "My Stories" buttons to header
- [ ] Implement conversation loading (fetch and populate messages)
- [ ] Add delete conversation functionality (frontend + backend DELETE endpoint)
- [ ] Update App.tsx to track conversationId state
- [ ] Pass conversation_id to /generate API calls
- [ ] Add empty state when no conversations exist
- [ ] Style with dark/light theme support

**Files to Create:**
- `frontend/src/components/ConversationList.tsx`
- `frontend/src/components/ConversationSidebar.tsx`
- `frontend/src/components/ConversationItem.tsx`

**Files to Modify:**
- `frontend/src/App.tsx`
- `backend/routes.py` (add DELETE endpoint)

**Acceptance Criteria:**
- ✓ Can view list of past conversations
- ✓ Can click to resume any conversation
- ✓ Can start new conversation
- ✓ Can delete conversations
- ✓ Conversation context persists correctly

---

### ✅ Task 2: Automated Testing
**Effort:** 16-20 hours | **Status:** Not Started

**Backend Testing (pytest):**
- [ ] Install pytest, pytest-flask, pytest-cov
- [ ] Create `backend/tests/conftest.py` with fixtures
- [ ] Create `backend/tests/test_models.py` - test Conversation & Message models
- [ ] Create `backend/tests/test_routes.py` - test all 4 API endpoints
- [ ] Add TestingConfig to config.py
- [ ] Mock OpenAI API calls in tests
- [ ] Achieve 80%+ code coverage
- [ ] Create pytest.ini configuration

**Frontend Testing (Vitest):**
- [ ] Install vitest, @testing-library/react, jsdom
- [ ] Configure Vitest in vite.config.ts
- [ ] Create test setup file with jest-dom matchers
- [ ] Create component tests (OutputBox, UserInput, SettingsPanel)
- [ ] Create integration test for full message flow
- [ ] Achieve 70%+ code coverage
- [ ] Add test scripts to package.json

**CI/CD:**
- [ ] Create `.github/workflows/test.yml`
- [ ] Configure backend tests to run on push/PR
- [ ] Configure frontend tests to run on push/PR
- [ ] Add coverage reporting (codecov)
- [ ] Ensure all tests pass before merge

**Acceptance Criteria:**
- ✓ Backend coverage > 80%
- ✓ Frontend coverage > 70%
- ✓ All tests pass in CI/CD
- ✓ Easy to run tests locally

---

### ✅ Task 3: Production Deployment
**Effort:** 8-12 hours | **Status:** Not Started | **Requires:** Task 2

**Backend (AWS Elastic Beanstalk):**
- [ ] Set up PostgreSQL database (AWS RDS or Heroku Postgres)
- [ ] Create `.ebextensions/` configuration files
- [ ] Configure environment variables (OPENAI_API_KEY, DATABASE_URL, SECRET_KEY)
- [ ] Deploy to Elastic Beanstalk using EB CLI
- [ ] Configure auto-scaling (1-4 instances)
- [ ] Set up CloudWatch logging
- [ ] Configure health checks
- [ ] Test /health endpoint returns 200

**Frontend (Vercel):**
- [ ] Create `.env.production` with backend URL
- [ ] Deploy to Vercel using Vercel CLI
- [ ] Configure VITE_API_URL environment variable
- [ ] (Optional) Set up custom domain
- [ ] Test frontend connects to backend

**CORS & Security:**
- [ ] Update CORS to allow specific origins only (no *)
- [ ] Enable HTTPS (automatic with EB/Vercel)
- [ ] Rotate and secure all API keys
- [ ] Configure security headers

**Monitoring:**
- [ ] Set up Sentry for error tracking (backend + frontend)
- [ ] Configure CloudWatch alarms for high CPU
- [ ] Set up uptime monitoring
- [ ] Test error reporting works

**Acceptance Criteria:**
- ✓ Application live at public URL
- ✓ SSL/HTTPS enabled
- ✓ Database persisting data
- ✓ Error monitoring active
- ✓ Logs accessible
- ✓ Auto-scaling configured

---

## 🟡 MEDIUM PRIORITY

### ✅ Task 4: User Authentication
**Effort:** 20-24 hours | **Status:** Not Started | **Requires:** Tasks 1, 3

**Backend:**
- [ ] Create User and Session models
- [ ] Add user_id foreign key to Conversation model
- [ ] Create auth routes: /auth/register, /auth/login, /auth/logout, /auth/me
- [ ] Implement require_auth decorator
- [ ] Hash passwords with werkzeug.security
- [ ] Generate secure session tokens
- [ ] Update existing routes to require auth
- [ ] Filter conversations by user_id

**Frontend:**
- [ ] Create AuthContext with React Context API
- [ ] Create LoginForm and RegisterForm components
- [ ] Add auth token to localStorage
- [ ] Include Authorization header in all API calls
- [ ] Create protected route wrapper
- [ ] Add login/register modal to landing page
- [ ] Display current user in header
- [ ] Add logout button

**Security:**
- [ ] Password minimum 8 characters
- [ ] Prevent duplicate usernames/emails
- [ ] Token expiration (30 days)
- [ ] Secure password hashing (werkzeug)
- [ ] Session invalidation on logout

**Acceptance Criteria:**
- ✓ Users can register accounts
- ✓ Users can log in/out
- ✓ Sessions persist on page reload
- ✓ Users only see their own conversations
- ✓ Passwords securely hashed

---

### ✅ Task 5: AI Conversation Summarization
**Effort:** 12-16 hours | **Status:** Not Started

**Backend:**
- [ ] Add `summary` field to Conversation model
- [ ] Create `summarize_conversation()` function using OpenAI
- [ ] Auto-summarize when conversation reaches 20+ messages
- [ ] Update `construct_system_prompt()` to include summary
- [ ] Create `/conversations/<id>/summarize` endpoint for manual summarization
- [ ] Include summary + recent 10 messages in AI context

**Frontend:**
- [ ] Display conversation summary in ConversationDetails component
- [ ] Add "Summarize" button for manual summarization
- [ ] Show loading state during summarization
- [ ] Style summary section distinctly

**Logic:**
- [ ] Only summarize conversations with 20+ messages
- [ ] Summarize older messages (exclude last 10)
- [ ] Re-summarize every 10 messages after initial summary
- [ ] Keep summaries under 500 tokens

**Acceptance Criteria:**
- ✓ Long conversations auto-summarized
- ✓ Summary preserves plot points
- ✓ Recent messages still included
- ✓ No token limit errors
- ✓ Summary visible in UI

---

## 🟢 LOW PRIORITY

### ✅ Task 6: Story Templates & Genres
**Effort:** 8-12 hours | **Status:** Not Started

**Backend:**
- [ ] Create `templates.py` with genre definitions
- [ ] Define templates: Fantasy, Sci-Fi, Mystery, Horror, Custom
- [ ] Add genre-specific system prompts
- [ ] Create starter prompts for each genre
- [ ] Update `/generate` endpoint to accept genre parameter
- [ ] Modify `construct_system_prompt()` to include genre

**Frontend:**
- [ ] Create GenreSelector component
- [ ] Display genre options with icons
- [ ] Show starter prompts for selected genre
- [ ] Pass genre to API calls
- [ ] Add genre selection to "New Story" flow

**Genres to Implement:**
- [ ] 🐉 Fantasy Adventure
- [ ] 🚀 Science Fiction
- [ ] 🔍 Mystery/Detective
- [ ] 👻 Horror
- [ ] ✨ Custom

**Acceptance Criteria:**
- ✓ Users can select genre
- ✓ AI responses match genre
- ✓ Starter prompts available
- ✓ UI displays options clearly

---

### ✅ Task 7: Enhanced Error Monitoring
**Effort:** 4-6 hours | **Status:** Not Started | **Requires:** Task 3

**Already Covered in Task 3, Additional Enhancements:**
- [ ] Add user context to Sentry errors
- [ ] Track slow requests (>2 seconds)
- [ ] Create custom error pages (404, 500)
- [ ] Set up error email notifications
- [ ] Configure performance monitoring
- [ ] Add frontend error boundary
- [ ] Upload source maps for debugging

**Acceptance Criteria:**
- ✓ All errors reported with context
- ✓ Performance tracking enabled
- ✓ Notifications configured
- ✓ Source maps working

---

## Quick Start Guide

### For Task 1 (Conversation UI):
```bash
# Frontend
cd frontend/src/components
# Create ConversationList.tsx, ConversationSidebar.tsx, ConversationItem.tsx
# Modify App.tsx to add conversation state

# Backend
cd backend
# Add DELETE /conversations/<id> endpoint to routes.py
```

### For Task 2 (Testing):
```bash
# Backend
cd backend
pip install pytest pytest-flask pytest-cov
mkdir tests
# Create conftest.py, test_models.py, test_routes.py
pytest --cov

# Frontend
cd frontend
npm install -D vitest @testing-library/react jsdom
# Update vite.config.ts
# Create test files in __tests__ directories
npm run test
```

### For Task 3 (Deployment):
```bash
# Backend
pip install awsebcli
eb init -p python-3.10 tsdne-backend
eb create tsdne-production
eb deploy

# Frontend
npm install -g vercel
cd frontend
vercel
vercel --prod
```

---

## Dependencies Graph

```
Task 3 (Deployment) ──> Requires ──> Task 2 (Testing)
                                      │
Task 4 (Auth) ──────> Requires ──> Task 1 (Conversation UI)
                                      │
                                   Task 3 (Deployment)

Task 7 (Monitoring) ─> Requires ──> Task 3 (Deployment)

Task 5 (Summarization) ─> No dependencies
Task 6 (Templates) ─────> No dependencies
```

---

## Recommended Execution Order

1. **Week 1-2:** Task 1 (Conversation UI) + Task 2 (Testing)
2. **Week 3:** Task 3 (Deployment) + Task 7 (Monitoring)
3. **Week 4-5:** Task 4 (User Authentication)
4. **Week 6:** Task 5 (AI Summarization)
5. **Week 7:** Task 6 (Story Templates)

**Total Time:** 7-8 weeks for full completion

---

## Progress Tracking

Update this checklist as tasks are completed:

- [ ] Task 1: Conversation Management UI
- [ ] Task 2: Automated Testing
- [ ] Task 3: Production Deployment
- [ ] Task 4: User Authentication
- [ ] Task 5: AI Summarization
- [ ] Task 6: Story Templates
- [ ] Task 7: Enhanced Monitoring

**Current Progress:** 0/7 tasks complete (0%)

---

## Quick Reference Commands

**Run Backend:**
```bash
cd backend
python app.py
```

**Run Frontend:**
```bash
cd frontend
npm run dev
```

**Run Tests:**
```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

**Deploy:**
```bash
# Backend
cd backend && eb deploy

# Frontend
cd frontend && vercel --prod
```

**Check Status:**
```bash
# Backend health
curl https://your-app.elasticbeanstalk.com/health

# View logs
eb logs
```

---

For detailed implementation guides, see [COMPLETION_ROADMAP.md](COMPLETION_ROADMAP.md)
