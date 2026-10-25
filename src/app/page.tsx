"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCollectedItems, getAllItems } from "@/lib/rewards";
import PixelItem from "@/components/PixelItem";

/* ── Game icon mini-illustrations (SVG-based) ── */

function IconBundling() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Loose dots */}
      {[12, 24, 36, 48].map((x, i) => (
        <circle key={i} cx={x} cy={14} r={5} fill="#4ADE80" stroke="#16A34A" strokeWidth={1.5} />
      ))}
      {/* Arrow */}
      <path d="M32 24 L32 34" stroke="#666" strokeWidth={2} markerEnd="url(#arr)" />
      <defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#666"/></marker></defs>
      {/* Bundle bar */}
      <rect x={14} y={38} width={36} height={12} rx={4} fill="#3B82F6" stroke="#2563EB" strokeWidth={1.5} />
      <text x={32} y={48} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">10</text>
    </svg>
  );
}

function IconPlaceValue() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Three houses */}
      {[{x:8,c:"#EF4444",l:"百"},{x:26,c:"#3B82F6",l:"十"},{x:44,c:"#22C55E",l:"一"}].map((h) => (
        <g key={h.l}>
          <rect x={h.x} y={24} width={16} height={20} rx={2} fill={h.c} opacity={0.2} stroke={h.c} strokeWidth={1.5} />
          <polygon points={`${h.x},24 ${h.x+8},14 ${h.x+16},24`} fill={h.c} opacity={0.3} />
          <text x={h.x+8} y={37} textAnchor="middle" fontSize="8" fill={h.c} fontWeight="bold">{h.l}</text>
        </g>
      ))}
      <text x={32} y={58} textAnchor="middle" fontSize="10" fill="#666" fontWeight="bold">365</text>
    </svg>
  );
}

function IconNumberLine() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <rect x={4} y={20} width={56} height={24} rx={6} fill="#A855F7" opacity={0.15} stroke="#A855F7" strokeWidth={1.5} />
      <text x={14} y={36} fontSize="12" fill="#7C3AED" fontWeight="bold">23</text>
      <text x={28} y={36} fontSize="12" fill="#A855F7" fontWeight="bold">+</text>
      <text x={38} y={36} fontSize="12" fill="#7C3AED" fontWeight="bold">45</text>
      {/* Dots below */}
      {[14,22,30,38,46].map((x,i) => (
        <circle key={i} cx={x} cy={52} r={3} fill="#A855F7" opacity={0.5} />
      ))}
    </svg>
  );
}

function IconSlot() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {[{x:6,c:"#EF4444",n:"3"},{x:24,c:"#3B82F6",n:"7"},{x:42,c:"#22C55E",n:"5"}].map((s) => (
        <g key={s.x}>
          <rect x={s.x} y={12} width={18} height={40} rx={4} fill="white" stroke={s.c} strokeWidth={2} />
          <text x={s.x+9} y={39} textAnchor="middle" fontSize="18" fill={s.c} fontWeight="bold">{s.n}</text>
          {/* Arrow hints */}
          <path d={`M${s.x+9} 8 L${s.x+5} 13 L${s.x+13} 13 Z`} fill={s.c} opacity={0.4} />
          <path d={`M${s.x+9} 56 L${s.x+5} 51 L${s.x+13} 51 Z`} fill={s.c} opacity={0.4} />
        </g>
      ))}
    </svg>
  );
}

function IconSakuranbo() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Stem */}
      <path d="M32 8 Q20 20 16 32" stroke="#EC4899" strokeWidth={2.5} fill="none" />
      <path d="M32 8 Q44 20 48 32" stroke="#EC4899" strokeWidth={2.5} fill="none" />
      {/* Cherries */}
      <circle cx={16} cy={38} r={10} fill="#F472B6" stroke="#EC4899" strokeWidth={1.5} />
      <circle cx={48} cy={38} r={10} fill="#F472B6" stroke="#EC4899" strokeWidth={1.5} />
      <text x={16} y={42} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">3</text>
      <text x={48} y={42} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">5</text>
      {/* Leaf */}
      <ellipse cx={35} cy={10} rx={5} ry={3} fill="#4ADE80" transform="rotate(-20 35 10)" />
    </svg>
  );
}

