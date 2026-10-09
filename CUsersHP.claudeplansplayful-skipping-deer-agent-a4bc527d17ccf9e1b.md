# Implementation Plan: Chat Interface with RAG Tool for Smart Threat Response Assistant

## Overview
Add a dedicated chat interface with RAG capabilities spanning full system scope: SOPs, alerts, audit logs, triage results. LLM backend uses NVIDIA NIM. UI is a new dedicated page integrated into existing React cyber-themed dashboard.

## 1. Backend Changes

### 1.1 Configuration
File: `backend/app/config.py`
- Add NIM settings:
  - `NIM_API_URL: str = os.getenv("NIM_API_URL", "")`
  - `NIM_API_KEY: str = os.getenv("NIM_API_KEY", "")`
  - `NIM_MODEL: str = os.getenv("NIM_MODEL", "meta/llama-4-scout-17b-16e-instruct")`
- Keep existing OPENAI settings for fallback compatibility.

### 1.2 Pydantic Schemas
File: `backend/app/models/schemas.py`
Add chat models after existing models:
```python
class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    scope: str = "full"  # "sops" | "alerts" | "audit" | "triage" | "full"

class ChatResponse(BaseModel):
    response: str
    citations: List[SOPCitation] = Field(default_factory=list)
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    context_summary: str
```

Rationale: Follows existing pattern of Pydantic models used by triage/alert endpoints.

### 1.3 Chat Engine Service
File: `backend/app/services/chat_engine.py` [NEW]
- Reuse `vector_store.search` for SOP retrieval.
- Reuse `rag_engine.calculate_confidence` logic for scoring.
- Context retrieval:
  - SOPs: vector_store.search(query, top_k=5)
  - Alerts: query `alert_service.get_all()` and filter by title/description/indicators containing query terms (case-insensitive)
  - Audit: query `audit_service.get_records()` and filter by incident_summary/notes/alert_id
  - Triage: from alert.triage_result where present
- Build system prompt with full system context and strict grounding instructions.
- NIM integration:
  - POST to NIM chat completions endpoint (OpenAI-compatible)
  - Headers: Authorization Bearer NIM_API_KEY
  - Body: model, messages with system + retrieved context + history
  - Streaming option: support Server-Sent Events for frontend streaming
- Fallback: if NIM unavailable, use `rag_engine._generate_local_synthesis` style deterministic response with retrieved chunks.
- Return ChatResponse with citations and source metadata.

### 1.4 Chat Router
File: `backend/app/api/chat_routes.py` [NEW]
- Router prefix `/chat`, tags `["Chat RAG"]`
- POST `/api/v1/chat` -> accepts ChatRequest, returns ChatResponse
- GET `/api/v1/chat/context` -> returns summary counts of SOPs/alerts/audit for UI
- Register router in `backend/app/main.py`:
  ```python
  from app.api.chat_routes import router as chat_router
  app.include_router(chat_router, prefix=settings.API_V1_STR)
  ```

### 1.5 Dependencies
- Reuse existing services: `vector_store`, `rag_engine`, `alert_service`, `audit_service`
- No new external packages required; httpx already used.

## 2. Frontend Changes

### 2.1 API Client Extension
File: `frontend/src/api.js`
Add:
```js
export async function sendChatMessage(payload) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}
export async function fetchChatContext() {
  const res = await fetch(`${API_BASE}/chat/context`);
  if (!res.ok) throw new Error("Failed to load chat context");
  return res.json();
}
```

### 2.2 Chat Component
File: `frontend/src/components/Chat.jsx` [NEW]
- Cyber-themed chat UI matching existing `cyber-card` styles
- Message list with role styling: user vs assistant
- Input box with send button, Enter to send
- Streaming support: fetch with ReadableStream parsing
- Citation rendering: clickable SOP citations with sop_id/section
- Source chips for alerts/audit/triage references
- Auto-scroll to bottom

### 2.3 Chat Page
File: `frontend/src/components/ChatPage.jsx` [NEW]
- Layout: left sidebar with scope selector (Full System / SOPs / Alerts / Audit / Triage)
- Main pane with Chat component
- Context summary header showing counts
- Reuse Header navigation state

### 2.4 App Integration
File: `frontend/src/App.jsx`
- Import ChatPage
- Add state `currentView` or route switch: `dashboard` | `chat`
- Add navigation button in Header: MessageSquare icon -> set view to chat
- Conditional render main grid vs ChatPage

File: `frontend/src/components/Header.jsx`
- Add new button next to SOP/Audit:
```jsx
<button onClick={onOpenChat} className="btn btn-secondary">Chat Assistant</button>
```
- Pass `onOpenChat` prop from App

### 2.5 Routing
- Keep single-page app; use view state rather than react-router to match existing pattern
- No new dependencies

## 3. Configuration Updates

Env vars to set for NIM:
- `NIM_API_URL=https://integrate.api.nvidia.com/v1`
- `NIM_API_KEY=<your_key>`
- `NIM_MODEL=meta/llama-4-scout-17b-16e-instruct` or chosen NIM model

Add to `.env` example in backend root. No code changes to settings loading needed beyond new fields.

## 4. Reuse Existing Patterns

- FastAPI router pattern: same as `alert_routes`, `triage_routes`
- Pydantic models: same style as `schemas.py`
- Service singleton pattern: `chat_engine = ChatEngine()`
- React cyber theme: use `cyber-card`, `btn`, badge styles from `index.css`
- API base URL: `http://127.0.0.1:8000/api/v1` as existing
- Error handling: try/catch with alert as in App.jsx

## 5. Verification Steps

1. Backend:
   - Start backend: `python -m uvicorn app.main:app --reload`
   - `curl -X POST http://127.0.0.1:8000/api/v1/chat -H "Content-Type: application/json" -d '{"message":"Summarize recent ransomware alerts","scope":"full"}'`
   - Verify response contains response text, citations, sources
   - Verify NIM fallback works when NIM_API_KEY empty

2. Frontend:
   - Start frontend: `npm run dev`
   - Click Chat Assistant in Header
   - Send query about SOPs, alerts, audit
   - Verify message stream, citations render, scope selector filters context
   - Verify navigation back to dashboard works

3. Integration:
   - Ask chat about a specific alert ID -> response references triage result
   - Ask about SOP procedure -> citations show sop_id and section
   - Ask about audit chain -> sources show audit records

## Critical Files for Implementation
- C:\Users\HP\Desktop\Major-Project\backend\app\config.py
- C:\Users\HP\Desktop\Major-Project\backend\app\models\schemas.py
- C:\Users\HP\Desktop\Major-Project\backend\app\services\chat_engine.py
- C:\Users\HP\Desktop\Major-Project\backend\app\api\chat_routes.py
- C:\Users\HP\Desktop\Major-Project\backend\app\main.py
- C:\Users\HP\Desktop\Major-Project\frontend\src\api.js
- C:\Users\HP\Desktop\Major-Project\frontend\src\components\Chat.jsx
- C:\Users\HP\Desktop\Major-Project\frontend\src\components\ChatPage.jsx
- C:\Users\HP\Desktop\Major-Project\frontend\src\App.jsx
- C:\Users\HP\Desktop\Major-Project\frontend\src\components\Header.jsx
