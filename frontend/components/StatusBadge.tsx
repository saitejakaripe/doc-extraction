import { DocumentStatus } from "@/lib/api";

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string }> = {
  processing: { label: "processing", color: "#8A7B4F" },
  done: { label: "extracted", color: "#5E6E52" },
  needs_review: { label: "needs review", color: "#A13D2B" },
  failed: { label: "failed", color: "#A13D2B" },
};

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.processing;
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs text-ink-soft">
      <span className="status-dot" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}
