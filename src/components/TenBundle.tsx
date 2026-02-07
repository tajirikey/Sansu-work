"use client";

interface TenBundleProps {
  selected?: boolean;
  dotSize?: number;
  className?: string;
}

export default function TenBundle({
  selected = false,
  dotSize = 12,
  className = "",
}: TenBundleProps) {
  const gap = Math.max(2, Math.floor(dotSize * 0.15));

  return (
    <div
      className={`inline-flex flex-col p-1.5 rounded-lg border-2 transition-colors duration-150
        ${selected
          ? "bg-yellow-500/30 border-yellow-400"
          : "bg-blue-900/50 border-blue-500"
        }
        ${className}`}
      style={{ gap }}
    >
      {[0, 1].map((row) => (
        <div key={row} className="flex" style={{ gap }}>
          {[0, 1, 2, 3, 4].map((col) => (
            <div
              key={col}
              className="rounded-full bg-green-500 border border-green-300"
              style={{ width: dotSize, height: dotSize }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
