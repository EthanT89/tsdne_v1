# 📝 This Story Does Not Exist

**An AI-powered interactive storytelling experience where the story is shaped by your choices.**

## 🚀 About the Project

This is a dynamic, text-based adventure game where AI generates a unique narrative based on user input. The game evolves in real-time, ensuring every playthrough is different.

## 🛠 Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Flask + OpenAI API + Flask-SQLAlchemy
- **Database**: PostgreSQL (production) / SQLite (development)
- **Infrastructure**: AWS Elastic Beanstalk / Vercel (for deployment)

## 🎮 Features

- AI-generated narratives that adapt to player choices
- Persistent game state tracking using PostgreSQL/SQLite
- Conversation history context for coherent storytelling
- Clean, immersive UI with Tailwind CSS
- Fast development and performance with Vite
- Modular backend architecture with Flask
- RESTful API for conversation management
- Dark/Light theme support

## 📂 Project Structure

```
this-story-does-not-exist/
├── backend/             # Flask API for AI processing
├── frontend/            # Vite + React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Game pages and routing
│   │   ├── styles/      # Tailwind CSS styles
├── database/            # PostgreSQL setup
├── README.md            # Project documentation
```

## 🚀 Quick Start

**Want to get started quickly?** See the [QUICKSTART.md](QUICKSTART.md) guide!

## 🔧 Installation & Setup

### **Prerequisites**
- Python 3.8+ 
- Node.js 16+
- OpenAI API Key

### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/EthanT89/tsdne_v1.git
cd tsdne_v1
```

### **2️⃣ Set Up the Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

- Copy the `.env.example` file to `.env` and add your credentials:

```bash
cp .env.example .env
```

- Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your-actual-api-key-here
DATABASE_URL=sqlite:///tsdne.db
FLASK_ENV=development
```

- Start the Flask server:

```bash
python app.py
```

The backend will run on `http://localhost:5000`

### **3️⃣ Set Up the Frontend**

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env  # Optional: customize backend URL
npm run dev
```

- Open `http://localhost:5173` in your browser.

## 🎯 API Endpoints

- `POST /generate` - Generate AI story response
- `GET /health` - Health check
- `GET /conversations` - List all conversations
- `GET /conversations/<id>` - Get specific conversation with messages

## 🛠 Roadmap

### Completed ✅
- [x] Core AI storytelling engine
- [x] Conversation history and context
- [x] Database persistence
- [x] RESTful API
- [x] Modular backend architecture
- [x] Dark/Light theme support

### In Progress 🚧
- [ ] Frontend conversation management UI
- [ ] Save & load player progress in UI

### Future Features 🔮
- [ ] Advanced AI context retention with summarization
- [ ] User authentication
- [ ] Multiplayer mode (optional)
- [ ] Story sharing and templates
- [ ] Advanced theming & UI improvements
- [ ] Mobile app version

## 📜 License

This project is licensed under the MIT License.

## 🙌 Contributing

Interested in contributing? Feel free to open an issue or submit a pull request!

## 📬 Contact

**Ethan Thornberg** – [LinkedIn](https://www.linkedin.com/in/ethan-thornberg/) – [GitHub](https://github.com/EthanT89)
