from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.auth_routes import router as auth_router
from app.api.alert_routes import router as alert_router
from app.api.sop_routes import router as sop_router
from app.api.triage_routes import router as triage_router
from app.api.audit_routes import router as audit_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SOP-guided cybersecurity incident response assistant leveraging RAG and LLMs with cryptographic audit trails.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(alert_router, prefix=settings.API_V1_STR)
app.include_router(sop_router, prefix=settings.API_V1_STR)
app.include_router(triage_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "api_docs": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
