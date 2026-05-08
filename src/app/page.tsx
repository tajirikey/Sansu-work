"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCollectedItems, getAllItems } from "@/lib/rewards";
import PixelItem from "@/components/PixelItem";

const rooms = [
  {
    href: "/bundling",
    title: "まとめてみよう",
    subtitle: "10こあつめて たばにしよう",
    emoji: "🟢",
    bgColor: "from-green-500 to-green-600",
    borderColor: "border-green-400",
  },
  {
    href: "/place-value",
    title: "かずくんハウス",
    subtitle: "百・十・一 のへやにいれよう",
    emoji: "🏠",
    bgColor: "from-blue-500 to-blue-600",
    borderColor: "border-blue-400",
  },
  {
    href: "/number-line",
    title: "かぞえよう",
    subtitle: "つぎのかずは なにかな？",
    emoji: "🔢",
    bgColor: "from-purple-500 to-purple-600",
    borderColor: "border-purple-400",
  },
  {
    href: "/slot",
    title: "かずをつくろう",
    subtitle: "スロットで 3けたの かずをつくろう",
    emoji: "🎰",
    bgColor: "from-orange-500 to-orange-600",
    borderColor: "border-orange-400",
  },
  {
    href: "/sakuranbo",
    title: "さくらんぼけいさん",
    subtitle: "わけて たして ひいてみよう",
    emoji: "🌸",
    bgColor: "from-pink-500 to-pink-600",
    borderColor: "border-pink-400",
  },
  {
    href: "/pair-ten",
    title: "ペアさがし",
    subtitle: "あわせておなじかずになるペアをみつけよう",
    emoji: "🔟",
    bgColor: "from-cyan-500 to-cyan-600",
    borderColor: "border-cyan-400",
  },
  {
    href: "/balance",
    title: "すうじてんびん",
    subtitle: "どちらが おおきい？ くらべてみよう",
    emoji: "⚖️",
    bgColor: "from-indigo-500 to-indigo-600",
    borderColor: "border-indigo-400",
  },
  {
    href: "/shopping",
    title: "おかいものゲーム",
    subtitle: "コインをえらんで おかいものしよう",
    emoji: "🛒",
    bgColor: "from-emerald-500 to-emerald-600",
    borderColor: "border-emerald-400",
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
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-4xl font-bold text-green-700 mb-1">かずのへや</h1>
        <p className="text-gray-500 text-sm">さんすうの ぼうけんに でかけよう！</p>
      </div>

      <Link href="/collection" className="block mx-4 mb-6">
        <div className="bg-white/80 rounded-xl p-3 border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-amber-700 font-bold text-sm">アイテムコレクション</p>
            <p className="text-gray-400 text-xs">{collected.length} / {allItems.length} あつめた！</p>
          </div>
          <div className="flex gap-1">
            {recentItems.length > 0 ? (
              recentItems.map((item) => <PixelItem key={item.id} item={item} size={32} />)
            ) : (
              <span className="text-gray-400 text-xs">もんだいをクリアしてゲット！</span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 space-y-4 pb-8">
        {rooms.map((room) => (
          <Link key={room.href} href={room.href} className="block">
            <div className={`bg-gradient-to-r ${room.bgColor} rounded-2xl p-6 border-2 ${room.borderColor} shadow-md active:scale-[0.98] transition-transform`}>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{room.emoji}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{room.title}</h2>
                  <p className="text-white/80 text-sm mt-1">{room.subtitle}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
