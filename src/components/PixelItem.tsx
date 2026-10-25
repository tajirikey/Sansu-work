"use client";

import { MinecraftItem } from "@/lib/rewards";
import { rem } from "@/lib/ui";

interface PixelItemProps {
  item: MinecraftItem;
  size?: number;
  className?: string;
  /** paint every pixel this colour (mystery silhouette) */
  silhouette?: string;
}

export default function PixelItem({ item, size = 64, className = "", silhouette }: PixelItemProps) {
  const cellSize = size / item.pixels.length;

  return (
    <div className={`inline-block ${className}`} style={{ width: rem(size), height: rem(size) }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
        {item.pixels.map((row, y) =>
          row.map((color, x) =>
            color ? (
              <rect
                key={`${x}-${y}`}
                x={x * cellSize}
                y={y * cellSize}
                width={cellSize + 0.5}
                height={cellSize + 0.5}
                fill={silhouette ?? color}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
