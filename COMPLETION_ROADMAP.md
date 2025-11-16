# Project Completion Roadmap

**Project:** This Story Does Not Exist
**Current Status:** 60% Complete - Core Engine Functional
**Goal:** Production-Ready AI Storytelling Application

---

## Overview

This document provides detailed task descriptions for completing the "This Story Does Not Exist" project. Each task includes:
- Clear objectives and success criteria
- Technical implementation details
- Estimated effort and dependencies
- Testing requirements

---

## High Priority Tasks

### Task 1: Implement Conversation Management UI

**Priority:** 🔴 HIGH
**Estimated Effort:** 12-16 hours
**Dependencies:** None (backend API already exists)
**Status:** Not Started

#### Objective
Enable users to view, resume, and manage their past story conversations through a frontend interface.

#### Current Situation
- Backend API endpoints already exist:
  - `GET /conversations` - Lists all conversations
  - `GET /conversations/<id>` - Retrieves specific conversation
- Frontend currently creates new conversations but doesn't track conversation_id
- No UI to view or resume previous stories

#### Implementation Details

**1. Create Conversation List Component** (`frontend/src/components/ConversationList.tsx`)

```typescript
// Features needed:
- Display list of all conversations
- Show creation date, last updated, message count
- Click to load conversation
- Delete conversation option
- Sort by date (newest first)
- Empty state when no conversations exist
- Loading and error states
```

**Technical Requirements:**
- Fetch conversations from `GET /conversations`
- Format dates with relative time (e.g., "2 hours ago")
- Responsive design matching current theme
- Dark/light mode support
- Smooth animations for list items

**2. Update App.tsx State Management**

```typescript
// Changes needed:
- Add conversationId state variable
- Pass conversationId to API calls in sendMessage()
- Add function to load conversation history
- Add function to start new conversation
- Add function to delete conversation
```

**State Structure:**
```typescript
const [conversationId, setConversationId] = useState<number | null>(null);
const [showConversations, setShowConversations] = useState(false);
```

**3. Update API Call in sendMessage()**

```typescript
// Current:
body: JSON.stringify({ input })

// Updated:
body: JSON.stringify({
  input,
  conversation_id: conversationId
})
```

**4. Add Conversation Controls to UI**

Location: Header or sidebar
- "New Story" button - Clear messages, set conversationId to null
- "My Stories" button - Open conversation list modal/sidebar
- Current conversation indicator (if conversationId exists)

**5. Load Conversation Functionality**

```typescript
const loadConversation = async (id: number) => {
  try {
    const response = await fetch(`${apiUrl}/conversations/${id}`);
    const data = await response.json();

    // Transform backend format to frontend format
    const loadedMessages = data.messages.map(m => ({
      role: m.role,
      text: m.text
    }));

    setMessages(loadedMessages);
    setConversationId(id);
    setShowConversations(false);
  } catch (error) {
    console.error("Failed to load conversation:", error);
  }
};
```

**6. Delete Conversation Functionality**

Backend endpoint needed (new):
```python
@app.route("/conversations/<int:conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    # Delete conversation and all messages
```

Frontend implementation:
```typescript
const deleteConversation = async (id: number) => {
  if (!confirm("Delete this story? This cannot be undone.")) return;

  try {
    await fetch(`${apiUrl}/conversations/${id}`, {
      method: 'DELETE'
    });
    // Refresh conversation list
  } catch (error) {
    console.error("Failed to delete conversation:", error);
  }
};
```

#### UI/UX Considerations

**Modal vs Sidebar:**
- **Recommended:** Slide-out sidebar from left
- Keeps main story visible
- Smooth transition animation
- Mobile-friendly

**Conversation List Item Design:**
```
┌─────────────────────────────────────┐
│ Story from 2 hours ago              │
│ 12 messages • Last updated 1h ago   │
│ "You enter a dark forest..."        │
│                          [Delete] ❌│
└─────────────────────────────────────┘
```

#### Testing Checklist

- [ ] Conversations load correctly
- [ ] Can resume existing conversation
- [ ] New messages append to existing conversation
- [ ] Delete removes conversation and all messages
- [ ] Empty state displays when no conversations
- [ ] Loading states display properly
- [ ] Error handling for failed API calls
- [ ] Works in both dark and light themes
- [ ] Responsive on mobile devices
- [ ] Dates format correctly
- [ ] List updates after creating new conversation

#### Files to Create/Modify

