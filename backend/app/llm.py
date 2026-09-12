"""Calls an LLM to turn messy OCR text into clean, structured JSON.

Using Groq here because it's free to prototype against and fast enough that
the upload endpoint doesn't feel sluggish in a demo. If you want to compare
accuracy against OpenAI's gpt-4o-mini later (worth doing — see the resume
notes on this project), you'd swap the client + model here and log both
results side by side.
"""

import json
import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

EXTRACTION_PROMPT = """You are a document data extraction engine. You will be
given raw OCR text from a business document (an invoice, receipt, or
shipping manifest). Extract the following fields and return ONLY valid JSON,
with no markdown code fences and no commentary:

{
  "vendor_name": string or null,
  "document_date": string or null (keep the original format you find),
  "line_items": [
    {"description": string, "quantity": string or null, "unit_price": string or null}
  ],
  "total_amount": string or null
}

If a field cannot be found in the text, use null rather than guessing.
If there are no clear line items, return an empty list.

OCR TEXT:
---
{text}
---
"""


class ExtractionError(Exception):
    pass


def extract_fields_from_text(raw_text: str) -> dict:
    if not raw_text or not raw_text.strip():
        raise ExtractionError("OCR produced no text to extract fields from.")

    prompt = EXTRACTION_PROMPT.replace("{text}", raw_text[:12000])  # keep prompt bounded

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise ExtractionError(f"Model did not return valid JSON: {exc}") from exc
