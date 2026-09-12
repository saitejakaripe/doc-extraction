import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./documents.db")

# check_same_thread=False is needed for SQLite + FastAPI's threaded workers.
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Document(Base):
    """One uploaded file and everything we know about it."""

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # invoice / receipt / manifest / other
    raw_text = Column(Text, nullable=True)
    extracted_json = Column(Text, nullable=True)  # stored as JSON string
    status = Column(String, default="processing")  # processing | done | failed | needs_review
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    corrections = relationship(
        "CorrectionHistory", back_populates="document", cascade="all, delete-orphan"
    )


class CorrectionHistory(Base):
    """Every time a human edits a field, we log the before/after here.

    This is the data that lets you say, in an interview, exactly how often
    the model got fields wrong and which fields were least reliable.
    """

    __tablename__ = "correction_history"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    field_name = Column(String, nullable=False)
    original_value = Column(Text, nullable=True)
    corrected_value = Column(Text, nullable=True)
    corrected_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="corrections")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
