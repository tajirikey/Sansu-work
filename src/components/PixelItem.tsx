"use client";

import { MinecraftItem } from "@/lib/rewards";

interface PixelItemProps {
  item: MinecraftItem;
  size?: number;
  className?: string;
}

export default function PixelItem({ item, size = 64, className = "" }: PixelItemProps) {
  const cellSize = size / 8;

  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {item.pixels.map((row, y) =>
          row.map((color, x) =>
            color ? (
              <rect
                key={`${x}-${y}`}
                x={x * cellSize}
                y={y * cellSize}
                width={cellSize + 0.5}
                height={cellSize + 0.5}
                fill={color}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