**New Files:**
- `frontend/src/components/ConversationList.tsx`
- `frontend/src/components/ConversationSidebar.tsx`
- `frontend/src/components/ConversationItem.tsx`

**Modified Files:**
- `frontend/src/App.tsx` (state management, conversation loading)
- `backend/routes.py` (add DELETE endpoint)

#### Success Criteria

✅ Users can view all their past stories
✅ Users can click to resume a previous story
✅ Users can start a new story at any time
✅ Users can delete unwanted stories
✅ Conversation context persists correctly
✅ UI is intuitive and matches existing design

---

### Task 2: Add Automated Testing Infrastructure

**Priority:** 🔴 HIGH
**Estimated Effort:** 16-20 hours
**Dependencies:** None
**Status:** Not Started

#### Objective
Implement comprehensive automated testing for both backend and frontend to ensure code quality and prevent regressions.

#### Current Situation
- **Zero tests** in the entire codebase
- No testing framework configured
- No CI/CD pipeline
- Risky to make changes without test coverage

#### Implementation Details

### Part A: Backend Testing (pytest)

**1. Setup Testing Infrastructure**

Install dependencies:
```bash
pip install pytest pytest-flask pytest-cov
```

Add to `backend/requirements.txt`:
```
pytest==8.0.0
pytest-flask==1.3.0
pytest-cov==4.1.0
```

**2. Create Test Configuration**

`backend/tests/conftest.py`:
```python
import pytest
from app import create_app
from database import db
from models import Conversation, Message

@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app('testing')
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Test client"""
    return app.test_client()

@pytest.fixture
def sample_conversation():
    """Create sample conversation for testing"""
    conv = Conversation()
    db.session.add(conv)
    db.session.commit()

    msg1 = Message(conversation_id=conv.id, role='player', text='Hello')
    msg2 = Message(conversation_id=conv.id, role='ai', text='Hi there!')
    db.session.add_all([msg1, msg2])
    db.session.commit()

    return conv
```

**3. Unit Tests for Models**

`backend/tests/test_models.py`:
```python
from models import Conversation, Message
from database import db

def test_conversation_creation(app):
    """Test conversation model creation"""
    with app.app_context():
        conv = Conversation()
        db.session.add(conv)
        db.session.commit()

        assert conv.id is not None
        assert conv.created_at is not None
        assert conv.updated_at is not None

def test_message_creation(app, sample_conversation):
    """Test message model creation"""
    with app.app_context():
        msg = Message(
            conversation_id=sample_conversation.id,
            role='player',
            text='Test message'
        )
        db.session.add(msg)
        db.session.commit()

        assert msg.id is not None
        assert msg.role == 'player'
        assert msg.text == 'Test message'

def test_conversation_messages_relationship(app, sample_conversation):
    """Test conversation-messages relationship"""
    with app.app_context():
        conv = Conversation.query.get(sample_conversation.id)
        assert len(conv.messages) == 2
```

**4. Integration Tests for API Endpoints**

`backend/tests/test_routes.py`:
```python
import json
from unittest.mock import patch, MagicMock

def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json == {'status': 'healthy'}

def test_list_conversations_empty(client):
    """Test listing conversations when none exist"""
    response = client.get('/conversations')
    assert response.status_code == 200
    assert response.json == []

def test_list_conversations_with_data(client, sample_conversation):
    """Test listing conversations with data"""
    response = client.get('/conversations')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['id'] == sample_conversation.id

def test_get_conversation_by_id(client, sample_conversation):
    """Test getting specific conversation"""
    response = client.get(f'/conversations/{sample_conversation.id}')
    assert response.status_code == 200
    assert response.json['id'] == sample_conversation.id
    assert len(response.json['messages']) == 2

def test_get_nonexistent_conversation(client):
    """Test getting conversation that doesn't exist"""
    response = client.get('/conversations/999')
    assert response.status_code == 404

@patch('routes.client')
def test_generate_response_new_conversation(mock_openai, client):
    """Test generating response for new conversation"""
    # Mock OpenAI streaming response
    mock_chunk = MagicMock()
    mock_chunk.choices = [MagicMock()]
    mock_chunk.choices[0].delta.content = 'Test response'

    mock_openai.chat.completions.create.return_value = [mock_chunk]

    response = client.post('/generate',
        json={'input': 'Test input'},
        headers={'Content-Type': 'application/json'}
    )

    assert response.status_code == 200

def test_generate_response_missing_input(client):
    """Test generating response without input"""
    response = client.post('/generate',
        json={},
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 400
```