function IconPairTen() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Two cards */}
      <rect x={6} y={10} width={22} height={28} rx={4} fill="white" stroke="#06B6D4" strokeWidth={2} />
      <text x={17} y={30} textAnchor="middle" fontSize="16" fill="#0891B2" fontWeight="bold">3</text>
      <rect x={36} y={10} width={22} height={28} rx={4} fill="white" stroke="#06B6D4" strokeWidth={2} />
      <text x={47} y={30} textAnchor="middle" fontSize="16" fill="#0891B2" fontWeight="bold">7</text>
      {/* Equals 10 */}
      <text x={32} y={56} textAnchor="middle" fontSize="11" fill="#06B6D4" fontWeight="bold">= 10!</text>
    </svg>
  );
}

function IconBalance() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Fulcrum */}
      <polygon points="32,50 24,58 40,58" fill="#818CF8" />
      {/* Beam - tilted */}
      <line x1={8} y1={38} x2={56} y2={30} stroke="#6366F1" strokeWidth={3} strokeLinecap="round" />
      {/* Left plate */}
      <rect x={2} y={24} width={18} height={14} rx={3} fill="white" stroke="#6366F1" strokeWidth={1.5} />
      <text x={11} y={35} textAnchor="middle" fontSize="10" fill="#4F46E5" fontWeight="bold">85</text>
      {/* Right plate */}
      <rect x={44} y={16} width={18} height={14} rx={3} fill="white" stroke="#6366F1" strokeWidth={1.5} />
      <text x={53} y={27} textAnchor="middle" fontSize="10" fill="#4F46E5" fontWeight="bold">42</text>
    </svg>
  );
}

function IconShopping() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Coins */}
      <circle cx={16} cy={20} r={10} fill="#FBBF24" stroke="#D97706" strokeWidth={1.5} />
      <text x={16} y={24} textAnchor="middle" fontSize="7" fill="#92400E" fontWeight="bold">100</text>
      <circle cx={36} cy={24} r={8} fill="#D4D4D8" stroke="#9CA3AF" strokeWidth={1.5} />
      <text x={36} y={27} textAnchor="middle" fontSize="6" fill="#6B7280" fontWeight="bold">50</text>
      <circle cx={52} cy={20} r={7} fill="#FB923C" stroke="#EA580C" strokeWidth={1.5} />
      <text x={52} y={23} textAnchor="middle" fontSize="6" fill="#9A3412" fontWeight="bold">10</text>
      {/* Price tag */}
      <rect x={12} y={40} width={40} height={16} rx={4} fill="#10B981" />
      <text x={32} y={52} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">120えん</text>
    </svg>
  );
}

function IconHissan() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Grid lines */}
      <rect x={10} y={6} width={44} height={52} rx={4} fill="white" stroke="#0EA5E9" strokeWidth={1.5} opacity={0.5} />
      {/* Upper number */}
      <text x={34} y={20} textAnchor="middle" fontSize="12" fill="#0369A1" fontWeight="bold">34</text>
      {/* + and lower */}
      <text x={16} y={35} fontSize="12" fill="#F97316" fontWeight="bold">+</text>
      <text x={34} y={35} textAnchor="middle" fontSize="12" fill="#0369A1" fontWeight="bold">27</text>
      {/* Line */}
      <line x1={12} y1={39} x2={52} y2={39} stroke="#334155" strokeWidth={2} />
      {/* Answer */}
      <text x={34} y={53} textAnchor="middle" fontSize="12" fill="#16A34A" fontWeight="bold">61</text>
    </svg>
  );
}

