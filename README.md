# SOC Chatbot — RAG-powered Incident Response Assistant

A FastAPI + React application that lets SOC analysts chat with an AI assistant grounded in your organization's **SOP (Standard Operating Procedure) knowledge base** via Retrieval-Augmented Generation (RAG). Incoming simulated SOC tickets appear in a right-hand panel, while the left sidebar manages recent chats (new, archive, delete, settings).

## Features

| Area | Capability |
|------|------------|
| **Chat** | Ask natural-language questions about incidents and SOPs; answers are grounded in retrieved SOP excerpts with citations |
| **RAG** | Sentence Transformers embeddings (`all-MiniLM-L6-v2`) + FAISS vector store (`IndexFlatIP`, cosine similarity) |
| **SOPs** | Upload PDF / DOCX / TXT / MD documents; auto-chunked and indexed; admin-only upload/delete |
| **Tickets** | Simulated SOC ticket stream (phishing, ransomware, brute-force, malware, data exfiltration, unauthorized access) |
| **Auth** | JWT Bearer authentication; `analyst` and `admin` roles; admin required for SOP management |
| **Chat lifecycle** | New chat, recent-chats sidebar, archive/unarchive, delete |

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.11+ | Used for the backend |
| [uv](https://github.com/astral-sh/uv) | latest | Python package manager (project is uv-managed) |
| Node.js | 18+ | Used for the frontend (Vite) |
| npm / yarn / pnpm | — | Frontend package manager |

> **No Docker is required.** The backend defaults to a local SQLite database, so the project runs with zero external services.

## Project Structure

```
Major-Project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth_routes.py      # Login / me (JWT)
│   │   │   ├── chat_routes.py      # Chat sessions, messages, archive, delete
│   │   │   ├── sop_routes.py       # SOP list, chunks, upload, delete
│   │   │   └── ticket_routes.py    # Simulated SOC tickets
│   │   ├── models/
│   │   │   ├── db_models.py        # SQLAlchemy 2.x ORM models
│   │   │   └── schemas.py          # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── auth_service.py     # bcrypt, JWT, seed users
│   │   │   ├── embedding_service.py# Sentence Transformers wrapper
│   │   │   ├── rag_engine.py       # LangChain chain + local synthesis fallback
│   │   │   ├── sop_manager.py      # SOP parsing, chunking, vector indexing
│   │   │   ├── ticket_service.py   # Simulated ticket generator
│   │   │   └── vector_store.py     # FAISS IndexFlatIP persistence
│   │   ├── config.py               # Pydantic settings (.env)
│   │   ├── db.py                   # SQLAlchemy engine + session
│   │   ├── main.py                 # FastAPI app, lifespan seeding, CORS
│   │   └── __init__.py
│   ├── data/                       # SQLite DB, FAISS index, uploaded SOPs (gitignored)
│   ├── .env.example                # Copy to .env and edit
│   ├── docker-compose.yml          # Optional PostgreSQL
│   ├── pyproject.toml              # uv project metadata
│   └── requirements.txt            # Pinned dependencies
├── frontend/
│   ├── src/
│   │   ├── api.js                  # Fetch wrapper + auth token handling
│   │   ├── App.jsx                 # Auth gate + 3-column layout
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx      # Chat UI + SOP citations
│   │   │   ├── Header.jsx          # Branding + signed-in user + logout
│   │   │   ├── LoginPage.jsx       # Sign-in form
│   │   │   ├── Sidebar.jsx         # Recent chats, archive/delete, settings
│   │   │   └── TicketsPanel.jsx    # Simulated incoming tickets
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── graphify-out/                   # Code knowledge graph (auto-generated)
├── .gitignore
└── README.md
```

## Quick Start

### 1. Clone / open the project

```powershell
cd C:\Users\HP\Desktop\Office\Major-Project
```

### 2. Backend

Open PowerShell in the `backend` folder:

```powershell
cd backend
```

#### Install Python dependencies

```powershell
uv sync
```

> If `uv sync` fails because the venv already exists, use:
> ```powershell
> uv pip install --python .\.venv\Scripts\python.exe -r requirements.txt
> ```

#### Configure environment

Copy the example file and edit as needed:

```powershell
copy .env.example .env
```

Edit `backend/.env`. The only values you *might* want to change for a local run:

```ini
# JWT signing key — set a fixed value so tokens survive restarts
SECRET_KEY=change-me-in-production

# Frontend origin (Vite dev server)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# LLM provider: auto | openai | nim | none
# "none" (default) uses deterministic local synthesis — works offline with no API key.
LLM_PROVIDER=none

# Optional: PostgreSQL DSN. Leave empty for zero-config SQLite.
DATABASE_URL=

# Seed demo account passwords (change before any shared deployment)
SEED_ADMIN_PASSWORD=adminpassword123
SEED_ANALYST_PASSWORD=socpassword123
```

#### Start the backend

```powershell
\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8123
```

Wait for:

```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8123 (Press CTRL+C to quit)
Database engine   : sqlite:///...
Vector index      : 24 SOP chunks in FAISS
LLM provider      : none configured -> deterministic local synthesis
```

First boot downloads the `all-MiniLM-L6-v2` embedding model (~90 MB) — this takes ~30–60 seconds.

Verify:

```powershell
Invoke-WebRequest http://127.0.0.1:8123/health
```

Expected: `{"status":"ok","version":"1.0.0","vector_chunks":24,...}`

Interactive API docs: `http://127.0.0.1:8123/docs`

### 3. Frontend

Open a **second** PowerShell window in the `frontend` folder:

```powershell
cd C:\Users\HP\Desktop\Office\Major-Project\frontend
npm install
npm run dev
```

Vite will start on `http://localhost:5173`.

> If you want the frontend to point at a different backend URL, create `frontend/.env`:
> ```
> VITE_API_BASE=http://127.0.0.1:8123/api/v1
> ```

### 4. Use the app

1. Open `http://localhost:5173`
2. Sign in with one of the seeded accounts:
   - **analyst** / `socpassword123` — chat, view tickets, view SOPs
   - **admin** / `adminpassword123` — everything analyst + upload/delete SOPs
3. The UI has three columns:
   - **Left** — Sidebar: recent chats, New chat, Archive/Delete per chat, Settings, Sign out
   - **Center** — Chat window: type a question about an incident/SOP; answers include SOP citations
   - **Right** — Incoming Tickets panel: simulated SOC tickets (phishing, ransomware, malware, data exfiltration, etc.)

## Backend Architecture

### Database (SQLAlchemy 2.x)
- **Zero-config:** SQLite at `backend/data/soc.db` (created automatically on first boot)
- **Optional PostgreSQL:** set `DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/soc_assistant` and run `docker compose -f backend/docker-compose.yml up -d`

### RAG Pipeline
1. SOPs are parsed (PDF via `pypdf`, DOCX via `python-docx`, TXT/MD via plain read)
2. Text is chunked with LangChain `RecursiveCharacterTextSplitter` (900 chars, 120 overlap)
3. Chunks are embedded with `sentence-transformers/all-MiniLM-L6-v2` and stored in FAISS `IndexFlatIP` (cosine similarity on L2-normalized vectors)
4. On chat, the user query is embedded and the top-K SOP chunks are retrieved
5. A LangChain `ChatOpenAI` chain (OpenAI or NVIDIA NIM LLaMA) generates the answer; if no provider is configured, a deterministic local synthesiser runs offline

### Authentication
- `POST /api/v1/auth/login` → JWT access token (HS256)
- `GET /api/v1/auth/me` → current user
- All chat/ticket/SOP endpoints require a valid Bearer token
- `admin` role required for SOP upload/delete

### Seed Data
On first boot the backend seeds:
- 2 users: `admin` / `analyst`
- 6 default SOPs (phishing, ransomware, privilege escalation, brute-force, malware, data exfiltration) → 24 vector chunks
- 12 simulated SOC tickets

## API Reference

Base URL: `http://127.0.0.1:8123/api/v1`

### Auth
| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/login` | `{username, password}` | — | Get JWT access token |
| GET | `/auth/me` | — | Bearer | Current user profile |

### Chat
| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | `/chat` | — | Bearer | Create a new chat session |
| GET | `/chat/sessions` | `?include_archived=1` | Bearer | List sessions (archived hidden by default) |
| GET | `/chat/sessions/{id}/messages` | — | Bearer | Get message history |
| POST | `/chat/sessions/{id}/message` | `{message}` | Bearer | Send message; get RAG answer + SOP citations |
| PATCH | `/chat/sessions/{id}/archive` | `{archived: bool}` | Bearer | Archive or unarchive a session |
| DELETE | `/chat/sessions/{id}` | — | Bearer | Delete a session |

### Tickets
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tickets` | Bearer | All simulated tickets |
| GET | `/tickets/open` | Bearer | Open tickets only |

### SOPs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/sops` | Bearer | List indexed SOPs |
| GET | `/sops/{id}/chunks` | Bearer | Get SOP chunks |
| POST | `/sops/upload` | Bearer (admin) | Upload PDF/DOCX/TXT/MD SOP |
| DELETE | `/sops/{id}` | Bearer (admin) | Delete an SOP |

## Environment Variables (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | *(ephemeral per boot)* | JWT signing key. Set a fixed value for production. |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token lifetime |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated frontend origins |
| `LLM_PROVIDER` | `auto` | `auto` \| `openai` \| `nim` \| `none` |
| `OPENAI_API_KEY` | `""` | OpenAI key (used if `LLM_PROVIDER=openai` or auto) |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model |
| `NIM_API_KEY` | `""` | NVIDIA NIM key |
| `NIM_BASE_URL` | `https://integrate.api.nvidia.com/v1` | NIM endpoint |
| `NIM_MODEL` | `meta/llama-4-scout-17b-16e-instruct` | NIM model |
| `LLM_TIMEOUT_SECONDS` | `25` | LLM request timeout |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Embedding model |
| `RETRIEVAL_TOP_K` | `4` | SOP chunks retrieved per query |
| `DATABASE_URL` | `""` | Empty = SQLite; set PostgreSQL DSN for production |
| `SEED_ADMIN_PASSWORD` | `adminpassword123` | Admin seed password |
| `SEED_ANALYST_PASSWORD` | `socpassword123` | Analyst seed password |

## Running with PostgreSQL (optional)

```powershell
cd backend
docker compose -f docker-compose.yml up -d
# Then set in .env:
# DATABASE_URL=postgresql+psycopg://soc:soc@localhost:5432/soc_assistant
```

Restart the backend after changing `DATABASE_URL`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: No module named 'jose'` | Run `uv pip install --python .\.venv\Scripts\python.exe python-jose[cryptography]` |
| Port 8123 already in use | The sibling dhruva project owns port 8000; use 8123 (already configured) or change `--port` |
| First boot hangs ~60s | The embedding model (~90 MB) is downloading on first startup |
| Frontend shows `ERR_CONNECTION_REFUSED` | Backend isn't running. Start uvicorn on `127.0.0.1:8123` first |
| Login returns 401 with correct credentials | Ensure the backend is running and `SECRET_KEY` isn't changing between restarts (tokens are invalidated on restart if `SECRET_KEY` is unset) |
| Archived chats don't appear | Use the "Show archived" toggle in the sidebar |
| DOCX upload fails | Ensure the file is a valid `.docx` and under 20 MB; `sop_id` must be 3–64 chars (letters, digits, `_`, `-`) |

## Tech Stack

**Backend:** FastAPI, SQLAlchemy 2.x, Pydantic v2, python-jose, bcrypt, sentence-transformers, faiss-cpu, langchain, langchain-core, langchain-text-splitters, langchain-openai, pypdf, python-docx, uvicorn

**Frontend:** React 18, Vite, lucide-react

## License

Internal project — Department of CS (IoT & Cybersecurity).
