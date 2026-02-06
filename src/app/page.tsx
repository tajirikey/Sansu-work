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
    bgColor: "from-green-700 to-green-900",
    borderColor: "border-green-500",
  },
  {
    href: "/place-value",
    title: "くらいのへや",
    subtitle: "百・十・一 のへやにいれよう",
    emoji: "🏠",
    bgColor: "from-blue-700 to-blue-900",
    borderColor: "border-blue-500",
  },
  {
    href: "/number-line",
    title: "かぞえよう",
    subtitle: "つぎのかずは なにかな？",
    emoji: "🔢",
    bgColor: "from-purple-700 to-purple-900",
    borderColor: "border-purple-500",
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-4xl font-bold text-yellow-300 mb-1" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
          かずのへや
        </h1>
        <p className="text-gray-400 text-sm">さんすうの ぼうけんに でかけよう！</p>
      </div>

      {/* Collection preview */}
      <Link href="/collection" className="block mx-4 mb-6">
        <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-yellow-400 font-bold text-sm">アイテムコレクション</p>
            <p className="text-gray-400 text-xs">
              {collected.length} / {allItems.length} あつめた！
            </p>
          </div>
          <div className="flex gap-1">
            {recentItems.length > 0 ? (
              recentItems.map((item) => (
                <PixelItem key={item.id} item={item} size={32} />
              ))
            ) : (
              <span className="text-gray-500 text-xs">もんだいをクリアしてアイテムをゲット！</span>
            )}
          </div>
        </div>
      </Link>

      {/* Room cards */}
      <div className="px-4 space-y-4 pb-8">
        {rooms.map((room, i) => (
          <Link key={room.href} href={room.href} className="block">
            <div
              className={`bg-gradient-to-r ${room.bgColor} rounded-2xl p-6 border-2 ${room.borderColor}
                shadow-lg active:scale-[0.98] transition-transform`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-5xl">{room.emoji}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{room.title}</h2>
                  <p className="text-white/70 text-sm mt-1">{room.subtitle}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
