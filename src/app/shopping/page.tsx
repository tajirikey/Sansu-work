"use client";

import { useState, useCallback, useMemo } from "react";
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
  { key: "c50", value: 50, label: "50", color: "from-yellow-200 to-yellow-400", size: "w-14 h-14" },
  { key: "c10", value: 10, label: "10", color: "from-amber-200 to-amber-400", size: "w-12 h-12" },
  { key: "c1", value: 1, label: "1", color: "from-gray-300 to-gray-500", size: "w-10 h-10" },
];

function calcTotal(coins: CoinCount): number {
  return coins.c500 * 500 + coins.c100 * 100 + coins.c50 * 50 + coins.c10 * 10 + coins.c1 * 1;
}

function pickProduct(level: number): Product {
  let pool: Product[];
  if (level <= 2) {
    pool = PRODUCTS.filter((p) => p.price <= 100 && p.price % 10 === 0);
  } else if (level <= 4) {
    pool = PRODUCTS.filter((p) => p.price <= 200);
  } else {
    pool = PRODUCTS;
  }
  if (pool.length === 0) pool = PRODUCTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

const SHOP_LEVELS = [
  { label: "かんたん", desc: "〜100えん", startLevel: 1 },
  { label: "ふつう", desc: "〜200えん", startLevel: 3 },
  { label: "むずかしい", desc: "〜500えん", startLevel: 5 },
];

export default function ShoppingPage() {
  const [shopLevelIdx, setShopLevelIdx] = useState(0);
  const [level, setLevel] = useState(1);
  const [product, setProduct] = useState<Product>(() => pickProduct(1));
  const [coins, setCoins] = useState<CoinCount>({ c500: 0, c100: 0, c50: 0, c10: 0, c1: 0 });
  const [phase, setPhase] = useState<"select" | "shopping" | "correct" | "over" | "under">("select");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [hint50, setHint50] = useState("");

  const total = calcTotal(coins);
  const diff = total - product.price;

  // Check if 50円 coin should be used but isn't
  const remaining = product.price - total;
  const should50 = useMemo(() => {
    if (phase !== "shopping") return false;
    return remaining >= 50 && coins.c50 === 0 && remaining < 100;
  }, [phase, remaining, coins.c50]);

  const startWithLevel = (idx: number) => {
    setShopLevelIdx(idx);
    const lv = SHOP_LEVELS[idx].startLevel;
    setLevel(lv);
    setProduct(pickProduct(lv));
    setCoins({ c500: 0, c100: 0, c50: 0, c10: 0, c1: 0 });
    setScore(0);
    setStreak(0);
    setPhase("shopping");
    setHint50("");
  };

  const addCoin = useCallback((key: keyof CoinCount) => {
    if (phase !== "shopping") return;
    playPop();
    setCoins((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    setHint50("");
  }, [phase]);

  const removeCoin = useCallback((key: keyof CoinCount) => {
    if (phase !== "shopping") return;
    setCoins((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
    setHint50("");
  }, [phase]);

  const handlePay = useCallback(() => {
    if (phase !== "shopping") return;

    // If price >= 50 and no 50円 coin used, and using only 10円 coins for the 50s portion, hint
    const rem = product.price - total;
    if (rem > 0 && rem >= 50 && coins.c50 === 0) {
      setHint50("50えんだまも つかってみよう！");
      playError();
      return;
    }

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
      setPhase("correct");
    } else if (total > product.price) {
      playError();
      setPhase("over");
    } else {
      playError();
      setPhase("under");
    }
  }, [phase, total, product.price, level, coins.c50]);

  const next = useCallback(() => {
    const baseLv = SHOP_LEVELS[shopLevelIdx].startLevel;
    const newLevel = Math.min(baseLv + 1, baseLv + Math.floor(score / 25));
    setLevel(newLevel);
    setProduct(pickProduct(newLevel));
    setCoins({ c500: 0, c100: 0, c50: 0, c10: 0, c1: 0 });
    setPhase("shopping");
    setHint50("");
  }, [score, shopLevelIdx]);

  const retry = useCallback(() => {
    setCoins({ c500: 0, c100: 0, c50: 0, c10: 0, c1: 0 });
    setPhase("shopping");
    setStreak(0);
    setHint50("");
  }, []);

  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-b from-emerald-50 to-lime-50 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <Link href="/" className="text-emerald-700 text-sm hover:underline">
            &larr; もどる
          </Link>
          <span className="text-emerald-600 text-sm font-bold">おかいものゲーム</span>
        </div>

        {phase === "select" ? (
          /* Level select */
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-6xl mb-4">🛒</p>
              <h2 className="text-2xl font-bold text-emerald-700 mb-2">おかいものゲーム</h2>
              <p className="text-gray-500 text-sm">コインをえらんで おかいものしよう</p>
            </div>
            <div className="flex gap-3">
              {SHOP_LEVELS.map((lv, i) => (
                <button
                  key={i}
                  onClick={() => startWithLevel(i)}
                  className="px-5 py-3 rounded-xl font-bold transition-all bg-white border-2 border-emerald-200 text-emerald-600 active:scale-95 hover:border-emerald-400 shadow-sm"
                >
                  <span className="block text-base">{lv.label}</span>
                  <span className="block text-[10px] opacity-60 mt-0.5">{lv.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="bg-white/90 border border-emerald-200 rounded-2xl p-3 mb-2 shadow-sm flex-shrink-0">
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
                  <button onClick={() => setPhase("select")} className="text-gray-400 text-[10px] underline">
                    レベルへんこう
                  </button>
                  <p className="text-purple-600 font-bold text-sm">{SHOP_LEVELS[shopLevelIdx].label}</p>
                </div>
              </div>
            </div>

            {/* Product card */}
            <div className="bg-white/90 border-2 border-emerald-200 rounded-2xl p-3 mb-2 shadow-md text-center flex-shrink-0">
              <p className="text-4xl mb-1">{product.emoji}</p>
              <p className="text-emerald-700 font-bold text-base">{product.name}</p>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">
                {product.price}<span className="text-sm text-gray-400">えん</span>
              </p>
            </div>

            {/* Coins area */}
            <div className="bg-white/80 border border-gray-200 rounded-2xl p-3 mb-2 shadow-sm flex-shrink-0">
              <p className="text-center text-xs text-gray-400 mb-2 font-bold">コインを えらんで おかいもの！</p>
              <div className="flex justify-center gap-4">
                {COIN_VALUES.map((coin) => (
                  <div key={coin.key} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => addCoin(coin.key)}
                      disabled={phase !== "shopping"}
                      className={`${coin.size} rounded-full bg-gradient-to-b ${coin.color} border-2 border-white shadow-md flex items-center justify-center active:scale-90 transition-transform select-none touch-manipulation ${should50 && coin.key === "c50" ? "ring-4 ring-yellow-400 ring-opacity-70 animate-pulse" : ""}`}
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
              {/* 50円 hint */}
              {hint50 && (
                <p className="text-center text-yellow-600 text-xs font-bold mt-2 animate-bounce">{hint50}</p>
              )}
            </div>

            {/* Total & pay */}
            <div className="bg-white/90 border border-emerald-200 rounded-2xl p-3 mb-2 shadow-sm flex-shrink-0">
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

            {/* Feedback - tap anywhere to continue */}
            {phase === "correct" && (
              <div className="fixed inset-0 z-40" onClick={next} />
            )}
            <div className="text-center flex-1 flex flex-col items-center justify-center gap-2 min-h-0 relative z-50">
              {phase === "correct" && (
                <>
                  <p className="text-green-600 font-bold text-xl animate-bounce">
                    ⭕ ぴったり！ すごい！
                  </p>
                  <p className="text-gray-400 text-sm animate-pulse">タップして つぎへ</p>
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
          </>
        )}
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
