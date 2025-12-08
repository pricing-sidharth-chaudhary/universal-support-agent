# Universal AI Support Agent

An AI-powered support agent using RAG (Retrieval Augmented Generation) with ChromaDB and GPT-4o.

## Features

- **Upload Support Tickets**: Import historical ticket resolutions from CSV or JSON files
- **AI-Powered Responses**: Uses semantic search to find relevant past tickets and generates contextual responses
- **Human Handoff**: Automatically redirects to human agents when confidence is low
- **Local Vector Store**: ChromaDB runs locally - no external database needed
- **Modern UI**: Beautiful React frontend with Tailwind CSS

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────►│   Backend    │────►│   OpenAI     │
│  (React)     │     │  (FastAPI)   │     │   (API)      │
│  Port 5173   │◄────│  Port 8000   │◄────│              │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  ChromaDB    │
                    │  (Local)     │
                    └──────────────┘
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API Key

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Copy from .env.example and add your OpenAI API key
echo OPENAI_API_KEY=sk-your-key-here > .env

# Run the server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### 3. Open the Application

1. Open http://localhost:5173 in your browser
2. Upload the `sample_tickets.json` file (or your own data)
3. Start chatting!

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/status` | Get agent status |
| POST | `/api/upload` | Upload tickets file |
| POST | `/api/chat` | Send message to agent |
| DELETE | `/api/clear` | Clear all indexed tickets |

## File Formats

### JSON Format
```json
[
  {
    "id": "T001",
    "query": "How do I reset my password?",
    "resolution": "Go to Settings > Account > Reset Password...",
    "category": "account"
  }
]
```

### CSV Format
```csv
id,query,resolution,category
T001,How do I reset my password?,Go to Settings > Account...,account
```

## Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `CHROMA_DB_PATH` | Path to ChromaDB storage | `./data/chroma_db` |
| `EMBEDDING_MODEL` | OpenAI embedding model | `text-embedding-3-small` |
| `LLM_MODEL` | OpenAI chat model | `gpt-4o` |
| `SIMILARITY_THRESHOLD` | Minimum similarity for matches | `0.75` |

## Project Structure

```
universalSupportAgent/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Configuration
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic models
│   │   ├── routers/
│   │   │   ├── chat.py          # Chat endpoint
│   │   │   └── ingest.py        # Upload endpoint
│   │   └── services/
│   │       ├── vector_store.py  # ChromaDB operations
│   │       ├── embedding_service.py  # OpenAI embeddings
│   │       └── rag_chain.py     # RAG pipeline
│   ├── data/
│   │   └── chroma_db/           # Vector store data
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main application
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks
│   │   └── services/            # API client
│   ├── package.json
│   └── vite.config.js
│
├── sample_tickets.json          # Sample data for testing
└── README.md
```

## How It Works

1. **Ingestion**: Upload a file of support tickets. Only the **queries** are embedded (not resolutions).

2. **Query Processing**: When a user asks a question:
   - The question is embedded using OpenAI
   - ChromaDB finds similar past queries
   - Relevant resolutions are retrieved as context

3. **Response Generation**: GPT-4o generates a response based on:
   - Similar past tickets and their resolutions
   - The user's specific question
   - System instructions for helpful, accurate responses

4. **Human Handoff**: If similarity scores are too low, the agent acknowledges it can't help and offers to connect to a human.

## License

MIT

