const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type DocumentStatus = "processing" | "done" | "failed" | "needs_review";

export interface DocumentSummary {
  id: number;
  filename: string;
  file_type: string;
  status: DocumentStatus;
  error_message: string | null;
  extracted_json: string | null;
  created_at: string;
}

export interface DocumentDetail extends DocumentSummary {
  raw_text: string | null;
}

export interface Stats {
  total_documents: number;
  processed: number;
  failed: number;
  total_corrections: number;
  avg_corrections_per_document: number;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Request failed (${res.status}): ${body}`);
  }
  return res.json();
}

export async function uploadDocument(file: File): Promise<DocumentDetail> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/documents/upload`, {
    method: "POST",
    body: formData,
  });
  return handle<DocumentDetail>(res);
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const res = await fetch(`${API_BASE}/api/documents`, { cache: "no-store" });
  return handle<DocumentSummary[]>(res);
}

export async function getDocument(id: number): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, { cache: "no-store" });
  return handle<DocumentDetail>(res);
}

export async function updateField(
  id: number,
  fieldName: string,
  newValue: unknown
): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field_name: fieldName, new_value: newValue }),
  });
  return handle<DocumentDetail>(res);
}

export async function getStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/api/stats`, { cache: "no-store" });
  return handle<Stats>(res);
}