**5. Test Configuration Class**

Add to `backend/config.py`:
```python
class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    OPENAI_API_KEY = 'test-key-not-real'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
```

**6. Run Tests with Coverage**

Create `backend/pytest.ini`:
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --verbose --cov=. --cov-report=html --cov-report=term
```

Run tests:
```bash
cd backend
pytest
pytest --cov --cov-report=html  # Generate HTML coverage report
```

### Part B: Frontend Testing (Vitest + React Testing Library)

**1. Setup Testing Infrastructure**

Install dependencies:
```bash
cd frontend
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**2. Configure Vitest**

`frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
})
```

**3. Test Setup File**

`frontend/src/test/setup.ts`:
```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

**4. Component Tests**

`frontend/src/components/__tests__/OutputBox.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OutputBox from '../OutputBox'

describe('OutputBox', () => {
  it('renders messages correctly', () => {
    const messages = [
      { role: 'player', text: 'Hello world' },
      { role: 'ai', text: 'Hi there!' }
    ]

    render(<OutputBox story={messages} error={null} animationSpeed={0} theme="dark" />)

    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('displays error message when error prop is set', () => {
    render(<OutputBox story={[]} error="API Error" animationSpeed={0} theme="dark" />)

    expect(screen.getByText('API Error')).toBeInTheDocument()
  })
})
```

`frontend/src/components/__tests__/UserInput.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserInput from '../UserInput'

describe('UserInput', () => {
  it('calls onSubmit when form is submitted', async () => {
    const onSubmit = vi.fn()
    const setInput = vi.fn()

    render(
      <UserInput
        input="Test input"
        setInput={setInput}
        onSubmit={onSubmit}
        isLoading={false}
        theme="dark"
      />
    )

    const button = screen.getByRole('button')
    await userEvent.click(button)

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('disables submit when loading', () => {
    render(
      <UserInput
        input="Test"
        setInput={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={true}
        theme="dark"
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
```

**5. Integration Tests**

`frontend/src/__tests__/App.integration.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock fetch
global.fetch = vi.fn()

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends message and displays AI response', async () => {
    // Mock streaming response
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('Hello ')
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('<END>Hello there!')
        })
        .mockResolvedValueOnce({ done: true })
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      body: { getReader: () => mockReader }
    })

    render(<App />)

    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button', { name: /submit/i })

    await userEvent.type(input, 'Test message')
    await userEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Hello there!/)).toBeInTheDocument()
    })
  })
})
```

**6. Add Test Scripts**

`frontend/package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Part C: CI/CD Pipeline

**1. GitHub Actions Workflow**

`.github/workflows/test.yml`:
```yaml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'

    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt

    - name: Run tests
      run: |
        cd backend
        pytest --cov --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        cd frontend
        npm install

    - name: Run tests
      run: |
        cd frontend
        npm run test:coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./frontend/coverage/coverage-final.json
```

#### Testing Checklist

**Backend:**
- [ ] All model tests pass
- [ ] All route tests pass
- [ ] Health endpoint tested
- [ ] Conversation CRUD operations tested
- [ ] OpenAI integration mocked properly
- [ ] Error cases handled
- [ ] Code coverage > 80%

**Frontend:**
- [ ] All component tests pass
- [ ] User interactions tested
- [ ] API calls mocked
- [ ] Error states tested
- [ ] Theme switching tested
- [ ] Integration test for full flow
- [ ] Code coverage > 70%

**CI/CD:**
- [ ] GitHub Actions workflow configured
- [ ] Tests run on push/PR
- [ ] Coverage reports generated
- [ ] Build verification included

#### Success Criteria

✅ Backend test coverage > 80%
✅ Frontend test coverage > 70%
✅ All tests pass in CI/CD
✅ Tests run automatically on PR
✅ Easy to run tests locally
✅ Clear test documentation

---

### Task 3: Deploy to Production

**Priority:** 🔴 HIGH
**Estimated Effort:** 8-12 hours
**Dependencies:** Task 2 (Testing)
**Status:** Not Started

#### Objective
Deploy the application to production infrastructure with proper monitoring and scaling capabilities.

#### Current Situation
- Application only runs locally
- AWS Elastic Beanstalk config exists but not deployed
- No production database configured
- No monitoring or logging setup

#### Implementation Details

### Part A: Backend Deployment (AWS Elastic Beanstalk)

**1. Prepare Application for Deployment**

