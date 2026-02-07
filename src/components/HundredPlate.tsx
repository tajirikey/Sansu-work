"use client";

interface HundredPlateProps {
  className?: string;
}

export default function HundredPlate({ className = "" }: HundredPlateProps) {
  const dotSize = 5;
  const gap = 1;

  return (
    <div
      className={`inline-flex flex-col p-2 rounded-lg border-2 bg-red-900/50 border-red-500 ${className}`}
      style={{ gap: gap * 2 }}
    >
      {/* 10 rows of 10 dots = 100 */}
      {Array.from({ length: 10 }).map((_, row) => (
        <div key={row} className="flex" style={{ gap }}>
          {Array.from({ length: 10 }).map((_, col) => (
            <div
              key={col}
              className="rounded-full bg-green-500"
              style={{ width: dotSize, height: dotSize }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
