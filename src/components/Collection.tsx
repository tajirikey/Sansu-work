"use client";

import { useState, useEffect } from "react";
import { getAllItems, getCollectedItems } from "@/lib/rewards";
import PixelItem from "./PixelItem";
import Link from "next/link";

export default function Collection() {
  const [collected, setCollected] = useState<string[]>([]);
  const allItems = getAllItems();

  useEffect(() => {
    setCollected(getCollectedItems());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 p-4 pb-24">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-yellow-400 text-sm mb-4 inline-block hover:underline">
          ← もどる
        </Link>
        <h1 className="text-2xl font-bold text-yellow-300 text-center mb-2">
          アイテムコレクション
        </h1>
        <p className="text-center text-gray-400 mb-6">
          {collected.length} / {allItems.length} あつめた！
        </p>
        <div className="bg-gray-800/50 rounded-xl p-2">
          <div className="grid grid-cols-4 gap-2">
            {allItems.map((item) => {
              const isCollected = collected.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 ${
                    isCollected
                      ? "bg-gray-700/80 border border-gray-600"
                      : "bg-gray-900/80 border border-gray-800"
                  }`}
                >
                  {isCollected ? (
                    <>
                      <PixelItem item={item} size={48} />
                      <span className="text-[10px] text-gray-300 mt-1 text-center leading-tight">
                        {item.nameJa}
                      </span>
                    </>
                  ) : (
                    <div className="text-3xl text-gray-700">？</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