Create `backend/.ebextensions/01_flask.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:container:python:
    WSGIPath: application:application
  aws:elasticbeanstalk:application:environment:
    FLASK_ENV: production
    PYTHONPATH: /var/app/current
```

Update `backend/application.py`:
```python
from app import create_app
import os

# Create application instance for Elastic Beanstalk
application = create_app(os.getenv('FLASK_ENV', 'production'))

if __name__ == "__main__":
    application.run()
```

**2. Configure Environment Variables**

Required environment variables:
```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=your-secure-random-key
FLASK_ENV=production
```

**3. Set Up PostgreSQL Database**

Option A: AWS RDS
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier tsdne-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <secure-password> \
  --allocated-storage 20
```

Option B: Heroku Postgres
```bash
heroku addons:create heroku-postgresql:mini
heroku config:get DATABASE_URL
```

**4. Initialize Database**

Create migration script `backend/init_db.py`:
```python
from app import create_app
from database import db

app = create_app('production')
with app.app_context():
    db.create_all()
    print("Database tables created successfully!")
```

Run on production:
```bash
python init_db.py
```

**5. Deploy to Elastic Beanstalk**

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
cd backend
eb init -p python-3.10 tsdne-backend --region us-east-1

# Create environment
eb create tsdne-production \
  --instance-type t3.small \
  --envvars OPENAI_API_KEY=sk-...,DATABASE_URL=postgresql://...,SECRET_KEY=...

# Deploy updates
eb deploy

# View logs
eb logs

# Open in browser
eb open
```

**6. Configure Auto Scaling**

`.ebextensions/02_autoscaling.config`:
```yaml
option_settings:
  aws:autoscaling:asg:
    MinSize: 1
    MaxSize: 4
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    Unit: Percent
    UpperThreshold: 70
    LowerThreshold: 30
```

**7. Set Up Health Monitoring**

AWS CloudWatch alarms:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name tsdne-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ElasticBeanstalk \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Part B: Frontend Deployment (Vercel)

**1. Prepare Frontend for Deployment**

Update `frontend/.env.production`:
```bash
VITE_API_URL=https://your-eb-url.elasticbeanstalk.com
```

**2. Deploy to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Set production environment variable
vercel env add VITE_API_URL production
# Enter: https://your-eb-url.elasticbeanstalk.com

# Deploy to production
vercel --prod
```

**3. Configure Custom Domain (Optional)**

```bash
vercel domains add thisstorydoesnotexist.com
vercel domains add www.thisstorydoesnotexist.com
```

Update DNS:
```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

**4. Configure CORS on Backend**

Update `backend/app.py`:
```python
from flask_cors import CORS

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Configure CORS for production
    if config_name == 'production':
        CORS(app, origins=[
            'https://thisstorydoesnotexist.com',
            'https://www.thisstorydoesnotexist.com',
            'https://your-vercel-app.vercel.app'
        ])
    else:
        CORS(app)  # Allow all in development
```

### Part C: Monitoring & Logging

**1. Set Up Sentry for Error Tracking**

Backend:
```bash
pip install sentry-sdk[flask]
```

`backend/app.py`:
```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

def create_app(config_name='default'):
    if config_name == 'production':
        sentry_sdk.init(
            dsn="https://...@sentry.io/...",
            integrations=[FlaskIntegration()],
            traces_sample_rate=0.1
        )

    app = Flask(__name__)
    # ... rest of setup
```

Frontend:
```bash
npm install @sentry/react
```

`frontend/src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "https://...@sentry.io/...",
    integrations: [new Sentry.BrowserTracing()],
    tracesSampleRate: 0.1,
  });
}
```

**2. CloudWatch Logs**

Configure log streaming in `.ebextensions/03_logs.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:cloudwatch:logs:
    StreamLogs: true
    DeleteOnTerminate: false
    RetentionInDays: 7
```

**3. Uptime Monitoring**

Use UptimeRobot or AWS Route 53 health checks:
```bash
# Monitor /health endpoint every 5 minutes
# Alert via email/SMS if down
```

### Part D: Security Checklist

- [ ] HTTPS enabled (handled by EB/Vercel)
- [ ] Environment variables secured (not in code)
- [ ] Database credentials rotated
- [ ] CORS configured with specific origins
- [ ] Rate limiting implemented (consider Flask-Limiter)
- [ ] SQL injection protection (SQLAlchemy parameterized queries)
- [ ] XSS protection (React automatic escaping)
- [ ] Security headers configured
- [ ] API key rotation policy
- [ ] Regular dependency updates

#### Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Database backup strategy planned
- [ ] Rollback plan documented
- [ ] Monitoring tools configured

**Deployment:**
- [ ] PostgreSQL database created
- [ ] Database tables initialized
- [ ] Backend deployed to Elastic Beanstalk
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] Custom domain configured (if applicable)

**Post-Deployment:**
- [ ] Health endpoint returns 200
- [ ] Can create new story
- [ ] AI responses streaming correctly
- [ ] Conversations saving to database
- [ ] Error tracking working (test with Sentry)
- [ ] Logs accessible in CloudWatch
- [ ] Monitoring alerts configured
- [ ] Performance acceptable (<2s response time)

#### Success Criteria

✅ Application accessible via public URL
✅ Backend and frontend communicate correctly
✅ Database persisting data
✅ SSL/HTTPS enabled
✅ Error monitoring active
✅ Auto-scaling configured
✅ Logs accessible for debugging
✅ Uptime > 99.5%

---

## Medium Priority Tasks

### Task 4: User Authentication System

**Priority:** 🟡 MEDIUM
**Estimated Effort:** 20-24 hours
**Dependencies:** Task 1 (Conversation UI), Task 3 (Deployment)
**Status:** Not Started

#### Objective
Implement user registration, login, and session management to enable personalized story collections and user-specific data.

#### Current Situation
- All conversations are anonymous
- No user accounts
- No access control
- Anyone can view/delete any conversation

#### Implementation Details

### Part A: Backend Authentication

**1. Add User Model**

`backend/models.py`:
```python
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import secrets

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    conversations = db.relationship('Conversation', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Session(db.Model):
    __tablename__ = 'sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

    @staticmethod
    def generate_token():
        return secrets.token_urlsafe(32)
```

**2. Update Conversation Model**

```python
class Conversation(db.Model):
    __tablename__ = 'conversations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Nullable for backwards compat
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    messages = db.relationship('Message', backref='conversation', lazy=True)
```

**3. Add Authentication Routes**

`backend/routes.py`:
```python
from functools import wraps
from datetime import datetime, timedelta

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Authentication required'}), 401

        session = Session.query.filter_by(token=token).first()
        if not session or session.expires_at < datetime.utcnow():
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Add user to request context
        request.current_user = User.query.get(session.user_id)
        return f(*args, **kwargs)

    return decorated_function

@app.route("/auth/register", methods=["POST"])
def register():
    """Register new user"""
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Validation
    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409

    # Create user
    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Create session
    session = Session(
        user_id=user.id,
        token=Session.generate_token(),
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        'user': user.to_dict(),
        'token': session.token,
        'expires_at': session.expires_at.isoformat()
    }), 201

@app.route("/auth/login", methods=["POST"])
def login():
    """Login existing user"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Create session
    session = Session(
        user_id=user.id,
        token=Session.generate_token(),
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        'user': user.to_dict(),
        'token': session.token,
        'expires_at': session.expires_at.isoformat()
    })

@app.route("/auth/logout", methods=["POST"])
@require_auth
def logout():
    """Logout current user"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    session = Session.query.filter_by(token=token).first()
    if session:
        db.session.delete(session)
        db.session.commit()
    return jsonify({'message': 'Logged out successfully'})

@app.route("/auth/me", methods=["GET"])
@require_auth
def get_current_user():
    """Get current user info"""
    return jsonify(request.current_user.to_dict())
```

**4. Update Existing Routes**

```python
@app.route("/conversations", methods=["GET"])
@require_auth
def list_conversations():
    """List user's conversations"""
    conversations = Conversation.query.filter_by(
        user_id=request.current_user.id
    ).order_by(Conversation.created_at.desc()).all()
    # ... rest of implementation

@app.route("/generate", methods=["POST"])
@require_auth
def generate_response():
    """Generate AI story response"""
    # ... existing code

    # Associate conversation with user
    if not conversation_id:
        conversation = Conversation(user_id=request.current_user.id)
        db.session.add(conversation)
        db.session.commit()
```

### Part B: Frontend Authentication

**1. Create Auth Context**

`frontend/src/contexts/AuthContext.tsx`:
```typescript
import React, { createContext, useState, useContext, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    }
  };

  const login = async (username: string, password: string) => {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**2. Create Login/Register Components**

`frontend/src/components/LoginForm.tsx`:
```typescript
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      onSuccess();
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

