# T&C Guardian

**AI-Powered Contract Analyzer | Paranoid Lawyer Engine**

> Don't get sued. Use the Paranoid Lawyer engine to find predatory clauses in Terms & Conditions before you sign.

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Privacy & Security](#privacy--security)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**T&C Guardian** is a privacy-first, AI-powered web application that analyzes Terms & Conditions contracts to identify predatory clauses, hidden fees, data rights violations, and arbitration traps. Built with a "Paranoid Lawyer" AI engine powered by Google Gemini, it helps users understand what they're signing before they commit.

### Key Highlights

- 🔒 **Privacy-First**: No login required, session-based history (auto-purges on tab close)
- 🤖 **AI-Powered**: Uses Google Gemini 1.5 Pro for intelligent contract analysis
- 🌍 **Jurisdiction-Aware**: Analyzes contracts based on local laws (CCPA, GDPR, IT Act)
- ⚡ **Fast & Cached**: Firestore caching reduces API costs and improves response times
- 🎨 **Modern UI**: Glassmorphism design with dark mode, responsive layout

---

## ✨ Features

### Core Features

- **📄 Document Analysis**
  - Upload PDF, DOCX, or paste text directly
  - AI-powered clause identification and risk scoring
  - Overall danger score (0-100) with visual indicators
  - Detailed breakdown of problematic clauses

- **🎯 Risk Assessment**
  - Color-coded severity levels (Critical, Warning, Safe)
  - Per-clause severity scores (1-10)
  - Category classification (Data Rights, Arbitration, Financial, IP Ownership, etc.)
  - Legal context explanations based on jurisdiction

- **💬 AI Chat Interface**
  - Ask questions about your contract in natural language
  - RAG (Retrieval Augmented Generation) powered responses
  - Context-aware answers based on the analyzed document

- **📧 Negotiation Tools**
  - Generate professional emails to contest unfair clauses
  - AI-powered clause rewriting (Redline feature)
  - Track negotiation status and history
  - Multiple tone options (firm, polite, aggressive)

- **📊 Visual Analytics**
  - Interactive infographic showing "Data Harvest" process
  - Risk heatmap visualization
  - History tracking with session-based storage

- **🌐 Jurisdiction Support**
  - US California (CCPA)
  - EU (GDPR)
  - India (IT Act)
  - Customizable default jurisdiction

### UI/UX Features

- **Glassmorphism Design**: Modern, translucent UI with backdrop blur effects
- **Bento Grid Layout**: Organized, card-based interface
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Micro-interactions**: Smooth animations, hover effects, loading states
- **Dark Mode**: Default dark theme with high contrast
- **Accessibility**: Keyboard navigation, ARIA labels, focus states

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐
│   React Client  │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  FastAPI Server │
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│Gemini │ │Firestore│
│  API  │ │  Cache  │
└───────┘ └─────────┘
```

### Data Flow

1. **Upload**: User uploads document or pastes text
2. **Ingestion**: Backend extracts and sanitizes text
3. **Cache Check**: Firestore checked for existing analysis (SHA-256 hash)
4. **AI Analysis**: If cache miss, Gemini analyzes the contract
5. **Response**: Structured analysis returned to frontend
6. **Storage**: Results saved to sessionStorage (client-side only)

### Privacy Architecture

- **No Authentication**: Completely anonymous usage
- **Session Storage**: History stored in browser `sessionStorage` (wipes on tab close)
- **Stateless Backend**: No user tracking, no personal data stored
- **Firestore Caching**: Only caches contract analysis (by hash), not user data

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **TypeScript** | 5.9.3 | Type safety |
| **Vite** | 7.2.4 | Build tool & dev server |
| **Tailwind CSS** | 3.4.17 | Styling |
| **Zustand** | Latest | State management |
| **React Router** | 7.10.1 | Routing |
| **Axios** | 1.13.2 | HTTP client |
| **Sonner** | 2.0.7 | Toast notifications |
| **Lucide React** | 0.561.0 | Icons |
| **Vitest** | 2.1.8 | Testing |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.10+ | Runtime |
| **FastAPI** | Latest | Web framework |
| **Uvicorn** | Latest | ASGI server |
| **Google Generative AI** | Latest | AI analysis |
| **Firebase Admin SDK** | Latest | Firestore access |
| **Pydantic** | Latest | Data validation |
| **PyPDF2** | Latest | PDF extraction |
| **python-docx** | Latest | DOCX extraction |
| **BeautifulSoup4** | Latest | URL scraping |
| **Pytest** | Latest | Testing |

### Infrastructure

- **Firebase Firestore**: Document caching and storage
- **Google Gemini 1.5 Pro**: AI analysis engine
- **Vercel/Netlify** (Frontend): Hosting
- **Railway/Render** (Backend): API hosting

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.10+
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))
- **Firebase Project** with Firestore enabled ([Setup guide](https://firebase.google.com/docs/firestore))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/tc-guardian.git
cd tc-guardian
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create secrets file
cp secrets.example.json secrets.json
# Edit secrets.json with your API keys
```

**secrets.json structure:**
```json
{
  "google_api_key": "your_gemini_api_key_here",
  "firebase_credentials": {
    "type": "service_account",
    "project_id": "your-project-id",
    "private_key_id": "...",
    "private_key": "...",
    "client_email": "...",
    "client_id": "...",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "..."
  }
}
```

**Start the backend:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:5173`

#### 4. Verify Installation

- Backend: Visit `http://localhost:8000/docs` (FastAPI Swagger UI)
- Frontend: Visit `http://localhost:5173`
- Test: Upload a sample PDF or paste contract text

---

## 📁 Project Structure

```
tc-guardian/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── analysis.py      # Contract analysis endpoint
│   │   │   │   ├── ingestion.py     # File/URL ingestion
│   │   │   │   ├── chat.py          # AI chat interface
│   │   │   │   └── negotiations.py  # Negotiation tracking
│   │   ├── core/
│   │   │   ├── config.py            # Configuration
│   │   │   ├── dependencies.py      # FastAPI dependencies
│   │   │   └── logging.py           # Logging setup
│   │   ├── schemas/
│   │   │   ├── analysis.py          # Pydantic models
│   │   │   ├── chat.py
│   │   │   └── jurisdiction.py
│   │   └── services/
│   │       ├── analysis_service.py  # AI analysis logic
│   │       ├── ingestion_service.py # File processing
│   │       └── negotiation_service.py
│   ├── tests/                       # Backend tests
│   ├── main.py                      # FastAPI app entry
│   ├── firebase_config.py           # Firebase setup
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   ├── common/              # Common components
│   │   │   └── analysis/            # Analysis-specific components
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Main analysis interface
│   │   │   ├── Chat.tsx             # AI chat page
│   │   │   ├── Negotiations.tsx     # Negotiation tracker
│   │   │   ├── Infographic.tsx      # Data visualization
│   │   │   └── Settings.tsx         # User settings
│   │   ├── stores/
│   │   │   ├── analysisStore.ts     # Analysis state (Zustand)
│   │   │   ├── historyStore.ts      # Session history (Zustand)
│   │   │   └── uiStore.ts           # UI state
│   │   ├── services/
│   │   │   └── api.ts                # API client
│   │   ├── App.tsx                   # Root component
│   │   └── GuardianApp.tsx          # Main app wrapper
│   ├── public/                      # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── PLAN.md                          # Implementation plan
├── DATA_SCHEMA.md                   # Data structure docs
└── README.md                        # This file
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:8000
```

### Endpoints

#### 1. Analyze Contract

**POST** `/analyze`

Analyze contract text and return structured analysis.

**Request:**
```json
{
  "text": "Contract text here...",
  "jurisdiction": "US_CALIFORNIA"
}
```

**Response:**
```json
{
  "analysis_result": {
    "document_summary": "High-level summary...",
    "overall_danger_score": 75,
    "clauses": [
      {
        "id": "uuid",
        "clause_text": "Exact clause text...",
        "category": "Data Rights",
        "simplified_explanation": "ELI5 explanation...",
        "severity_score": 8,
        "legal_context": "Violates CCPA...",
        "actionable_step": "Request opt-out...",
        "flags": ["Red Flag", "Unusual"]
      }
    ]
  }
}
```

#### 2. Ingest File

**POST** `/ingest/file`

Upload and extract text from PDF/DOCX.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "status": "success",
  "text_length": 5000,
  "preview": "First 500 chars..."
}
```

#### 3. Chat with Contract

**POST** `/chat`

Ask questions about the analyzed contract.

**Request:**
```json
{
  "history": [
    {"role": "user", "parts": ["What is the refund policy?"]}
  ],
  "current_question": "Can I cancel anytime?",
  "document_context": "Full contract text..."
}
```

**Response:**
```json
{
  "answer": "Based on the contract..."
}
```

#### 4. Create Negotiation

**POST** `/negotiations/create`

Create a negotiation/dispute for a contested clause.

**Request:**
```json
{
  "user_id": "user_123",
  "document_title": "Netflix Terms",
  "company_name": "Netflix",
  "clause": {
    "id": "clause_id",
    "clause_text": "...",
    "category": "Data Rights",
    "severity_score": 8
  }
}
```

#### 5. Generate Email

**POST** `/negotiations/{negotiation_id}/generate-email`

Generate a professional email to contest a clause.

**Request:**
```json
{
  "negotiation_id": "neg_123",
  "tone": "firm"
}
```

**Full API Documentation:** Visit `http://localhost:8000/docs` for interactive Swagger UI.

