# T&C Guardian

**AI-Powered Contract Analyzer | Paranoid Lawyer Engine**

Don't get sued. Use the Paranoid Lawyer engine to find predatory clauses in Terms & Conditions before you sign.

## 🛡️ Features

- **AI-Powered Analysis**: Uses Google Gemini to analyze contract text and identify problematic clauses
- **Risk Scoring**: Visual danger score (0-100) with color-coded severity indicators
- **Jurisdiction Awareness**: Analyzes contracts based on your legal jurisdiction (CCPA, GDPR, IT Act, etc.)
- **Negotiation Tools**: Generate professional emails to contest unfair clauses
- **Redline Feature**: AI rewrites problematic clauses to be fair and balanced
- **Chat Interface**: Ask questions about your contract using natural language

## 🏗️ Architecture

### Frontend
- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS** with Glassmorphism design
- **Zustand** for state management
- **React Router** for navigation
- **Sonner** for toast notifications

### Backend
- **FastAPI** (Python)
- **Google Gemini API** for AI analysis
- **Firebase Firestore** for data persistence
- **Pydantic** for data validation

## 🚀 Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.10+
- Google Gemini API key
- Firebase project (for Firestore)

### Frontend Setup

```bash
cd frontend
yarn install
yarn dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables

Create `.env` files:

**Backend (.env):**
```
GOOGLE_API_KEY=your_gemini_api_key
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
```

## 📸 Screenshots

- Dashboard with risk analysis
- Negotiation tracker
- Chat interface with contract Q&A

## 🧪 Testing

```bash
# Frontend
cd frontend
yarn test

# Backend
cd backend
pytest
```

## 📝 License

Private - All Rights Reserved

## 👤 Author

**Kanit**

---

Built with ❤️ using React, FastAPI, and Google Gemini