**3. Update API Calls with Auth**

`frontend/src/App.tsx`:
```typescript
const sendMessage = async () => {
  const { token } = useAuth();

  const response = await fetch(`${apiUrl}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ input })
  });
  // ... rest of implementation
};
```

#### Testing Checklist

- [ ] User registration creates account
- [ ] Login returns valid token
- [ ] Token expires after 30 days
- [ ] Protected routes require authentication
- [ ] Users only see their own conversations
- [ ] Logout invalidates session
- [ ] Password validation works
- [ ] Duplicate username/email prevented
- [ ] Auth context persists on page reload
- [ ] Token stored securely (httpOnly cookies in production)

#### Success Criteria

✅ Users can create accounts
✅ Users can log in/out
✅ Sessions persist across page reloads
✅ Users only access their own data
✅ Passwords securely hashed
✅ Token-based authentication working

---

### Task 5: AI Conversation Summarization

**Priority:** 🟡 MEDIUM
**Estimated Effort:** 12-16 hours
**Dependencies:** None
**Status:** Not Started

#### Objective
Implement automatic summarization of long conversations to maintain AI context without hitting token limits.

#### Current Situation
- Conversation history includes last 10 messages
- Long conversations (>10 messages) lose early context
- May hit OpenAI token limits with very long conversations
- No summary mechanism

#### Implementation Details

**1. Add Summary Field to Conversation Model**

`backend/models.py`:
```python
class Conversation(db.Model):
    __tablename__ = 'conversations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    summary = db.Column(db.Text, nullable=True)  # NEW
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    messages = db.relationship('Message', backref='conversation', lazy=True)
```

**2. Create Summarization Function**

`backend/routes.py`:
```python
def summarize_conversation(conversation_id):
    """Generate summary of conversation history"""
    messages = Message.query.filter_by(
        conversation_id=conversation_id
    ).order_by(Message.created_at).all()

    # Only summarize if more than 20 messages
    if len(messages) < 20:
        return None

    # Get messages to summarize (exclude last 10)
    messages_to_summarize = messages[:-10]

    # Build conversation text
    conversation_text = "\n".join([
        f"{'Player' if msg.role == 'player' else 'AI'}: {msg.text}"
        for msg in messages_to_summarize
    ])

    # Generate summary with OpenAI
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{
            "role": "system",
            "content": "Summarize the following story conversation, preserving key plot points, character details, and world-building elements. Be concise but comprehensive."
        }, {
            "role": "user",
            "content": conversation_text
        }],
        max_tokens=500
    )

    return response.choices[0].message.content

def construct_system_prompt(conversation_id=None):
    """Construct system prompt with summary and recent messages"""
    prompt = SYSTEM_PROMPT_BASE

    if conversation_id:
        conversation = Conversation.query.get(conversation_id)

        # Include summary if it exists
        if conversation and conversation.summary:
            prompt += f"\n\nPrevious story summary:\n{conversation.summary}\n"

        # Get recent messages (last 10)
        messages = Message.query.filter_by(
            conversation_id=conversation_id
        ).order_by(Message.created_at.desc()).limit(10).all()

        if messages:
            prompt += "\n\nRecent conversation:\n"
            for msg in reversed(messages):
                role = "Player" if msg.role == "player" else "AI"
                prompt += f"{role}: {msg.text[:100]}...\n"

    return prompt
```

**3. Auto-Summarize on Message Threshold**

```python
@app.route("/generate", methods=["POST"])
def generate_response():
    # ... existing code

    # After saving AI message
    ai_message = Message(
        conversation_id=conversation.id,
        role="ai",
        text=full_text
    )
    db.session.add(ai_message)
    db.session.commit()

    # Auto-summarize if needed
    message_count = len(conversation.messages)
    if message_count >= 20 and message_count % 10 == 0:
        # Summarize in background to avoid blocking
        summary = summarize_conversation(conversation.id)
        if summary:
            conversation.summary = summary
            db.session.commit()
```

**4. Add Manual Summarization Endpoint**

```python
@app.route("/conversations/<int:conversation_id>/summarize", methods=["POST"])
@require_auth
def manual_summarize(conversation_id):
    """Manually trigger conversation summarization"""
    conversation = Conversation.query.get(conversation_id)
    if not conversation:
        return jsonify({'error': 'Conversation not found'}), 404

    if conversation.user_id != request.current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    summary = summarize_conversation(conversation_id)
    conversation.summary = summary
    db.session.commit()

    return jsonify({'summary': summary})
