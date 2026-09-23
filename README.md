# 🎓 Graduation Credit Tracker

> A full-stack academic progress and student-success platform for tracking graduation requirements, planning future semesters, managing academic records, and helping students understand their path to graduation.

[![Frontend](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=white)](https://graduation-credit-tracker.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://graduation-credit-tracker-api.onrender.com)
[![API Docs](https://img.shields.io/badge/API-Swagger-85EA2D?logo=swagger&logoColor=black)](https://graduation-credit-tracker-api.onrender.com/docs)
[![Database](https://img.shields.io/badge/Production-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](#technology-stack)

## 🌟 About the project

Graduation Credit Tracker (GCT) started as a way to show students how many credits they have completed. It has grown into a multi-role platform connecting academic records, graduation progress, semester planning, grade prediction, achievements, programme community features, AI assistance, email communication and administrative tools.

The system has two main experiences:

- **Students** can view progress, academic history, outstanding requirements, planning information, predictions, achievements, peer comparison, community discussions and Marcel AI assistance.
- **Administrators** can manage students, record official marks, inspect academic progress, identify at-risk students, perform bulk uploads, communicate with students and manage administrator accounts.

## 🚀 Live application

| Service | Link |
| --- | --- |
| 🌐 Frontend | https://graduation-credit-tracker.vercel.app |
| ⚙️ Backend API | https://graduation-credit-tracker-api.onrender.com |
| 📚 Swagger API documentation | https://graduation-credit-tracker-api.onrender.com/docs |
| ❤️ Backend health check | https://graduation-credit-tracker-api.onrender.com/health |

> The Render backend may take a short time to wake up after a period of inactivity.

## ✨ Main features

### Student experience
- Graduation progress and completed-credit tracking
- Overall academic average and module history
- Degree-progress and yearly breakdown views
- Outstanding compulsory/elective requirement analysis
- Prerequisite-aware module eligibility
- Graduation planning and semester planner
- Grade predictor for what-if scenarios
- Achievement and XP system
- Privacy-aware peer comparison
- Programme community with channels, replies and reactions
- Marcel AI academic assistant
- Support-services and facilitator information

### Administrator experience
- Administrator authentication and role-protected APIs
- Dashboard and programme-level overview
- Student search, creation, update and deactivation
- Individual student academic summaries
- Official mark recording
- PIN regeneration/reset workflow
- CSV bulk student and marks upload
- At-risk student analysis
- Bulk email tools
- Administrator account management
- Controlled student impersonation for support/testing
- Simulation tools for realistic demonstration data

## 🧠 Academic logic

GCT treats **academic performance** and **graduation credits** as related but different measurements.

The overall average is calculated from recorded module marks without weighting marks by module credit size. Credits are awarded toward degree completion when modules are successfully completed.

Planning logic uses programme requirements, completed modules and prerequisites to determine what remains and which modules a student can take next. The semester planner can generate and save proposed study plans.

## 🏗️ Technology stack

### Frontend
- React 19
- Vite 8
- Tailwind CSS 4
- Lucide React
- Framer Motion
- Recharts
- React Markdown
- Sonner

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic / Pydantic Settings
- JWT authentication
- SlowAPI rate limiting
- Pytest

### Data & external services
- PostgreSQL in production
- SQLite for local development by default
- Google Gemini for AI functionality
- Tavily for supported web-search functionality
- Mailjet transactional email API

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Production database:** PostgreSQL

## 📁 Repository structure

```text
graduation-credit-tracker/
├── backend/
│   ├── app/
│   │   ├── routers/          # FastAPI route modules
│   │   ├── config.py         # Environment-based settings
│   │   ├── database.py       # Database configuration
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   └── main.py           # FastAPI application
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Application pages
│   │   ├── api.js            # Frontend API client
│   │   ├── App.jsx           # Student application
│   │   └── AdminApp.jsx      # Administrator application
│   ├── package.json
│   └── ...
└── README.md
```

## 🛠️ Running the project locally

### Prerequisites

Install the following before starting:

- **Git**
- **Python 3**
- **Node.js + npm**

Clone the repository:

```bash
git clone https://github.com/BMynk/graduation-credit-tracker.git
cd graduation-credit-tracker
```

### 1. Start the backend

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

**Windows**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS/Linux**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the backend packages:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`. For basic local development, a minimal configuration can look like:

```env
DATABASE_URL=sqlite:///./credit_tracker.db
SECRET_KEY=replace-this-with-a-long-random-secret
CORS_ORIGINS=http://localhost:5173
BASE_URL=http://localhost:5173
EMAIL_DEV_MODE=true
```

Then start FastAPI:

```bash
uvicorn app.main:app --reload
```

The backend should be available at:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

### 2. Start the frontend

Open a **second terminal**:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start Vite:

```bash
npm run dev
```

Open the URL Vite prints in the terminal (normally `http://localhost:5173`).

## 🔐 Environment variables

Do **not** commit real passwords, API keys, JWT secrets or database credentials to GitHub.

Important backend settings currently supported by the project include:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite/PostgreSQL database connection |
| `SECRET_KEY` | JWT signing secret |
| `ALGORITHM` | JWT algorithm; defaults to HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access-token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh-token lifetime |
| `CORS_ORIGINS` | Allowed frontend origins |
| `BASE_URL` | Frontend URL used by backend/email flows |
| `EMAIL_DEV_MODE` | Logs/dev behaviour instead of production email |
| `MAILJET_API_KEY` | Mailjet API key |
| `MAILJET_SECRET_KEY` | Mailjet secret key |
| `MAILJET_FROM_EMAIL` | Verified Mailjet sender |
| `MAILJET_FROM_NAME` | Display name for outgoing email |
| `GEMINI_API_KEY` | Google Gemini integration |
| `TAVILY_API_KEY` | Tavily integration |
| `PASS_MARK` | Academic pass threshold |
| `TYPICAL_CREDITS_PER_SEMESTER` | Academic planning setting |

The frontend uses:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the FastAPI backend |

## 🔑 Authentication

GCT uses JWT-based authentication with separate student and administrator flows.

Student sessions use access and refresh tokens. The frontend automatically attempts to refresh an expired access token using `/auth/refresh`.

Protected requests send:

```http
Authorization: Bearer <access_token>
```

The Swagger page can be used to explore and test the backend endpoints during development.

## 📤 Bulk upload

The frontend includes separate administrator actions for:

- Student CSV upload → `/admin/students/upload`
- Marks CSV upload → `/admin/marks/upload`

Use the admin interface and follow the expected CSV format shown by the relevant upload workflow. Validate files before uploading production academic records.

## 🤖 Marcel AI

Marcel is GCT's AI assistant. The backend exposes standard and streaming assistant endpoints, while the frontend provides a floating assistant experience.

AI functionality depends on the appropriate API credentials being configured. Never expose AI provider keys in frontend environment variables.

## 📧 Email

Production transactional email is configured through Mailjet's API. For local development, `EMAIL_DEV_MODE=true` can be used so development does not depend on production email delivery.

A production sender address must be properly configured with the email provider.

## 🧪 Testing & quality checks

Backend dependencies include Pytest. Before merging important backend changes, run the project's available tests from the backend directory:

```bash
pytest
```

For the frontend:

```bash
npm run lint
npm run build
```

A successful production build is especially important before merging frontend changes that will deploy through Vercel.

## 🤝 Contributing

This is a collaborative project. A safe workflow is:

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Make your changes, then:

```bash
git add .
git commit -m "Describe your change"
git push -u origin feature/your-feature-name
```

Open a Pull Request into `main`, review the changes, and merge only after the application builds/tests successfully.

### Recommended branch names

```text
feature/add-new-feature
fix/describe-the-bug
docs/update-readme
refactor/describe-change
```

## ⚠️ Important contribution rules

- Never commit `.env` files or secrets.
- Pull the latest `main` before starting new work.
- Avoid committing directly to `main` for larger changes.
- Test both student and administrator experiences when changing shared code.
- Keep database changes backward-compatible where possible.
- Do not use real student data for demos or development.
- Keep simulated/test data clearly distinguishable from real records.

## 🐛 Troubleshooting

**Frontend cannot reach backend**  
Check `VITE_API_URL` and make sure FastAPI is running. Also confirm the frontend origin is included in `CORS_ORIGINS`.

**CORS error**  
Add the exact frontend origin to the backend `CORS_ORIGINS` setting and restart the backend.

**401 / session expired**  
Log in again. The frontend uses refresh tokens, but an invalid/expired refresh token clears the session.

**Email is not sending**  
Check Mailjet environment variables, confirm `EMAIL_DEV_MODE=false` in production, and verify the configured sender address.

**Render looks offline at first**  
A free Render service may need time to wake after inactivity. Check the backend health endpoint before assuming the frontend is broken.

## 📚 API documentation

FastAPI automatically generates interactive API documentation:

**Production:**  
https://graduation-credit-tracker-api.onrender.com/docs

**Local:**  
http://127.0.0.1:8000/docs

This is useful for understanding available endpoints and testing requests without the React frontend.

## 🗺️ Future improvements

Current areas for continued development include:

- stronger refresh-token rotation and revocation
- secure server-side logout/session invalidation
- expanded PIN brute-force protection
- additional automated regression tests
- community moderation/reporting controls
- richer operational documentation
- continued mobile and accessibility improvements

## 👥 Project

**Graduation Credit Tracker**  
Collaborative academic software project.

Repository maintained by the project team and contributors.

---

### ⭐ Support the project

If you are part of the team, keep this README updated whenever setup steps, environment variables, deployment architecture or major features change. Good documentation is part of the software.
