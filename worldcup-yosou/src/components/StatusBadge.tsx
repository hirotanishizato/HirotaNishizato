import { MATCH_STATUS, MATCH_STATUS_LABEL } from "@/lib/constants";

const STYLES: Record<string, string> = {
  OPEN: "bg-accent/15 text-accent border border-accent/30",
  CLOSED: "bg-amber-400/15 text-amber-300 border border-amber-400/30",
  SETTLED: "bg-sky-400/15 text-sky-300 border border-sky-400/30",
};

const DOT: Record<string, string> = {
  OPEN: "bg-accent",
  CLOSED: "bg-amber-300",
  SETTLED: "bg-sky-300",
};

export function StatusBadge({ status }: { status: string }) {
  const label = MATCH_STATUS_LABEL[status] ?? status;
  return (
    <span className={`badge ${STYLES[status] ?? STYLES.OPEN}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${DOT[status] ?? DOT.OPEN} ${
          status === MATCH_STATUS.OPEN ? "animate-pulse" : ""
        }`}
      />
      {label}
    </span>
  );
}