```

**5. Display Summary in Frontend**

`frontend/src/components/ConversationDetails.tsx`:
```typescript
const ConversationDetails = ({ conversationId }: { conversationId: number }) => {
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  const fetchConversation = async () => {
    const response = await fetch(`${apiUrl}/conversations/${conversationId}`);
    const data = await response.json();
    setSummary(data.summary);
  };

  return (
    <div>
      {summary && (
        <div className="bg-gray-800 p-4 rounded mb-4">
          <h3 className="font-bold">Story Summary</h3>
          <p className="text-sm text-gray-300">{summary}</p>
        </div>
      )}
      {/* Rest of conversation */}
    </div>
  );
};
```

#### Success Criteria

✅ Long conversations automatically summarized
✅ Summary preserves key plot points
✅ Recent messages still included in context
✅ Token limits not exceeded
✅ Summary visible in UI
✅ Manual summarization available

---

### Task 6: Story Templates & Genres

**Priority:** 🟢 LOW
**Estimated Effort:** 8-12 hours
**Dependencies:** None
**Status:** Not Started

#### Objective
Allow users to start stories with predefined templates and genre-specific prompts.

#### Implementation Details

**1. Create Genre Templates**

`backend/templates.py`:
```python
STORY_TEMPLATES = {
    'fantasy': {
        'name': 'Fantasy Adventure',
        'system_prompt_addition': """
        This is a fantasy story with magic, mythical creatures, and epic quests.
        Include elements like: wizards, dragons, enchanted items, medieval settings.
        """,
        'starter_prompts': [
            "You wake up in a wizard's tower with no memory of how you got there.",
            "A dragon lands before you, speaking in a surprisingly gentle voice.",
            "You discover an ancient sword glowing with magical energy."
        ]
    },
    'scifi': {
        'name': 'Science Fiction',
        'system_prompt_addition': """
        This is a science fiction story with advanced technology and space exploration.
        Include elements like: spaceships, AI, alien worlds, future technology.
        """,
        'starter_prompts': [
            "Your spaceship's AI has just detected an uncharted planet.",
            "You wake from cryosleep 200 years after leaving Earth.",
            "An alien transmission appears on your communication system."
        ]
    },
    'mystery': {
        'name': 'Mystery/Detective',
        'system_prompt_addition': """
        This is a mystery story with clues, suspects, and investigations.
        Include elements like: crime scenes, red herrings, plot twists, detective work.
        """,
        'starter_prompts': [
            "You arrive at a mansion where a priceless artifact has been stolen.",
            "A mysterious letter arrives with a cryptic message and a key.",
            "You witness something suspicious in the middle of the night."
        ]
    },
    'horror': {
        'name': 'Horror',
        'system_prompt_addition': """
        This is a horror story with suspense, fear, and the supernatural.
        Include elements like: eerie atmosphere, psychological tension, unknown threats.
        """,
        'starter_prompts': [
            "You hear scratching sounds coming from inside the walls.",
            "The old house you just inherited has a locked room in the basement.",
            "Everyone in town warned you not to go into the forest at night."
        ]
    },
    'custom': {
        'name': 'Custom Story',
        'system_prompt_addition': '',
        'starter_prompts': []
    }
}
```

**2. Add Genre Selection to UI**

`frontend/src/components/GenreSelector.tsx`:
```typescript
const genres = [
  { id: 'fantasy', name: 'Fantasy Adventure', icon: '🐉' },
  { id: 'scifi', name: 'Science Fiction', icon: '🚀' },
  { id: 'mystery', name: 'Mystery', icon: '🔍' },
  { id: 'horror', name: 'Horror', icon: '👻' },
  { id: 'custom', name: 'Custom', icon: '✨' }
];

