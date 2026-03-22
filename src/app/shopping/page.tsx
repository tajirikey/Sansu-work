"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { playPop, playSuccess, playError, playBundle } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

/* ═══════════════════════════════════════════════
   おかいものゲーム - Shopping Game with Coins
   ═══════════════════════════════════════════════ */

interface Product {
  name: string;
  emoji: string;
  price: number;
}

const PRODUCTS: Product[] = [
  { name: "りんご", emoji: "🍎", price: 120 },
  { name: "バナナ", emoji: "🍌", price: 80 },
  { name: "ケーキ", emoji: "🍰", price: 350 },
  { name: "ジュース", emoji: "🧃", price: 150 },
  { name: "パン", emoji: "🍞", price: 90 },
  { name: "アイス", emoji: "🍦", price: 200 },
  { name: "おにぎり", emoji: "🍙", price: 110 },
  { name: "チョコ", emoji: "🍫", price: 60 },
  { name: "ドーナツ", emoji: "🍩", price: 130 },
  { name: "いちご", emoji: "🍓", price: 250 },
  { name: "クッキー", emoji: "🍪", price: 70 },
  { name: "キャンディ", emoji: "🍬", price: 30 },
  { name: "みかん", emoji: "🍊", price: 40 },
  { name: "ぶどう", emoji: "🍇", price: 180 },
  { name: "すいか", emoji: "🍉", price: 500 },
];

interface CoinCount {
  c500: number;
  c100: number;
  c50: number;
  c10: number;
  c1: number;
}

const COIN_VALUES: { key: keyof CoinCount; value: number; label: string; color: string; size: string }[] = [
  { key: "c500", value: 500, label: "500", color: "from-yellow-300 to-yellow-500", size: "w-16 h-16" },
  { key: "c100", value: 100, label: "100", color: "from-gray-200 to-gray-400", size: "w-14 h-14" },
  { key: "c50", value: 50, label: "50", color: "from-yellow-200 to-yellow-400", size: "w-13 h-13" },
  { key: "c10", value: 10, label: "10", color: "from-amber-200 to-amber-400", size: "w-12 h-12" },
  { key: "c1", value: 1, label: "1", color: "from-gray-300 to-gray-500", size: "w-10 h-10" },
];

function calcTotal(coins: CoinCount): number {
  return coins.c500 * 500 + coins.c100 * 100 + coins.c50 * 50 + coins.c10 * 10 + coins.c1 * 1;
}

