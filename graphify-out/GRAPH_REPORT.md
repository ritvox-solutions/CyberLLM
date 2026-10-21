# Graph Report - Major-Project  (2026-10-21)

## Corpus Check
- 40 files · ~21,885 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 4, .css 2, .example 1)

## Summary
- 295 nodes · 630 edges · 20 communities (11 shown, 9 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `82ab56b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- User
- chat_routes.py
- App.jsx
- sop_routes.py
- SOPManager
- VectorStore
- package.json
- rag_engine.py
- Implementation Plan: Chat Interface with RAG Tool for Smart Threat Response Assistant
- EmbeddingService
- auth_service.py
- .oxlintrc.json
- React + Vite
- backend
- Settings

## God Nodes (most connected - your core abstractions)
1. `User` - 29 edges
2. `request()` - 17 edges
3. `SOPManager` - 16 edges
4. `App()` - 14 edges
5. `VectorStore` - 12 edges
6. `upload_sop()` - 10 edges
7. `Base` - 10 edges
8. `_ensure_session()` - 8 edges
9. `send_message()` - 8 edges
10. `Ticket` - 8 edges

## Surprising Connections (you probably didn't know these)
- `login()` --uses--> `Token`  [INFERRED]
  backend/app/api/auth_routes.py → backend/app/models/schemas.py
- `login()` --uses--> `UserLogin`  [INFERRED]
  backend/app/api/auth_routes.py → backend/app/models/schemas.py
- `read_current_user()` --uses--> `User`  [INFERRED]
  backend/app/api/auth_routes.py → backend/app/models/db_models.py
- `get_current_user()` --uses--> `User`  [INFERRED]
  backend/app/api/deps.py → backend/app/models/db_models.py
- `require_any_user()` --uses--> `User`  [INFERRED]
  backend/app/api/deps.py → backend/app/models/db_models.py

## Import Cycles
- None detected.

## Communities (20 total, 9 thin omitted)

### Community 0 - "User"
Cohesion: 0.08
Nodes (17): read_current_user(), _decode_token(), get_current_user(), require_admin(), require_any_user(), user_out(), get_db(), init_db() (+9 more)

### Community 1 - "chat_routes.py"
Cohesion: 0.12
Nodes (26): archive_session(), delete_session(), _ensure_session(), get_messages(), list_sessions(), new_chat(), _save_message(), send_message() (+18 more)

### Community 2 - "App.jsx"
Cohesion: 0.13
Nodes (30): archiveChat(), AuthError, clearToken(), deleteChat(), fetchMe(), getChatMessages(), getSOPChunks(), getToken() (+22 more)

### Community 3 - "sop_routes.py"
Cohesion: 0.14
Nodes (7): delete_sop(), get_sop_chunks(), list_sops(), upload_sop(), is_supported_file(), parse_file(), sanitize_filename()

### Community 4 - "SOPManager"
Cohesion: 0.22
Nodes (3): SOPChunk, SOPDocument, SOPManager

### Community 6 - "package.json"
Cohesion: 0.08
Nodes (25): dependencies, lucide-react, react, react-dom, devDependencies, oxlint, @types/react, @types/react-dom (+17 more)

### Community 7 - "rag_engine.py"
Cohesion: 0.24
Nodes (4): _build_citations(), _build_context(), _local_synthesis(), RAGEngine

### Community 8 - "Implementation Plan: Chat Interface with RAG Tool for Smart Threat Response Assistant"
Cohesion: 0.09
Nodes (18): 1.1 Configuration, 1.2 Pydantic Schemas, 1.3 Chat Engine Service, 1.4 Chat Router, 1.5 Dependencies, 1. Backend Changes, 2.1 API Client Extension, 2.2 Chat Component (+10 more)

### Community 10 - "auth_service.py"
Cohesion: 0.24
Nodes (6): login(), authenticate(), create_access_token(), get_user_by_username(), _hash_password(), _verify_password()

### Community 11 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

## Knowledge Gaps
- **4 isolated node(s):** `backend`, `@types/react`, `@types/react-dom`, `oxlint`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 103 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VectorStore` connect `VectorStore` to `Implementation Plan: Chat Interface with RAG Tool for Smart Threat Response Assistant`, `sop_routes.py`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `User` (e.g. with `read_current_user()` and `archive_session()`) actually correct?**
  _`User` has 20 INFERRED edges - model-reasoned connections that need verification._
- **What connects `backend`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Why does `User` connect `chat_routes.py` to `User`, `auth_service.py`, `sop_routes.py`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `SOPManager` (e.g. with `SOPChunk` and `SOPDocument`) actually correct?**
  _`SOPManager` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `chat_routes.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11794871794871795 - nodes in this community are weakly interconnected._