export default function GenreSelector({ onSelect }: { onSelect: (genre: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {genres.map(genre => (
        <button
          key={genre.id}
          onClick={() => onSelect(genre.id)}
          className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700"
        >
          <div className="text-4xl mb-2">{genre.icon}</div>
          <div className="font-bold">{genre.name}</div>
        </button>
      ))}
    </div>
  );
}
```

**3. Update Backend to Accept Genre**

```python
@app.route("/generate", methods=["POST"])
def generate_response():
    data = request.get_json()
    user_input = data.get("input", "")
    conversation_id = data.get("conversation_id")
    genre = data.get("genre", "custom")  # NEW

    # Construct prompt with genre
    system_prompt = construct_system_prompt(conversation.id, genre)
    # ... rest of implementation

def construct_system_prompt(conversation_id=None, genre='custom'):
    prompt = SYSTEM_PROMPT_BASE

    # Add genre-specific prompt
    if genre in STORY_TEMPLATES:
        prompt += STORY_TEMPLATES[genre]['system_prompt_addition']

    # ... rest of existing logic
    return prompt
```

#### Success Criteria

✅ Users can select story genre
✅ Genre affects AI responses appropriately
✅ Starter prompts available per genre
✅ UI displays genre options clearly

---

### Task 7: Error Monitoring with Sentry

**Priority:** 🟢 LOW
**Estimated Effort:** 4-6 hours
**Dependencies:** Task 3 (Deployment)
**Status:** Not Started

#### Objective
Implement comprehensive error tracking and monitoring using Sentry.

#### Implementation Details

Already covered in Task 3, Part C. Additional considerations:

**1. Custom Error Contexts**

```python
import sentry_sdk

# Add user context to errors
@app.before_request
def add_sentry_context():
    if hasattr(request, 'current_user'):
        sentry_sdk.set_user({
            "id": request.current_user.id,
            "username": request.current_user.username
        })
```

**2. Performance Monitoring**

```python
# Track slow database queries
@app.before_request
def start_timer():
    g.start_time = time.time()

@app.after_request
def log_slow_requests(response):
    if hasattr(g, 'start_time'):
        elapsed = time.time() - g.start_time
        if elapsed > 2.0:  # Log requests over 2 seconds
            sentry_sdk.capture_message(
                f"Slow request: {request.path} took {elapsed:.2f}s",
                level="warning"
            )
    return response
```

**3. Custom Error Pages**

```typescript
// Frontend error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage />;
    }
    return this.props.children;
  }
}
```

#### Success Criteria

✅ All errors reported to Sentry
✅ User context included in error reports
✅ Performance tracking enabled
✅ Error notifications configured
✅ Source maps uploaded for debugging

---

## Task Summary

| Task | Priority | Effort | Dependencies | Impact |
|------|----------|--------|--------------|--------|
| 1. Conversation UI | 🔴 HIGH | 12-16h | None | High - Core UX feature |
| 2. Testing | 🔴 HIGH | 16-20h | None | High - Quality & confidence |
| 3. Deployment | 🔴 HIGH | 8-12h | Task 2 | High - Production readiness |
| 4. Authentication | 🟡 MEDIUM | 20-24h | Tasks 1, 3 | Medium - Personalization |
| 5. Summarization | 🟡 MEDIUM | 12-16h | None | Medium - Better AI context |
| 6. Templates | 🟢 LOW | 8-12h | None | Low - Nice to have |
| 7. Monitoring | 🟢 LOW | 4-6h | Task 3 | Low - Already basic monitoring |

**Total Estimated Effort:** 80-100 hours

---

## Recommended Execution Order

### Phase 1: Foundation (Weeks 1-2)
1. Task 1: Conversation UI
2. Task 2: Testing Infrastructure

### Phase 2: Production (Weeks 3-4)
3. Task 3: Deploy to Production
4. Task 7: Error Monitoring

### Phase 3: Enhancement (Weeks 5-7)
5. Task 4: User Authentication
6. Task 5: AI Summarization

### Phase 4: Polish (Week 8)
7. Task 6: Story Templates

---

## Success Metrics

**Phase 1 Complete:**
- Users can manage conversations
- 80%+ test coverage
- CI/CD running

**Phase 2 Complete:**
- Application live in production
- Monitoring active
- Uptime > 99%

**Phase 3 Complete:**
- User accounts functional
- Long conversations handled well
- Active user retention improving

**Phase 4 Complete:**
- Multiple story types available
- User engagement increasing
- Feature complete

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API costs | High | Set usage limits, cache responses |
| Database scaling | Medium | Use connection pooling, add indexes |
| Security vulnerabilities | High | Regular security audits, dependency updates |
| User data loss | High | Regular backups, tested restore process |
| Performance degradation | Medium | Load testing, auto-scaling configured |

---

## Maintenance Considerations

**Weekly:**
- Review error logs in Sentry
- Check database performance
- Monitor API usage costs

**Monthly:**
- Update dependencies
- Review and optimize database queries
- Analyze user feedback
- Security audit

**Quarterly:**
- Major version updates
- Performance optimization
- Feature roadmap review
- Backup/restore testing
