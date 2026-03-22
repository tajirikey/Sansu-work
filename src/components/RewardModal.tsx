"use client";

import { useEffect, useState } from "react";
import { MinecraftItem, getRandomUncollectedItem, addCollectedItem } from "@/lib/rewards";
import { playLevelUp } from "@/lib/sounds";
import PixelItem from "./PixelItem";

interface RewardModalProps {
  show: boolean;
  onClose: () => void;
}

const RARITY_COLORS = {
  common: "text-gray-500",
  uncommon: "text-green-600",
  rare: "text-blue-600",
  epic: "text-purple-600",
};

const RARITY_BG = {
  common: "from-gray-50 to-gray-100 border-gray-300",
  uncommon: "from-green-50 to-green-100 border-green-300",
  rare: "from-blue-50 to-blue-100 border-blue-300",
  epic: "from-purple-50 to-purple-100 border-purple-300",
};

const RARITY_LABEL = {
  common: "コモン",
  uncommon: "アンコモン",
  rare: "レア",
  epic: "エピック",
};

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

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={!item && revealed ? onClose : undefined}
    >
      <div
        className={`bg-gradient-to-b ${item ? RARITY_BG[item.rarity] : "from-gray-50 to-gray-100 border-gray-300"} rounded-2xl p-8 max-w-sm w-full text-center border-2 shadow-2xl`}
      >
        {!revealed ? (
          <div className="py-12">
            <div className="text-6xl animate-bounce">📦</div>
            <p className="text-amber-600 mt-4 text-lg font-bold">アイテムゲット！</p>
          </div>
        ) : item ? (
          <div className="animate-bounce-in">
            <p className="text-amber-600 text-sm mb-2">★ アイテムゲット！ ★</p>
            <div className="flex justify-center my-6">
              <div className="animate-float">
                <PixelItem item={item} size={120} />
              </div>
            </div>
            <h3 className="text-gray-800 text-2xl font-bold mb-1">{item.nameJa}</h3>
            <p className={`text-sm font-bold ${RARITY_COLORS[item.rarity]}`}>
              {RARITY_LABEL[item.rarity]}
            </p>
            <button
              onClick={onClose}
              className="mt-6 bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors active:scale-95"
            >
              やったね！
            </button>
          </div>
        ) : (
          <div className="py-8">
            <p className="text-amber-600 text-xl font-bold mb-2">🎉 コンプリート！ 🎉</p>
            <p className="text-gray-700">ぜんぶのアイテムをあつめたよ！</p>
            <p className="text-gray-400 text-sm mt-4 animate-pulse">タップして とじる</p>
          </div>
        )}
      </div>
    </div>
  );
}
