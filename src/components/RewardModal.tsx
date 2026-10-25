"use client";

import { useEffect, useState } from "react";
import { MinecraftItem, getRandomUncollectedItem, addCollectedItem } from "@/lib/rewards";
import { playLevelUp } from "@/lib/sounds";
import PixelItem from "./PixelItem";

interface RewardModalProps {
  show: boolean;
  onClose: () => void;
}

export const RARITY = {
  common: { label: "コモン", color: "#6E6A8F", glow: "#E9E6F2", stars: 1 },
  uncommon: { label: "アンコモン", color: "#1F9D55", glow: "#C9F2D9", stars: 2 },
  rare: { label: "レア", color: "#2F6FE4", glow: "#CFE0FF", stars: 3 },
  epic: { label: "エピック", color: "#9B3FE0", glow: "#EBD5FF", stars: 4 },
} as const;

const SPARKS = [
  { x: "12%", y: "18%", d: "0s", s: 14 },
  { x: "84%", y: "14%", d: "0.3s", s: 10 },
  { x: "90%", y: "62%", d: "0.6s", s: 16 },
  { x: "8%", y: "70%", d: "0.9s", s: 12 },
  { x: "50%", y: "4%", d: "0.45s", s: 10 },
];

function Spark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <path d="M10 0c.8 5.6 3.6 8.4 10 10-6.4 1.6-9.2 4.4-10 10-.8-5.6-3.6-8.4-10-10C6.4 8.4 9.2 5.6 10 0z" fill={color} />
    </svg>
  );
}

export default function RewardModal({ show, onClose }: RewardModalProps) {
  const [item, setItem] = useState<MinecraftItem | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (show) {
      const newItem = getRandomUncollectedItem();
      setItem(newItem);
      setRevealed(false);
      setTimeout(() => {
        setRevealed(true);
        playLevelUp();
        if (newItem) {
          addCollectedItem(newItem.id);
        }
      }, 800);
    }
  }, [show]);

  if (!show) return null;

  const r = item ? RARITY[item.rarity] : RARITY.common;

  return (
    <div
      className="fixed inset-0 bg-[#2d2a4a]/55 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      onClick={!item && revealed ? onClose : undefined}
    >
      <div className="surface relative w-full max-w-sm px-6 pt-8 pb-6 text-center overflow-hidden">
        {!revealed ? (
          <div className="py-10">
            <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-200/70 animate-ping" />
              <div className="relative text-6xl animate-bounce">🎁</div>
            </div>
            <p className="text-amber-600 mt-5 text-lg font-black tracking-wider">なにが でるかな？</p>
          </div>
        ) : item ? (
          <div className="animate-bounce-in">
            {SPARKS.map((p, i) => (
              <span key={i} className="absolute animate-sparkle" style={{ left: p.x, top: p.y, animationDelay: p.d }}>
                <Spark size={p.s} color={i % 2 ? "#FFD43B" : r.color} />
              </span>
            ))}

            <p className="text-amber-500 text-xs font-black tracking-[0.3em]">アイテム ゲット！</p>

            <div className="relative my-5 mx-auto w-44 h-44 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: `radial-gradient(circle, ${r.glow} 0%, ${r.glow}00 70%)` }}
              />
              <div className="relative animate-float">
                <PixelItem item={item} size={128} />
              </div>
            </div>

            <h3 className="text-ink text-2xl font-black tracking-wide">{item.nameJa}</h3>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: r.glow }}>
              <span className="text-xs" style={{ color: r.color }}>{"★".repeat(r.stars)}</span>
              <span className="text-xs font-black" style={{ color: r.color }}>{r.label}</span>
            </div>

            <button
              onClick={onClose}
              className="mc-btn block w-full mt-6"
              style={{ background: "linear-gradient(180deg,#FFB547 0%,#FF9425 100%)", boxShadow: "0 4px 0 0 #D9720F, inset 0 1px 0 rgba(255,255,255,.35)" }}
            >
              やったね！
            </button>
          </div>
        ) : (
          <div className="py-8">
            <p className="text-amber-600 text-xl font-black mb-2">🎉 コンプリート！ 🎉</p>
            <p className="text-ink-soft">ぜんぶの アイテムを あつめたよ！</p>
            <p className="text-ink-faint text-sm mt-4 animate-pulse">タップして とじる</p>
          </div>
        )}
      </div>
    </div>
  );
}
