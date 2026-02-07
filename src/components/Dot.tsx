"use client";

interface DotProps {
  size?: number;
  selected?: boolean;
  animating?: boolean;
  className?: string;
}

export default function Dot({
  size = 32,
  selected = false,
  animating = false,
  className = "",
}: DotProps) {
  return (
    <div
      className={`rounded-full border-2 transition-colors duration-150
        ${selected
          ? "bg-yellow-400 border-yellow-200 shadow-lg shadow-yellow-400/40"
          : "bg-green-500 border-green-300"
        }
        ${animating ? "opacity-0 scale-0" : ""}
        ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
}
