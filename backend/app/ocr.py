"""Turns an uploaded file (PDF or image) into raw text via OCR.

Swap points if you outgrow this locally:
- Replace pytesseract with a hosted OCR API (AWS Textract, Google Document AI)
  for better accuracy on messy scans — same function signature, just change
  the implementation of extract_text_from_file.
"""

import io

import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    lower_name = filename.lower()

    if lower_name.endswith(".pdf"):
        pages = convert_from_bytes(file_bytes)
        text_chunks = [pytesseract.image_to_string(page) for page in pages]
        return "\n\n".join(text_chunks).strip()

    # Treat anything else as an image
    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image).strip()