---

## 💻 Development

### Development Workflow

1. **Backend Development**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Code Quality**
   ```bash
   # Frontend linting
   cd frontend
   npm run lint

   # Backend formatting (using black)
   cd backend
   black app/
   ```

### Environment Variables

**Backend (.env or secrets.json):**
- `GOOGLE_API_KEY`: Gemini API key
- `FIREBASE_CREDENTIALS`: Firebase service account JSON

**Frontend (.env):**
- `VITE_API_URL`: Backend API URL (default: `http://localhost:8000`)

### Code Style

- **Frontend**: ESLint + Prettier (configured)
- **Backend**: Black formatter, Pydantic for validation
- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks

---

## 🧪 Testing

### Frontend Tests

```bash
cd frontend
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:ui       # UI mode
```

**Test Files:**
- `src/pages/__tests__/Chat.test.tsx`
- `src/components/analysis/ClauseCard.test.tsx`
- `src/components/analysis/DangerScore.test.tsx`

### Backend Tests

```bash
cd backend
pytest                # Run all tests
pytest -v             # Verbose
pytest tests/test_analysis_service.py  # Specific test
```

**Test Files:**
- `tests/test_analysis_service.py`
- `tests/test_ingestion_service.py`
- `tests/test_negotiations.py`

---

## 🚢 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy:**
   - **Vercel**: Connect GitHub repo, set build command: `npm run build`, output: `dist`
   - **Netlify**: Drag & drop `dist` folder or connect repo

