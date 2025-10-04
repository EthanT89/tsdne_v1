# Quick Start Guide

Get "This Story Does Not Exist" running in 5 minutes!

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ installed  
- A Claude API key ([Get one here](https://console.anthropic.com/))

## Step-by-Step Setup

### 1. Clone and Navigate

```bash
git clone https://github.com/EthanT89/tsdne_v1.git
cd tsdne_v1
```

### 2. Backend Setup (Terminal 1)

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your Claude API key
# ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

**Quick .env setup:**
```bash
echo "ANTHROPIC_API_KEY=your-key-here" > .env
echo "DATABASE_URL=sqlite:///tsdne.db" >> .env
echo "FLASK_ENV=development" >> .env
```

**Start the backend:**
```bash
python app.py
```

You should see: `Running on http://127.0.0.1:5000`

### 3. Frontend Setup (Terminal 2)

Open a new terminal:

```bash
cd frontend

# Install Node dependencies
npm install

# Optional: Configure backend URL
cp .env.example .env

# Start the frontend
npm run dev
```

You should see: `Local: http://localhost:5173/`

### 4. Open the App

Navigate to **http://localhost:5173** in your browser!

## Quick Test

To verify everything works:

1. **Backend health check:**
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"healthy"}`

2. **Frontend:** Visit http://localhost:5173 and start a story!

## Common Issues

### "Module not found" errors
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend  
cd frontend
npm install
```

### "Claude API error"
- Check your API key in `backend/.env`
- Verify the key is valid at https://console.anthropic.com/
- Ensure you have credits available

### Port already in use
```bash
# Backend (change port in app.py)
# Frontend (Vite will auto-suggest an alternative port)
```

## Next Steps

- Read [DEVELOPMENT.md](DEVELOPMENT.md) for detailed architecture info
- See [README.md](README.md) for project overview
- Check the roadmap for upcoming features

## Production Deployment

For production deployment:
- Use a production WSGI server (gunicorn) for Flask
- Build the frontend: `npm run build`
- Use PostgreSQL instead of SQLite
- Set proper environment variables
- See DEVELOPMENT.md for deployment details

Enjoy creating infinite stories! 🚀✨
