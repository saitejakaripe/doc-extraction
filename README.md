# Ledger — Document Extraction Dashboard

Upload an invoice, receipt, or shipping manifest. It gets OCR'd, an LLM
structures it into clean JSON (vendor, date, line items, total), and you
review/correct the result in a table. Every correction is logged, so you can
point to real numbers on how often the model got things right.

**Stack:** Next.js 14 + TypeScript + Tailwind (frontend) · FastAPI (backend)
· SQLite (database) · Tesseract (OCR) · Groq / Llama 3.3 70B (extraction)

---

## 1. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

You also need the Tesseract OCR binary itself (pytesseract is just a wrapper
around it):

```bash
# macOS
brew install tesseract poppler

# Ubuntu/Debian
sudo apt-get install tesseract-ocr poppler-utils

# Windows: install from https://github.com/UB-Mannheim/tesseract/wiki
# and https://github.com/oschwartz10612/poppler-windows/releases
```

`poppler` is needed by `pdf2image` to rasterize PDF pages before OCR.

Get a free Groq API key at **console.groq.com/keys** (no credit card
required), then:

```bash
cp .env.example .env
# open .env and paste your GROQ_API_KEY in
```

Run the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/api/health` — you should see `{"status":"ok"}`.
Interactive API docs are at `http://localhost:8000/docs`.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`. It talks to the backend at
`http://localhost:8000` by default — set `NEXT_PUBLIC_API_URL` in a
`.env.local` file if you're running the backend somewhere else.

## 3. Try it

1. Go to `/upload`, drop in an invoice or receipt (PDF or image — a photo
   of a real receipt works too).
2. It'll extract vendor, date, line items, and total.
3. Click any field to correct it — that correction gets logged.
4. Check the dashboard's "avg. corrections / doc" stat — that's your real
   accuracy signal for interviews, once you've run a handful of documents
   through it.

---

## Notes for extending this

- **Swap OCR providers:** everything OCR-related lives in `backend/app/ocr.py`.
  If Tesseract's accuracy isn't good enough on messy scans, swap in AWS
  Textract or Google Document AI there — same function signature.
- **Swap or compare LLMs:** `backend/app/llm.py` is the only file that talks
  to Groq. Worth duplicating this with an OpenAI (gpt-4o-mini) version and
  running both against the same 10-20 test documents — logging which one
  produced fewer corrections gives you a genuinely interesting "why I chose
  this model" story for interviews.
- **Move off SQLite:** swap `DATABASE_URL` in `.env` for a Postgres/Supabase
  connection string. SQLAlchemy handles both without code changes.
- **Deploy:** frontend → Vercel. Backend → Render or Railway (both have free
  tiers with cold starts, which is fine for a portfolio demo). Database →
  Supabase's free Postgres tier once you migrate off SQLite.

## Project structure

```
backend/
  app/
    main.py        # FastAPI routes
    database.py     # SQLAlchemy models (Document, CorrectionHistory)
    schemas.py       # Pydantic request/response shapes
    ocr.py           # File -> raw text
    llm.py           # Raw text -> structured JSON via Groq
  requirements.txt
  .env.example

frontend/
  app/
    page.tsx                    # Dashboard
    upload/page.tsx             # Upload flow
    documents/[id]/page.tsx     # Editable results view
  components/
    StatCard.tsx
    StatusBadge.tsx
  lib/api.ts                    # Typed API client
```