3. **Environment Variables:**
   - `VITE_API_URL`: Your backend API URL

### Backend Deployment (Railway/Render)

1. **Prepare:**
   - Set environment variables in platform
   - Upload `secrets.json` or use env vars

2. **Deploy:**
   - **Railway**: Connect GitHub, set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Render**: Connect repo, set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables:**
   - `GOOGLE_API_KEY`
   - `FIREBASE_CREDENTIALS` (as JSON string)

### Firebase Setup

1. Create Firebase project
2. Enable Firestore Database
3. Download service account JSON
4. Add to `backend/secrets.json`

---

## 🔒 Privacy & Security

### Privacy Features

- ✅ **No Authentication**: Completely anonymous
- ✅ **Session Storage**: History auto-purges on tab close
- ✅ **No User Tracking**: Backend doesn't store user data
- ✅ **Stateless API**: No cookies, no sessions

### Security Measures

- ✅ **Rate Limiting**: Prevents API abuse
- ✅ **Input Validation**: Pydantic schemas validate all inputs
- ✅ **CORS**: Configured for specific origins
- ✅ **Error Handling**: No sensitive data in error messages
- ✅ **Firebase Security Rules**: Firestore access restricted

### Data Handling

- **Client-Side**: Analysis history stored in `sessionStorage` (wipes on close)
- **Server-Side**: Only caches contract analysis by hash (no user linkage)
- **Firestore**: Stores cached analyses in `global_contracts` collection

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation
- Keep commits atomic and descriptive

---

## 📝 License

**Private - All Rights Reserved**

This project is proprietary software. Unauthorized copying, modification, distribution, or use is strictly prohibited.

---

## 👤 Author

**Kanit**

Built with ❤️ using React, FastAPI, and Google Gemini

---

## 🙏 Acknowledgments

- **Google Gemini**: AI analysis engine
- **Firebase**: Caching and storage
- **React Team**: Amazing framework
- **FastAPI**: Excellent Python framework
- **Tailwind CSS**: Beautiful utility-first CSS

---

## 📚 Additional Resources

- [Implementation Plan](./PLAN.md)
- [Data Schema](./DATA_SCHEMA.md)
- [API Documentation](http://localhost:8000/docs) (when running locally)
- [Google Gemini Docs](https://ai.google.dev/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)

---

## 🐛 Known Issues

- [ ] Large PDFs (>10MB) may timeout
- [ ] Some DOCX files with images may not extract text
- [ ] Rate limiting may trigger on high traffic

## 🔮 Roadmap

- [ ] Support for more file formats (TXT, RTF)
- [ ] Batch analysis (multiple documents)
- [ ] Export analysis as PDF
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Multi-language support

---

**Stay safe out there! 🛡️**

