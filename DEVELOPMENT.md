# Development Guide

This guide provides detailed information for developers working on "This Story Does Not Exist".

## 📁 Project Structure

```
tsdne_v1/
├── backend/
│   ├── .ebextensions/         # AWS Elastic Beanstalk configuration
│   ├── venv/                   # Python virtual environment (not in git)
│   ├── app.py                  # Application entry point
│   ├── config.py               # Configuration management
│   ├── database.py             # Database initialization
│   ├── models.py               # SQLAlchemy database models
│   ├── routes.py               # API route handlers
│   ├── application.py          # AWS EB entry point
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Title.tsx
│   │   │   ├── OutputBox.tsx
│   │   │   ├── UserInput.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── App.tsx             # Main application component
│   │   └── main.tsx            # Application entry point
│   ├── public/                 # Static assets
│   ├── index.html              # HTML template
│   ├── package.json            # Node dependencies
│   ├── vite.config.ts          # Vite configuration
│   └── .env.example            # Environment variables template
│
└── README.md                   # Project documentation
```

## 🔧 Backend Architecture

### Application Factory Pattern
The backend uses the Flask application factory pattern for better modularity and testing:

```python
# app.py
from flask import Flask
from config import config
from database import db
from routes import register_routes

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    db.init_app(app)
    register_routes(app)
    return app
```

### Database Models

**Conversation**: Stores conversation sessions
- `id`: Primary key
- `created_at`: Timestamp
- `updated_at`: Timestamp (auto-updated)
- `messages`: Relationship to Message model

**Message**: Stores individual messages in a conversation
- `id`: Primary key
- `conversation_id`: Foreign key to Conversation
- `role`: 'player' or 'ai'
- `text`: Message content
- `created_at`: Timestamp

### API Routes

1. **POST /generate**
   - Generates AI story response
   - Accepts: `{ "input": string, "conversation_id": number (optional) }`
   - Returns: Streaming text response
   - Creates new conversation if conversation_id not provided

2. **GET /health**
   - Health check endpoint
   - Returns: `{ "status": "healthy" }`

3. **GET /conversations**
   - Lists all conversations
   - Returns: Array of conversation summaries

4. **GET /conversations/<id>**
   - Gets specific conversation with all messages
   - Returns: Conversation object with messages array

### AI Prompt System

The AI storyteller uses a structured prompt with:
- Base instructions for narrative style
- Conversation history (last 10 messages)
- Current user input

This ensures continuity and context awareness across the story.

## 🎨 Frontend Architecture

### Component Structure

- **App.tsx**: Main application container, manages state and API calls
- **Title.tsx**: Header with app title
- **OutputBox.tsx**: Displays conversation history
- **UserInput.tsx**: Text input for user responses
- **Footer.tsx**: Footer with social links
- **SettingsPanel.tsx**: User preferences (theme, font size, etc.)

### State Management

Currently uses React hooks (useState) for:
- Messages array
- Loading states
- Error handling
- User settings (theme, font size, animation speed)

### Streaming Response Handling

The frontend uses the Fetch API with ReadableStream to display AI responses in real-time:

```typescript
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (!isComplete) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Update UI with new chunk
}
```

## 🚀 Development Workflow

### Backend Development

1. **Activate virtual environment**:
   ```bash
   cd backend
   source venv/bin/activate  # Mac/Linux
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run development server**:
   ```bash
   python app.py
   ```

4. **Database migrations** (if needed):
   ```python
   from app import create_app, db
   app = create_app()
   with app.app_context():
       db.create_all()
   ```

### Frontend Development

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Lint code**:
   ```bash
   npm run lint
   ```

## 🧪 Testing

### Backend Testing
(To be implemented)
```bash
pytest tests/
```

### Frontend Testing
(To be implemented)
```bash
npm test
```

## 🐛 Common Issues and Solutions

### Issue: Flask-SQLAlchemy import errors
**Solution**: Make sure Flask-SQLAlchemy is installed:
```bash
pip install Flask-SQLAlchemy==3.1.1
```

### Issue: CORS errors in frontend
**Solution**: Ensure Flask-CORS is properly configured in app.py and the backend is running.

### Issue: OpenAI API errors
**Solution**: 
1. Check that OPENAI_API_KEY is set in .env
2. Verify API key is valid
3. Check API quota/billing

### Issue: Database not created
**Solution**: 
```python
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

## 📝 Code Style Guidelines

### Python (Backend)
- Follow PEP 8
- Use type hints where appropriate
- Document functions with docstrings
- Keep functions small and focused

### TypeScript (Frontend)
- Use TypeScript strict mode
- Define interfaces for all data structures
- Use functional components with hooks
- Follow React best practices

## 🔐 Security Considerations

1. **Never commit .env files** - Use .env.example templates
2. **Rotate API keys regularly**
3. **Validate user input** on both frontend and backend
4. **Use environment-specific configs** for development/production
5. **Keep dependencies updated** to patch security vulnerabilities

## 🚀 Deployment

### Backend (AWS Elastic Beanstalk)
1. Ensure application.py exists for EB
2. Configure .ebextensions for Python environment
3. Set environment variables in EB console
4. Deploy: `eb deploy`

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Configure environment variables in Vercel dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
