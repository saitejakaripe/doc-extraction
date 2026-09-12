export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-rule bg-paper-light px-5 py-4">
      <div className="font-mono text-xs text-ink-soft">{label}</div>
      <div className="font-display text-3xl text-ink mt-1">{value}</div>
    </div>
  );
}
