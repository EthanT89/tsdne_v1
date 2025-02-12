# 📝 This Story Does Not Exist

**An AI-powered interactive storytelling experience where the story is shaped by your choices.**

## 🚀 About the Project

This is a dynamic, text-based adventure game where AI generates a unique narrative based on user input. The game evolves in real-time, ensuring every playthrough is different.

## 🛠 Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Flask + OpenAI API + PostgreSQL
- **Infrastructure**: AWS / Vercel (for deployment)

## 🎮 Features

- AI-generated narratives that adapt to player choices
- Persistent game state tracking using PostgreSQL
- Clean, immersive UI with Tailwind CSS
- Fast development and performance with Vite

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

## 🔧 Installation & Setup

### **1️⃣ Clone the Repository**

```bash
 git clone https://github.com/your-username/this-story-does-not-exist.git
 cd this-story-does-not-exist
```

### **2️⃣ Set Up the Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

- Set up your **.env** file with `OPENAI_API_KEY` and database credentials.
- Start the Flask server:

```bash
python app.py
```

### **3️⃣ Set Up the Frontend**

```bash
cd frontend
npm install
npm run dev
```

- Open `http://localhost:5173` in your browser.

## 🛠 Roadmap

- [ ] Expand AI context retention
- [ ] Multiplayer mode (optional)
- [ ] Save & load player progress
- [ ] Theming & UI improvements

## 📜 License

This project is licensed under the MIT License.

## 🙌 Contributing

Interested in contributing? Feel free to open an issue or submit a pull request!

## 📬 Contact

**Ethan Thornberg** – [LinkedIn](https://www.linkedin.com/in/ethan-thornberg/) – [GitHub](https://github.com/EthanT89)
