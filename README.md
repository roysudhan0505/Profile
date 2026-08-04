# 🚀 Roys Sudhan B | AI & Machine Learning Engineer Portfolio

A modern, responsive, and interactive personal portfolio website showcasing my journey as an **Artificial Intelligence & Machine Learning Engineer**, Android Developer, and Generative AI Enthusiast.

![Portfolio Banner](assets/profile.png)

---

# 🌐 Live Demo

Coming Soon

> https://your-vercel-url.vercel.app

---

# 👨‍💻 About

Hi, I'm **Roys Sudhan B**, a Final Year Artificial Intelligence & Machine Learning Engineering student from **MVJ College of Engineering, Bengaluru**.

I enjoy building intelligent software using Artificial Intelligence, Machine Learning, Computer Vision, Android Development, and Generative AI.

This portfolio highlights my:

- Education
- Technical Skills
- Internship Experience
- AI Projects
- Certifications
- Resume
- Contact Information

---

# ✨ Features

- 🎨 Modern AI Inspired UI
- 🌙 Dark Theme
- 📱 Fully Responsive
- ⚡ Smooth Scrolling
- 🎯 Animated Sections
- 💻 Project Showcase
- 🏆 Certifications
- 📄 Resume Download
- 📬 Contact Form
- 📊 Google Sheets Backend
- 🚀 Hosted on Vercel
- ❤️ Clean UI Design

---

# 🛠 Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript (ES6)

## Backend

- Google Apps Script
- Google Sheets

## Deployment

- GitHub
- Vercel

---

# 📂 Folder Structure

```text
Roy-Portfolio/

│
├── index.html
├── style.css
├── script.js
├── package.json
├── vercel.json
├── .env.example
├── README.md
├── .gitignore
│
├── api/
│   └── contact.js          # Vercel serverless function (form → Google Sheets proxy)
│
├── google-apps-script/
│   └── Code.gs              # paste into script.google.com — not deployed by Vercel
│
└── assets/
    ├── profile.png
    ├── resume.pdf
    ├── projects/
    ├── gallery/
    ├── certificates/
    └── icons/
```

---

# 🚀 Featured Projects

## 🏛 VIRASAT – NAMMA GUIDE

GenAI Powered Smart Heritage Tourism Android Application.

### Technologies

- Kotlin
- Jetpack Compose
- MVVM
- Firebase
- Google AI Studio
- REST API

---

## 🩸 Blood Group Determination Using Fingerprint

AI-powered image processing project for non-invasive blood group prediction.

### Technologies

- Python
- OpenCV
- Machine Learning
- Image Processing

---

# 💼 Internship

**Android App Development Using Generative AI**

MindMatrix

- Kotlin
- Jetpack Compose
- Firebase
- Room Database
- MVVM
- Google AI Studio

---

# 🏆 Certifications

- Google Cloud
- Salesforce Trailhead
- Infosys Springboard
- NPTEL
- MindMatrix Internship

---

# 📄 Resume

Download my latest resume directly from the portfolio.

---

# 📬 Contact

**Roy Sudhan B**

📧 roysudhan0505@gmail.com

📍 Bengaluru, Karnataka

---

# 🌍 Social Links

GitHub

> Add your GitHub profile here

LinkedIn

> Add your LinkedIn profile here

Instagram

> Optional

---

# 🚀 Run Locally

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Roy-Portfolio.git
```

Open the folder

```bash
cd Roy-Portfolio
```

Opening `index.html` directly works for browsing the site, but the contact form's `/api/contact` route only works when served by Vercel. Run `vercel dev` (see the **Contact Form Backend** section below) to test the form locally, or deploy directly to Vercel.

---

# ☁ Deployment

1. Upload this repository to GitHub.
2. Connect the repository to Vercel.
3. Click **Deploy**.
4. Your portfolio will be live.

---

# 📧 Contact Form Backend

Flow: **Browser → `/api/contact` (Vercel serverless function) → Google Apps Script → Google Sheet**

The browser never talks to Google directly — this avoids CORS issues and keeps the Apps Script URL out of the shipped frontend code. The API route also does server-side validation, a honeypot spam check, an origin check, and a 10s timeout before forwarding to Apps Script.

## 1. Set up the Google Apps Script

1. Open the Google Sheet you want submissions stored in (or create a new one).
2. `Extensions > Apps Script`.
3. Delete the starter code and paste in the contents of [`google-apps-script/Code.gs`](google-apps-script/Code.gs) from this repo.
4. `Deploy > New deployment > type: Web app`.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the generated URL (ends in `/exec`) — this is `GOOGLE_SCRIPT_URL`.
6. Any time you edit the script, you must create a new deployment/version for the change to take effect.

## 2. Environment Variables

Set these in **Vercel → Project → Settings → Environment Variables** (see `.env.example` for local dev):

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_SCRIPT_URL` | ✅ Yes | The Apps Script Web App URL from step 1 above. |
| `ALLOWED_ORIGIN` | Recommended | Your production URL, e.g. `https://your-portfolio.vercel.app`. Requests to `/api/contact` from other origins are rejected. Localhost and the current Vercel deployment's own URL are always allowed automatically. |

## 3. Local development

```bash
npm install -g vercel   # if you don't already have the CLI
cp .env.example .env    # fill in GOOGLE_SCRIPT_URL
vercel dev
```

---

# 📜 License

This project is licensed under the MIT License.

---

# ⭐ If you like this project

Please consider giving it a ⭐ on GitHub.

---

## Made with ❤️ by Roys Sudhan B