const rooms = [
  { href: "/bundling", title: "まとめてみよう", subtitle: "10こで たばに", icon: IconBundling, accent: "#22A55B", tint: "#E2F6E9" },
  { href: "/place-value", title: "かずくんハウス", subtitle: "百・十・一の へや", icon: IconPlaceValue, accent: "#3B7BF0", tint: "#E3EDFF" },
  { href: "/number-line", title: "かぞえよう", subtitle: "たす・ひく", icon: IconNumberLine, accent: "#8B5CF6", tint: "#EFE8FF" },
  { href: "/slot", title: "かずをつくろう", subtitle: "スロットで 3けた", icon: IconSlot, accent: "#F2711C", tint: "#FFEEDF" },
  { href: "/sakuranbo", title: "さくらんぼ", subtitle: "わけて たして", icon: IconSakuranbo, accent: "#E64593", tint: "#FDE7F1" },
  { href: "/pair-ten", title: "ペアさがし", subtitle: "あわせて 10", icon: IconPairTen, accent: "#0AA5BF", tint: "#DDF5F9" },
  { href: "/balance", title: "すうじてんびん", subtitle: "どちらが おおきい？", icon: IconBalance, accent: "#5B5FEF", tint: "#E8E9FF" },
  { href: "/shopping", title: "おかいもの", subtitle: "コインで はらおう", icon: IconShopping, accent: "#0F9F72", tint: "#DDF5EC" },
  { href: "/hissan", title: "ひっさん", subtitle: "ひっさんを かこう", icon: IconHissan, accent: "#0B8FD6", tint: "#DDF1FC" },
];

export default function Home() {
  const [collected, setCollected] = useState<string[]>([]);
  const allItems = getAllItems();

  useEffect(() => {
    setCollected(getCollectedItems());
  }, []);

  const owned = allItems.filter((item) => collected.includes(item.id));
  const latest = owned.slice(-3).reverse();
  const progress = allItems.length ? collected.length / allItems.length : 0;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden dream-dots">
      {/* soft colour blobs */}
      <div className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-pink-200/50 blur-3xl -z-10" />
      <div className="pointer-events-none absolute -top-10 -right-24 w-80 h-80 rounded-full bg-amber-200/50 blur-3xl -z-10" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-sky-200/40 blur-3xl -z-10" />

      <div className="max-w-xl md:max-w-2xl mx-auto px-4 pt-7 md:pt-12 pb-10">
        {/* Title */}
        <header className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center rotate-[-6deg]" style={{ boxShadow: "var(--shadow-soft)" }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7">
              <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#FFD43B" stroke="#F08C00" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-[28px] leading-none font-black tracking-wider text-ink">かずのへや</h1>
            <p className="text-ink-soft text-xs mt-1.5">きょうも さんすうの ぼうけんへ！</p>
          </div>
        </header>

        {/* Collection */}
        <Link href="/collection" className="block mb-6">
          <div className="surface pressable p-3.5 flex items-center gap-3">
            <div className="flex -space-x-3 flex-shrink-0">
              {latest.length > 0 ? (
                latest.map((item, i) => (
                  <div key={item.id} className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-white flex items-center justify-center" style={{ zIndex: 3 - i }}>
                    <PixelItem item={item} size={32} />
                  </div>
                ))
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">🎁</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between">
                <p className="text-ink font-black text-sm">アイテムずかん</p>
                <p className="text-ink-soft text-xs font-bold tabular-nums">
                  <span className="text-amber-600 text-sm">{collected.length}</span> / {allItems.length}
                </p>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-amber-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-pink-400 transition-all duration-700"
                  style={{ width: `${Math.max(progress * 100, collected.length ? 3 : 0)}%` }}
                />
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 20 20" className="text-ink-faint flex-shrink-0" fill="none">
              <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>

        {/* Games */}
        <p className="text-ink-faint text-xs font-bold tracking-[0.3em] mb-2.5 pl-1">あそぶ</p>
        <div className="grid grid-cols-3 gap-3">
          {rooms.map((room) => {
            const Icon = room.icon;
            return (
              <Link key={room.href} href={room.href} className="block">
                <div className="surface pressable rounded-3xl p-2 pb-2.5 h-full">
                  <div className="aspect-square rounded-[1.1rem] p-2.5 flex items-center justify-center" style={{ background: room.tint }}>
                    <Icon />
                  </div>
                  <p className="mt-2 text-center font-black text-[13px] leading-tight tracking-wide" style={{ color: room.accent }}>
                    {room.title}
                  </p>
                  <p className="text-center text-ink-soft text-[10px] leading-tight mt-0.5">{room.subtitle}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
