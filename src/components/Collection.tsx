"use client";

import { useState, useEffect } from "react";
import { getAllItems, getCollectedItems, resetCollection } from "@/lib/rewards";
import PixelItem from "./PixelItem";
import Link from "next/link";

export default function Collection() {
  const [collected, setCollected] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const allItems = getAllItems();

  useEffect(() => {
    setCollected(getCollectedItems());
  }, []);

  const handleReset = () => {
    resetCollection();
    setCollected([]);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4 pb-24">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-green-700 text-sm mb-4 inline-block hover:underline">
          ← もどる
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          アイテムコレクション
        </h1>
        <p className="text-center text-gray-500 mb-4">
          {collected.length} / {allItems.length} あつめた！
        </p>
        <div className="bg-white/80 rounded-xl p-2 shadow-sm border border-gray-200">
          <div className="grid grid-cols-4 gap-2">
            {allItems.map((item) => {
              const isCollected = collected.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 ${
                    isCollected
                      ? "bg-amber-50 border border-amber-200"
                      : "bg-gray-100 border border-gray-200"
                  }`}
                >
                  {isCollected ? (
                    <>
                      <PixelItem item={item} size={48} />
                      <span className="text-[10px] text-gray-600 mt-1 text-center leading-tight">
                        {item.nameJa}
                      </span>
                    </>
                  ) : (
                    <div className="text-3xl text-gray-300">？</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <div className="mt-6 text-center">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-gray-400 text-xs underline hover:text-gray-600"
            >
              コレクションをリセット
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm font-bold mb-3">
                ほんとうに ぜんぶ けしていい？
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-bold active:scale-95"
                >
                  やめる
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold active:scale-95"
                >
                  リセットする
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
