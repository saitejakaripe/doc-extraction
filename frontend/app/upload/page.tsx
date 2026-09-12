"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, DragEvent } from "react";
import { uploadDocument } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        const doc = await uploadDocument(file);
        router.push(`/documents/${doc.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setIsUploading(false);
      }
    },
    [router]
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl text-ink mb-1">Upload a document</h1>
      <p className="text-ink-soft text-sm mb-8">
        An invoice, receipt, or shipping manifest — PDF or image. It'll be OCR&apos;d and
        run through the extraction model, then handed to you to review.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed px-8 py-16 text-center transition-colors ${
          isDragging ? "border-brass bg-paper-light" : "border-rule"
        }`}
      >
        {isUploading ? (
          <p className="font-mono text-sm text-ink-soft">
            Extracting — this takes a few seconds…
          </p>
        ) : (
          <>
            <p className="text-ink mb-4">Drag a file here, or</p>
            <label className="inline-block border border-ink px-4 py-2 font-mono text-sm text-ink cursor-pointer hover:bg-ink hover:text-paper-light transition-colors">
              choose a file
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          </>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-stamp">
          {error} — check that the backend is running and your GROQ_API_KEY is set.
        </p>
      )}
    </div>
  );
}
