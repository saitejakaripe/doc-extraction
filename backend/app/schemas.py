from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class LineItem(BaseModel):
    description: Optional[str] = None
    quantity: Optional[str] = None
    unit_price: Optional[str] = None


class ExtractedFields(BaseModel):
    """The structured shape we ask the LLM to return.

    Kept loose (mostly optional strings) on purpose: real documents are
    messy, and a schema that crashes on a missing field is worse than one
    that surfaces a blank for a human to fill in.
    """

    vendor_name: Optional[str] = None
    document_date: Optional[str] = None
    line_items: list[LineItem] = []
    total_amount: Optional[str] = None


class DocumentOut(BaseModel):
    id: int
    filename: str
    file_type: str
    status: str
    error_message: Optional[str] = None
    extracted_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentDetailOut(DocumentOut):
    raw_text: Optional[str] = None


class FieldUpdate(BaseModel):
    field_name: str
    new_value: Any


class StatsOut(BaseModel):
    total_documents: int
    processed: int
    failed: int
    total_corrections: int
    avg_corrections_per_document: float
