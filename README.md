# 📘 BYTECODER — Question Paper Generator

Professional question paper generator with elegant UI, theme control, AI assistance, and integrated video solutions.

---

## 🚀 Live Demo

👉 https://bytecoder-qpg.vercel.app/

---

## ✨ Features

* 🧠 AI-based question generation (OpenAI / Gemini / Local fallback)
* 🎨 Clean professional UI with theme selector
* 📄 Automatic paper formatting (MCQ / Short / Long)
* 🖨️ Print-ready layout with watermark option
* 📥 Export as standalone HTML
* 🎬 Video Solutions with YouTube integration
* ⚡ Lightweight — Pure Vanilla JS (no heavy frameworks)

---

## 🖼️ Screenshots

### 🏠 Homepage

![Homepage](docs/home.png)

---

### 📝 Paper Setup Form

![Form](docs/form.png)

---

### 📄 Generated Question Paper

![Paper](docs/paper.png)

---

### 🖨️ Print Preview

![Print](docs/print.png)

---

### 🎬 Video Solutions Page

![Video](docs/video.png)

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JS (ES6+)
* **Server:** Node.js (no frameworks)
* **APIs:** OpenAI / Gemini / YouTube Data API
* **Deployment:** Vercel
* **Version Control:** Git & GitHub

---

## 📂 Project Structure

```
BYTECODER.QUESTION-PAPER-GENRATOR/
├── frontend/
│   ├── index.html
│   ├── video.html
│   ├── css/
│   ├── js/
│   ├── ai/
│   └── .env.example
├── tests/
├── README.md
└── docs/ (screenshots)
```

---

## ⚙️ Environment Variables

Create `.env` (local) or set on Vercel:

```
PORT=3000
PROVIDER=gemini        # openai | gemini | local
OPENAI_API_KEY=...
GEMINI_API_KEY=...
YOUTUBE_API_KEY=...
```

---

## ▶️ Run Locally

### Windows PowerShell

```
$env:PROVIDER='gemini'
$env:GEMINI_API_KEY='YOUR_KEY'
$env:PORT=3000
npm run dev
```

Open:

```
http://127.0.0.1:3000/
```

---

## 🧪 API Endpoints

### Generate Paper

```
POST /api/generate
```

### Video Search

```
GET /api/videos?q=topic
```

### Health Check

```
GET /health
```

---

## 🎬 Video Solutions

* Keyword search
* Language filter
* Channel filter
* Embedded YouTube player
* Suggested keywords from paper

Access:

```
/video.html
```

---

## 🚀 Deploy on Vercel

1. Push repo to GitHub
2. Import project in Vercel
3. Add Environment Variables
4. Deploy

Routes:

* `/` → Homepage
* `/video.html` → Video solutions
* `/api/generate` → Generate API
* `/api/videos` → YouTube API

---

## 👨‍💻 Team ByteCoder

**Team Name:** BYTECODER

Professional AI-powered academic tools for students and educators.

---

⭐ If you like this project, give it a star on GitHub!


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

###


   live deploye link"https://bytecoder-qpg.vercel.app/"

###


   
