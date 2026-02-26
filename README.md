# BYTECODER.QUESTION-PAPER-GENRATOR
# TEAM NAME = BYTECODER 
# QUESTION PAPER GENRATOR 
# PS * **Clean UI:** Simple aur user-friendly interface.
* **Lightweight:** No heavy frameworks, pure Vanilla JS.

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3
* **Logic:** JavaScript (ES6+)
* **Version Control:** Git & GitHub

## 📂 Project Structure
```text
 BYTECODER.QUESTION-PAPER-GENRATOR/
├── index.html       # Main application file
├── README.md        # Project documentation
└── assets/          # Images or extra CSS/JS (optional)
 
---

# Question Paper Generator — ByteCoder

Professional question paper generator with elegant UI, theme control, AI assistance, and integrated video solutions.

## ✨ Features
* Clean, professional UI with theme selector (Cream/Green/Red, Navy/Blue, Gray/Minimal)
* Form inputs: Institute, Title, Duration, Subject, Difficulty, Count, Types (MCQ/Short/Long)
* Optional meta: Board, Book, Chapter, Specific Topic, Additional Instructions
* Distribution control: MCQ/Short/Long counts (e.g., 4/4/4)
* Print with watermark overlay; export as standalone HTML
* AI providers via env: OpenAI, Gemini; local fallback always works
* Video Solutions page: YouTube embed + curated results via YouTube Data API

## 🛠 Tech Stack
* Frontend: HTML5, CSS3, Vanilla JS (ES Modules)
* Server: Node.js (http/https, no frameworks)

## 📦 Project Structure
```text
BYTECODER.QUESTION-PAPER-GENRATOR/
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js, ui.js, generator.js, print.js, validation.js
│   ├── ai/aiserver.js
│   ├── video.html
│   ├── js/video.js
│   └── .env.example
├── tests/sampleInput.json
└── README.md
```

## ⚙️ Environment
Server loads env from `frontend/.env` (or OS env).

Copy and edit:
```
cp frontend/.env.example frontend/.env
```
Then set:
```
PORT=3000
PROVIDER=gemini            # openai | gemini | local
OPENAI_API_KEY=...         # if PROVIDER=openai
GEMINI_API_KEY=...         # if PROVIDER=gemini
YOUTUBE_API_KEY=...        # to enable /api/videos on video.html
```

## ▶️ Run (Dev)
PowerShell:
```
$env:PROVIDER='gemini'; $env:GEMINI_API_KEY='YOUR_KEY'; $env:PORT=3000; npm run dev
```
Open:
```
http://127.0.0.1:3000/
```
Health:
```
http://127.0.0.1:3000/health
```

## 🚀 Deploy
1. Create `frontend/.env` with production keys (see example)
2. Start server:
```
npm start
```
3. Behind reverse proxy (optional): point to `http://<host>:<PORT>/`

## 🧭 Video Solutions
* Page: `/video.html`
* Keyword + Language + Channel filters
* Suggested chips auto-populated from last generated paper
* Results grid; click card to play in embedded player

## 🧪 API
Generate:
```
POST /api/generate
Body: { subject, difficulty, count, types, title, institute, duration, instructions, marks, distribution, board, book, chapter, topic, addlInstructions }
```
Health:
```
GET /health
```
Videos:
```
GET /api/videos?q=...&lang=...&channel=...&max=10
```

## ✅ Notes
* Do not commit real API keys; use `.env` locally
* If PORT 3000 busy, server auto-falls back to next ports
* Print hides controls and keeps paper layout clean

## 🌐 Vercel Deploy
1. Push repo to GitHub
2. Import project in Vercel
3. Add Environment Variables (Production/Preview/Development):
   - PORT (optional, usually not needed on Vercel)
   - PROVIDER
   - OPENAI_API_KEY (if using OpenAI)
   - GEMINI_API_KEY (if using Gemini)
   - YOUTUBE_API_KEY
4. Ensure vercel.json is present (static rewrites to frontend/)
5. Deploy; open:
   - `/` → frontend homepage
   - `/video.html` → solutions page
   - `/api/generate`, `/api/videos` → serverless API
