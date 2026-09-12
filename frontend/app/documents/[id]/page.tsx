"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDocument, updateField, DocumentDetail } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

interface LineItem {
  description?: string;
  quantity?: string;
  unit_price?: string;
}

interface ExtractedFields {
  vendor_name?: string | null;
  document_date?: string | null;
  total_amount?: string | null;
  line_items?: LineItem[];
}

export default function DocumentDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [fields, setFields] = useState<ExtractedFields>({});
  const [savingField, setSavingField] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    getDocument(id).then((d) => {
      setDoc(d);
      setFields(d.extracted_json ? JSON.parse(d.extracted_json) : {});
    });
  }, [id]);

  async function saveField(fieldName: keyof ExtractedFields, value: string) {
    setSavingField(fieldName);
    const updated = await updateField(id, fieldName, value);
    setFields(updated.extracted_json ? JSON.parse(updated.extracted_json) : {});
    setSavingField(null);
  }

  if (!doc) {
    return <p className="font-mono text-sm text-ink-soft">Loading…</p>;
  }

  if (doc.status === "failed" || doc.status === "needs_review") {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-2xl text-ink mb-2">{doc.filename}</h1>
        <StatusBadge status={doc.status} />
        <p className="mt-4 text-sm text-ink-soft">
          {doc.error_message ?? "This document couldn't be fully processed."}
        </p>
        {doc.raw_text && (
          <details className="mt-6">
            <summary className="font-mono text-sm text-brass cursor-pointer">
              view raw OCR text
            </summary>
            <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-ink-soft border border-rule bg-paper-light p-4">
              {doc.raw_text}
            </pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink mb-1">{doc.filename}</h1>
        <StatusBadge status={doc.status} />
      </div>

      <div className="border border-rule bg-paper-light">
        <EditableRow
          label="vendor"
          value={fields.vendor_name ?? ""}
          onSave={(v) => saveField("vendor_name", v)}
          saving={savingField === "vendor_name"}
        />
        <EditableRow
          label="date"
          value={fields.document_date ?? ""}
          onSave={(v) => saveField("document_date", v)}
          saving={savingField === "document_date"}
        />
        <EditableRow
          label="total"
          value={fields.total_amount ?? ""}
          onSave={(v) => saveField("total_amount", v)}
          saving={savingField === "total_amount"}
          isLast
        />
      </div>

      {fields.line_items && fields.line_items.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-ink mb-3">Line items</h2>
          <div className="border border-rule">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule text-left font-mono text-xs text-ink-soft">
                  <th className="px-4 py-2 font-normal">description</th>
                  <th className="px-4 py-2 font-normal">qty</th>
                  <th className="px-4 py-2 font-normal">unit price</th>
                </tr>
              </thead>
              <tbody>
                {fields.line_items.map((item, i) => (
                  <tr key={i} className="border-b border-rule/60 last:border-0">
                    <td className="px-4 py-2 text-ink">{item.description}</td>
                    <td className="px-4 py-2 font-mono text-ink-soft">{item.quantity}</td>
                    <td className="px-4 py-2 font-mono text-ink-soft">{item.unit_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <button
          onClick={() => setShowRawText(!showRawText)}
          className="font-mono text-sm text-brass hover:text-ink"
        >
          {showRawText ? "hide" : "view"} raw OCR text
        </button>
        {showRawText && (
          <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-ink-soft border border-rule bg-paper-light p-4">
            {doc.raw_text}
          </pre>
        )}
      </div>
    </div>
  );
}

function EditableRow({
  label,
  value,
  onSave,
  saving,
  isLast,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
  saving: boolean;
  isLast?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);

  useEffect(() => setDraft(value), [value]);

  return (
    <div
      className={`flex items-center px-4 py-3 gap-4 ${!isLast ? "border-b border-rule" : ""}`}
    >
      <span className="font-mono text-xs text-ink-soft w-24 shrink-0">{label}</span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft !== value) onSave(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="flex-1 bg-transparent border-b border-brass text-ink outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex-1 text-left text-ink hover:text-brass"
        >
          {value || <span className="text-ink-soft italic">— click to fill in —</span>}
        </button>
      )}
      {saving && <span className="font-mono text-xs text-ink-soft">saving…</span>}
    </div>
  );
}
