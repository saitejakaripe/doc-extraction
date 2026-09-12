import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import schemas
from .database import Document, CorrectionHistory, SessionLocal, init_db, get_db
from .ocr import extract_text_from_file
from .llm import extract_fields_from_text, ExtractionError

load_dotenv()

app = FastAPI(title="Document Extraction Dashboard API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/documents/upload", response_model=schemas.DocumentDetailOut)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_bytes = await file.read()

    doc = Document(filename=file.filename, file_type="other", status="processing")
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Run OCR
    try:
        raw_text = extract_text_from_file(file_bytes, file.filename)
        doc.raw_text = raw_text
    except Exception as exc:  # OCR failures shouldn't crash the request
        doc.status = "failed"
        doc.error_message = f"OCR failed: {exc}"
        db.commit()
        db.refresh(doc)
        return doc

    # Run LLM structuring
    try:
        fields = extract_fields_from_text(raw_text)
        doc.extracted_json = json.dumps(fields)
        doc.status = "done"
    except ExtractionError as exc:
        doc.status = "needs_review"
        doc.error_message = str(exc)
    except Exception as exc:
        doc.status = "failed"
        doc.error_message = f"LLM extraction failed: {exc}"

    db.commit()
    db.refresh(doc)
    return doc


@app.get("/api/documents", response_model=list[schemas.DocumentOut])
def list_documents(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(Document)
        .order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@app.get("/api/documents/{doc_id}", response_model=schemas.DocumentDetailOut)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@app.patch("/api/documents/{doc_id}", response_model=schemas.DocumentDetailOut)
def update_field(doc_id: int, update: schemas.FieldUpdate, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    fields = json.loads(doc.extracted_json) if doc.extracted_json else {}
    original_value = fields.get(update.field_name)

    # Only log + write if the value actually changed
    if original_value != update.new_value:
        db.add(
            CorrectionHistory(
                document_id=doc.id,
                field_name=update.field_name,
                original_value=json.dumps(original_value),
                corrected_value=json.dumps(update.new_value),
            )
        )
        fields[update.field_name] = update.new_value
        doc.extracted_json = json.dumps(fields)
        db.commit()
        db.refresh(doc)

    return doc


@app.get("/api/stats", response_model=schemas.StatsOut)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Document).count()
    processed = db.query(Document).filter(Document.status == "done").count()
    failed = db.query(Document).filter(Document.status == "failed").count()
    total_corrections = db.query(CorrectionHistory).count()

    avg_corrections = round(total_corrections / total, 2) if total else 0.0

    return schemas.StatsOut(
        total_documents=total,
        processed=processed,
        failed=failed,
        total_corrections=total_corrections,
        avg_corrections_per_document=avg_corrections,
    )
