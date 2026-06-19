// Book status badge styled to the prototype. PENDING/PROCESSING read as "in
// progress"; DONE as ready; FAILED as an error.
const MAP: Record<string, { label: string; cls: string }> = {
  DONE: { label: "● Готова", cls: "bg-[#dcffe9] text-[#1f9254]" },
  PROCESSING: { label: "◴ Создаётся…", cls: "bg-[#fff1d6] text-[#b07d12]" },
  PENDING: { label: "◴ Создаётся…", cls: "bg-[#fff1d6] text-[#b07d12]" },
  FAILED: { label: "⚠ Ошибка", cls: "bg-[#ffe0e0] text-[#c0392b]" },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, cls: "bg-border text-muted" };
  return (
    <span className={`rounded-pill px-2.5 py-1 text-[11px] font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}
