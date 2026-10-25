import Link from "next/link";

export function BackButton({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="もどる" className="back-btn flex-shrink-0">
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
        <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

interface GameHeaderProps {
  title: string;
  /** accent colour for the title dot */
  accent: string;
  right?: React.ReactNode;
  className?: string;
}

/** Shared top bar: round back button · title · optional right slot. */
export default function GameHeader({ title, accent, right, className = "" }: GameHeaderProps) {
  return (
    <header className={`flex items-center gap-2 flex-shrink-0 mb-2 ${className}`}>
      <BackButton />
      <h1 className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-ink font-black text-base tracking-wide truncate">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: accent }} />
        {title}
      </h1>
      <div className="min-w-10 flex items-center justify-end gap-1.5 flex-shrink-0">{right}</div>
    </header>
  );
}
