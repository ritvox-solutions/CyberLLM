import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from app.models.schemas import SOPDocument, SOPChunk
from app.services.sop_manager import sop_manager
from app.services.vector_store import vector_store

router = APIRouter(prefix="/sops", tags=["SOP Knowledge Base"])

@router.get("", response_model=List[dict])
async def list_sops():
    return sop_manager.get_all_sops()

@router.get("/{sop_id}/chunks", response_model=List[SOPChunk])
async def get_sop_details(sop_id: str):
    chunks = sop_manager.get_sop_chunks(sop_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="SOP not found or has no chunks")
    return chunks

@router.post("/upload", response_model=SOPDocument)
async def upload_sop(
    file: UploadFile = File(...),
    sop_id: str = Form(...),
    title: str = Form(...),
    category: str = Form(...)
):
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".txt", ".md"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload PDF, TXT, or MD documents."
        )

    # Read uploaded file content
    content_bytes = await file.read()
    temp_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "sops", f"temp_{filename}")
    
    with open(temp_path, "wb") as f:
        f.write(content_bytes)
        
    try:
        raw_text = sop_manager.parse_file(temp_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the uploaded document.")

    doc = sop_manager.register_sop(
        sop_id=sop_id,
        title=title,
        filename=filename,
        category=category,
        content=raw_text
    )
    return doc