function pickProduct(level: number): Product {
  let pool: Product[];
  if (level <= 2) {
    // Simple prices (multiples of 10, under 100)
    pool = PRODUCTS.filter((p) => p.price <= 100 && p.price % 10 === 0);
  } else if (level <= 4) {
    pool = PRODUCTS.filter((p) => p.price <= 200);
  } else {
    pool = PRODUCTS;
  }
  if (pool.length === 0) pool = PRODUCTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function ShoppingPage() {
  const [level, setLevel] = useState(1);
  const [product, setProduct] = useState<Product>(() => pickProduct(1));
  const [coins, setCoins] = useState<CoinCount>({ c500: 0, c100: 0, c50: 0, c10: 0, c1: 0 });
  const [phase, setPhase] = useState<"shopping" | "correct" | "over" | "under">("shopping");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [problemCount, setProblemCount] = useState(0);
  const [showReward, setShowReward] = useState(false);

  const total = calcTotal(coins);
  const diff = total - product.price;

  const addCoin = useCallback((key: keyof CoinCount) => {
    if (phase !== "shopping") return;
    playPop();
    setCoins((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  }, [phase]);

  const removeCoin = useCallback((key: keyof CoinCount) => {
    if (phase !== "shopping") return;
    setCoins((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
  }, [phase]);

  const handlePay = useCallback(() => {
    if (phase !== "shopping") return;

    if (total === product.price) {
      playBundle();
      setScore((s) => s + 10 + (level > 4 ? 5 : 0));
      setStreak((s) => {
        const ns = s + 1;
        if (ns > 0 && ns % 3 === 0) {
          setTimeout(() => setShowReward(true), 800);
        }
        return ns;
      });
      setProblemCount((c) => c + 1);
      setPhase("correct");
    } else if (total > product.price) {
      playError();
      setPhase("over");
    } else {
      playError();
      setPhase("under");
    }
  }, [phase, total, product.price, level]);

  const next = useCallback(() => {
    const newLevel = Math.min(6, 1 + Math.floor(score / 25));
    setLevel(newLevel);
    setProduct(pickProduct(newLevel));
    setCoins({ c500: 0, c100: 0, c50: 0, c10: 0, c1: 0 });
    setPhase("shopping");
  }, [score]);

  const retry = useCallback(() => {
    setCoins({ c500: 0, c100: 0, c50: 0, c10: 0, c1: 0 });
    setPhase("shopping");
    setStreak(0);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50 to-lime-50 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-emerald-700 text-sm hover:underline">
            &larr; もどる
          </Link>
          <span className="text-emerald-600 text-sm font-bold">おかいものゲーム</span>
        </div>

        {/* Stats bar */}
        <div className="bg-white/90 border border-emerald-200 rounded-2xl p-3 mb-3 shadow-sm">
          <div className="flex items-center justify-between text-center">
            <div>
              <p className="text-gray-400 text-[10px]">スコア</p>
              <p className="text-emerald-600 font-bold text-lg">{score}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px]">れんぞく</p>
              <p className="text-orange-500 font-bold text-lg">{streak}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px]">レベル</p>
              <p className="text-purple-600 font-bold text-lg">{level}</p>
            </div>
          </div>
        </div>

        {/* Product card */}
        <div className="bg-white/90 border-2 border-emerald-200 rounded-2xl p-4 mb-3 shadow-md text-center">
          <p className="text-5xl mb-2">{product.emoji}</p>
          <p className="text-emerald-700 font-bold text-lg">{product.name}</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            {product.price}<span className="text-base text-gray-400">えん</span>
          </p>
        </div>

        {/* Coins area */}
        <div className="bg-white/80 border border-gray-200 rounded-2xl p-3 mb-3 shadow-sm">
          <p className="text-center text-xs text-gray-400 mb-2 font-bold">コインを えらんで おかいもの！</p>
          <div className="flex flex-wrap justify-center gap-2">
            {COIN_VALUES.map((coin) => (
              <div key={coin.key} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => addCoin(coin.key)}
                  disabled={phase !== "shopping"}
                  className={`${coin.size} rounded-full bg-gradient-to-b ${coin.color} border-2 border-white shadow-md flex items-center justify-center active:scale-90 transition-transform select-none touch-manipulation`}
                >
                  <span className="text-white font-black text-xs drop-shadow-md">{coin.label}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => removeCoin(coin.key)}
                    className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center active:scale-90"
                    disabled={coins[coin.key] === 0 || phase !== "shopping"}
                  >
                    −
                  </button>
                  <span className="text-sm font-bold text-gray-600 w-4 text-center">{coins[coin.key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total & pay */}
        <div className="bg-white/90 border border-emerald-200 rounded-2xl p-3 mb-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-[10px]">いま いれたおかね</p>
              <p className={`text-2xl font-black tabular-nums ${total === product.price ? "text-green-500" : total > product.price ? "text-red-500" : "text-gray-700"}`}>
                {total}<span className="text-xs text-gray-400 ml-0.5">えん</span>
              </p>
            </div>
            {phase === "shopping" && (
              <button
                onClick={handlePay}
                disabled={total === 0}
                className="mc-btn text-base px-6 py-2 disabled:opacity-40"
              >
                おかいもの！
              </button>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div className="text-center flex-1 flex flex-col items-center justify-center gap-3">
          {phase === "correct" && (
            <>
              <p className="text-green-600 font-bold text-xl animate-bounce">
                ⭕ ぴったり！ すごい！
              </p>
              <button onClick={next} className="mc-btn text-lg px-8 py-3">
                つぎの おかいもの！
              </button>
            </>
          )}
          {phase === "over" && (
            <>
              <p className="text-red-500 font-bold text-lg">
                おかねが {diff}えん おおいよ！
              </p>
              <button onClick={retry} className="mc-btn text-base px-6 py-2">
                もういちど
              </button>
            </>
          )}
          {phase === "under" && (
            <>
              <p className="text-orange-500 font-bold text-lg">
                あと {product.price - total}えん たりないよ！
              </p>
              <button onClick={retry} className="mc-btn text-base px-6 py-2">
                もういちど
              </button>
            </>
          )}
        </div>
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
