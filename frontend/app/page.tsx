import Link from "next/link";
import { getStats, listDocuments } from "@/lib/api";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

export default async function DashboardPage() {
  let stats = null;
  let documents: Awaited<ReturnType<typeof listDocuments>> = [];
  let loadError = false;

  try {
    [stats, documents] = await Promise.all([getStats(), listDocuments()]);
  } catch {
    loadError = true;
  }

  if (loadError) {
    return (
      <div className="border border-stamp/40 bg-paper-light px-6 py-8">
        <p className="font-display text-xl text-ink mb-2">Can&apos;t reach the backend</p>
        <p className="text-ink-soft text-sm">
          Make sure the FastAPI server is running at the address in{" "}
          <code className="font-mono">NEXT_PUBLIC_API_URL</code> (defaults to{" "}
          <code className="font-mono">http://localhost:8000</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl text-ink mb-1">The ledger</h1>
        <p className="text-ink-soft text-sm">
          Every document that has passed through extraction, and what came out of it.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="documents" value={stats?.total_documents ?? 0} />
        <StatCard label="extracted" value={stats?.processed ?? 0} />
        <StatCard label="failed" value={stats?.failed ?? 0} />
        <StatCard
          label="avg. corrections / doc"
          value={stats?.avg_corrections_per_document ?? 0}
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl text-ink">Recent uploads</h2>
          <Link href="/upload" className="font-mono text-sm text-brass hover:text-ink">
            upload a document
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="border border-rule bg-paper-light px-6 py-10 text-center">
            <p className="text-ink-soft text-sm">
              Nothing here yet. Upload your first invoice, receipt, or manifest to see it
              extracted.
            </p>
          </div>
        ) : (
          <div className="border border-rule ledger-bg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule text-left font-mono text-xs text-ink-soft">
                  <th className="px-4 py-3 font-normal">file</th>
                  <th className="px-4 py-3 font-normal">status</th>
                  <th className="px-4 py-3 font-normal">uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-rule/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="text-ink hover:text-brass"
                      >
                        {doc.filename}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
