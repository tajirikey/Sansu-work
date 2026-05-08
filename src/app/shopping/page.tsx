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

function calcTotal(coins: CoinCount): number {
  return coins.c500 * 500 + coins.c100 * 100 + coins.c50 * 50 + coins.c10 * 10 + coins.c1;
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

function pickProduct50(): Product {
  const pool = PRODUCTS.filter((p) => p.price >= 50 && p.price % 50 !== 0 ? false : p.price >= 50);
  const good = PRODUCTS.filter((p) => {
    const tens = Math.floor((p.price % 100) / 10);
    return tens >= 5;
  });
  if (good.length > 0) return good[Math.floor(Math.random() * good.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

const SHOP_LEVELS = [
  { label: "かんたん", desc: "〜100えん", startLevel: 1 },
  { label: "ふつう", desc: "〜200えん", startLevel: 3 },
  { label: "むずかしい", desc: "〜500えん", startLevel: 5 },
  { label: "50えんれんしゅう", desc: "50えんだまを つかおう", startLevel: 3 },
];

/* ── Realistic coin component ── */
function Coin({ value, label, size, onClick, disabled, highlight }: {
  value: number;
  label: string;
  size: number;
  onClick: () => void;
  disabled: boolean;
  highlight: boolean;
}) {
  const isGold = value === 500 || value === 5;
  const isBrass = value === 50;
  const isCopper = value === 10;

  let outerBg: string, innerBg: string, textColor: string, borderColor: string;
  if (isGold) {
    outerBg = "bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500";
    innerBg = "bg-gradient-to-b from-yellow-200 to-yellow-400";
    textColor = "text-yellow-800";
    borderColor = "border-yellow-500";
  } else if (isBrass) {
    outerBg = "bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400";
    innerBg = "bg-gradient-to-b from-yellow-100 to-yellow-300";
    textColor = "text-yellow-700";
    borderColor = "border-yellow-400";
  } else if (isCopper) {
    outerBg = "bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500";
    innerBg = "bg-gradient-to-b from-amber-200 to-amber-400";
    textColor = "text-amber-800";
    borderColor = "border-amber-500";
  } else {
    outerBg = "bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400";
    innerBg = "bg-gradient-to-b from-gray-100 to-gray-300";
    textColor = "text-gray-600";
    borderColor = "border-gray-400";
  }

  const sizeClass = size === 60 ? "w-[60px] h-[60px]" : size === 52 ? "w-[52px] h-[52px]" : "w-[44px] h-[44px]";
  const innerSizeClass = size === 60 ? "w-[48px] h-[48px]" : size === 52 ? "w-[42px] h-[42px]" : "w-[36px] h-[36px]";
  const hasHole = value === 50 || value === 5;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClass} rounded-full ${outerBg} border-2 ${borderColor} shadow-lg flex items-center justify-center active:scale-90 transition-transform select-none touch-manipulation relative ${highlight ? "ring-4 ring-yellow-400 ring-opacity-80 animate-pulse" : ""}`}
    >
      {/* Inner rim */}
      <div className={`${innerSizeClass} rounded-full ${innerBg} flex items-center justify-center relative`}>
        {hasHole && (
          <div className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-b from-yellow-500 to-yellow-700 border border-yellow-600" />
        )}
        <span className={`${textColor} font-black drop-shadow-sm ${value >= 100 ? "text-[10px]" : "text-xs"} ${hasHole ? "opacity-0" : ""}`}>
          {label}
        </span>
      </div>
      {/* Value text on top of hole coins */}
      {hasHole && (
        <span className={`absolute inset-0 flex items-end justify-center pb-1 ${textColor} font-black text-[9px] drop-shadow-sm`}>
          {label}
        </span>
      )}
    </button>
  );
}

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

  const is50Mode = shopLevelIdx === 3;
  const total = calcTotal(coins);
  const diff = total - product.price;
  const remaining = product.price - total;

  const should50 = useMemo(() => {
    if (phase !== "shopping") return false;
    return remaining >= 50 && coins.c50 === 0 && remaining < 100;
  }, [phase, remaining, coins.c50]);

  const startWithLevel = (idx: number) => {
    setShopLevelIdx(idx);
    const lv = SHOP_LEVELS[idx].startLevel;
    setLevel(lv);
    setProduct(idx === 3 ? pickProduct50() : pickProduct(lv));
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
    playPop();
    setCoins((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
    setHint50("");
  }, [phase]);

  const handlePay = useCallback(() => {
    if (phase !== "shopping") return;

    // 50円 mode: must use 50円 coin
    if (is50Mode && coins.c50 === 0 && product.price >= 50) {
      setHint50("50えんだまを つかってね！");
      playError();
      return;
    }

    // Hint: should use 50円
    if (!is50Mode && total < product.price && remaining >= 50 && coins.c50 === 0) {
      setHint50("50えんだまも つかってみよう！");
      playError();
      return;
    }

    if (total === product.price) {
      playBundle();
      setScore((s) => s + 10 + (level > 4 ? 5 : 0));
      setStreak((s) => {
        const ns = s + 1;
        if (ns > 0 && ns % 3 === 0) setTimeout(() => setShowReward(true), 800);
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
  }, [phase, total, product.price, level, coins.c50, is50Mode, remaining]);

  const next = useCallback(() => {
    const baseLv = SHOP_LEVELS[shopLevelIdx].startLevel;
    const newLevel = Math.min(baseLv + 1, baseLv + Math.floor(score / 25));
    setLevel(newLevel);
    setProduct(is50Mode ? pickProduct50() : pickProduct(newLevel));
    setCoins({ c500: 0, c100: 0, c50: 0, c10: 0, c1: 0 });
    setPhase("shopping");
    setHint50("");
  }, [score, shopLevelIdx, is50Mode]);

  const retry = useCallback(() => {
    setCoins({ c500: 0, c100: 0, c50: 0, c10: 0, c1: 0 });
    setPhase("shopping");
    setStreak(0);
    setHint50("");
  }, []);

  const coinDefs: { key: keyof CoinCount; value: number; label: string; size: number }[] = [
    { key: "c500", value: 500, label: "500", size: 60 },
    { key: "c100", value: 100, label: "100", size: 52 },
    { key: "c50", value: 50, label: "50", size: 52 },
    { key: "c10", value: 10, label: "10", size: 44 },
    { key: "c1", value: 1, label: "1", size: 44 },
  ];

  return (
    <div
      className="fixed inset-0 bg-gradient-to-b from-emerald-50 to-lime-50 p-3 flex flex-col touch-manipulation"
      style={{ overflow: "hidden" }}
    >
      <div className="max-w-lg mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-1 flex-shrink-0">
          <Link href="/" className="text-emerald-700 text-sm hover:underline">
            &larr; もどる
          </Link>
          <span className="text-emerald-600 text-sm font-bold">おかいものゲーム</span>
        </div>

        {phase === "select" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-5xl mb-3">🛒</p>
              <h2 className="text-2xl font-bold text-emerald-700 mb-2">おかいものゲーム</h2>
              <p className="text-gray-500 text-sm">コインをえらんで おかいものしよう</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {SHOP_LEVELS.map((lv, i) => (
                <button
                  key={i}
                  onClick={() => startWithLevel(i)}
                  className={`px-4 py-3 rounded-xl font-bold transition-all bg-white border-2 active:scale-95 shadow-sm ${
                    i === 3
                      ? "border-yellow-300 text-yellow-700 hover:border-yellow-400"
                      : "border-emerald-200 text-emerald-600 hover:border-emerald-400"
                  }`}
                >
                  <span className="block text-sm">{lv.label}</span>
                  <span className="block text-[10px] opacity-60 mt-0.5">{lv.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="bg-white/90 border border-emerald-200 rounded-2xl p-2 mb-1 shadow-sm flex-shrink-0">
              <div className="flex items-center justify-between text-center">
                <div>
                  <p className="text-gray-400 text-[10px]">スコア</p>
                  <p className="text-emerald-600 font-bold text-base leading-tight">{score}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">れんぞく</p>
                  <p className="text-orange-500 font-bold text-base leading-tight">{streak}</p>
                </div>
                <div>
                  <button onClick={() => setPhase("select")} className="text-gray-400 text-[10px] underline">
                    レベルへんこう
                  </button>
                  <p className="text-purple-600 font-bold text-xs">{SHOP_LEVELS[shopLevelIdx].label}</p>
                </div>
              </div>
            </div>

            {/* Product card - compact */}
            <div className="bg-white/90 border-2 border-emerald-200 rounded-2xl p-2 mb-1 shadow-md flex items-center gap-3 flex-shrink-0">
              <p className="text-4xl">{product.emoji}</p>
              <div className="flex-1">
                <p className="text-emerald-700 font-bold text-sm">{product.name}</p>
                <p className="text-2xl font-black text-emerald-600">
                  {product.price}<span className="text-sm text-gray-400">えん</span>
                </p>
              </div>
            </div>

            {/* Coins area */}
            <div className="bg-white/80 border border-gray-200 rounded-2xl p-2 mb-1 shadow-sm flex-shrink-0">
              {is50Mode && (
                <p className="text-center text-[10px] text-yellow-600 font-bold mb-1">
                  50えんだまを かならず つかおう！
                </p>
              )}
              <div className="flex justify-center items-end gap-3">
                {coinDefs.map((coin) => (
                  <div key={coin.key} className="flex flex-col items-center gap-0.5">
                    <Coin
                      value={coin.value}
                      label={coin.label}
                      size={coin.size}
                      onClick={() => addCoin(coin.key)}
                      disabled={phase !== "shopping"}
                      highlight={should50 && coin.key === "c50"}
                    />
                    {/* Count + remove area */}
                    <div className="flex items-center justify-center h-7 min-w-[40px]">
                      {coins[coin.key] > 0 ? (
                        <button
                          onClick={() => removeCoin(coin.key)}
                          disabled={phase !== "shopping"}
                          className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-red-50 border border-red-200 active:scale-90 transition-transform"
                        >
                          <span className="text-red-500 font-bold text-sm">{coins[coin.key]}</span>
                          <span className="text-red-400 text-xs">✕</span>
                        </button>
                      ) : (
                        <span className="text-gray-300 text-sm font-bold">0</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {hint50 && (
                <p className="text-center text-yellow-600 text-xs font-bold mt-1 animate-bounce">{hint50}</p>
              )}
            </div>

            {/* Total & pay */}
            <div className="bg-white/90 border border-emerald-200 rounded-2xl p-2 mb-1 shadow-sm flex-shrink-0">
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
            {phase === "correct" && (
              <div className="fixed inset-0 z-40" onClick={next} />
            )}
            <div className="text-center flex-1 flex flex-col items-center justify-center gap-1 min-h-0 relative z-50">
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
                  <p className="text-red-500 font-bold text-base">
                    おかねが {diff}えん おおいよ！
                  </p>
                  <button onClick={retry} className="mc-btn text-sm px-5 py-1.5">
                    もういちど
                  </button>
                </>
              )}
              {phase === "under" && (
                <>
                  <p className="text-orange-500 font-bold text-base">
                    あと {product.price - total}えん たりないよ！
                  </p>
                  <button onClick={retry} className="mc-btn text-sm px-5 py-1.5">
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
