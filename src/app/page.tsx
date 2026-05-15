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
  {
    href: "/bundling",
    title: "まとめてみよう",
    subtitle: "10こで たばにしよう",
    icon: IconBundling,
    bgColor: "from-green-50 to-emerald-50",
    borderColor: "border-green-300",
    accentColor: "text-green-700",
  },
  {
    href: "/place-value",
    title: "かずくんハウス",
    subtitle: "百・十・一の へや",
    icon: IconPlaceValue,
    bgColor: "from-blue-50 to-sky-50",
    borderColor: "border-blue-300",
    accentColor: "text-blue-700",
  },
  {
    href: "/number-line",
    title: "かぞえよう",
    subtitle: "たす・ひく れんしゅう",
    icon: IconNumberLine,
    bgColor: "from-purple-50 to-violet-50",
    borderColor: "border-purple-300",
    accentColor: "text-purple-700",
  },
  {
    href: "/slot",
    title: "かずをつくろう",
    subtitle: "スロットで 3けた",
    icon: IconSlot,
    bgColor: "from-orange-50 to-amber-50",
    borderColor: "border-orange-300",
    accentColor: "text-orange-700",
  },
  {
    href: "/sakuranbo",
    title: "さくらんぼ",
    subtitle: "わけて たして ひく",
    icon: IconSakuranbo,
    bgColor: "from-pink-50 to-rose-50",
    borderColor: "border-pink-300",
    accentColor: "text-pink-700",
  },
  {
    href: "/pair-ten",
    title: "ペアさがし",
    subtitle: "あわせて 10の ペア",
    icon: IconPairTen,
    bgColor: "from-cyan-50 to-teal-50",
    borderColor: "border-cyan-300",
    accentColor: "text-cyan-700",
  },
  {
    href: "/balance",
    title: "すうじてんびん",
    subtitle: "どちらが おおきい？",
    icon: IconBalance,
    bgColor: "from-indigo-50 to-blue-50",
    borderColor: "border-indigo-300",
    accentColor: "text-indigo-700",
  },
  {
    href: "/shopping",
    title: "おかいもの",
    subtitle: "コインで おかいもの",
    icon: IconShopping,
    bgColor: "from-emerald-50 to-lime-50",
    borderColor: "border-emerald-300",
    accentColor: "text-emerald-700",
  },
  {
    href: "/hissan",
    title: "ひっさん",
    subtitle: "ひっさんを かこう",
    icon: IconHissan,
    bgColor: "from-sky-50 to-cyan-50",
    borderColor: "border-sky-300",
    accentColor: "text-sky-700",
  },
];

export default function Home() {
  const [collected, setCollected] = useState<string[]>([]);
  const allItems = getAllItems();

  useEffect(() => {
    setCollected(getCollectedItems());
  }, []);

  const recentItems = allItems.filter((item) => collected.includes(item.id)).slice(-3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <div className="text-center pt-6 pb-3 px-4">
        <h1 className="text-3xl font-bold text-green-700 mb-0.5">かずのへや</h1>
        <p className="text-gray-400 text-xs">さんすうの ぼうけんに でかけよう！</p>
      </div>

      {/* Collection bar */}
      <Link href="/collection" className="block mx-3 mb-4">
        <div className="bg-white/80 rounded-xl p-2.5 border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-amber-700 font-bold text-xs">アイテムコレクション</p>
            <p className="text-gray-400 text-[10px]">{collected.length} / {allItems.length} あつめた！</p>
          </div>
          <div className="flex gap-1">
            {recentItems.length > 0 ? (
              recentItems.map((item) => <PixelItem key={item.id} item={item} size={28} />)
            ) : (
              <span className="text-gray-400 text-[10px]">ゲームで ゲット！</span>
            )}
          </div>
        </div>
      </Link>

      {/* Game grid */}
      <div className="px-3 pb-8">
        <div className="grid grid-cols-3 gap-2.5">
          {rooms.map((room) => {
            const Icon = room.icon;
            return (
              <Link key={room.href} href={room.href} className="block">
                <div className={`bg-gradient-to-b ${room.bgColor} rounded-2xl border-2 ${room.borderColor} shadow-sm active:scale-95 transition-transform overflow-hidden`}>
                  {/* Icon area */}
                  <div className="aspect-square p-2.5 flex items-center justify-center">
                    <Icon />
                  </div>
                  {/* Label */}
                  <div className="bg-white/70 px-2 py-1.5 text-center border-t border-white/50">
                    <p className={`${room.accentColor} font-bold text-xs leading-tight`}>{room.title}</p>
                    <p className="text-gray-400 text-[9px] leading-tight mt-0.5">{room.subtitle}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
