"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { playPop, playBundle, playSuccess, playError } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

interface PlaceState {
  hundreds: number;
  tens: number;
  ones: number;
}

function randomTarget(): number {
  return Math.floor(Math.random() * 200) + 1;
}

function numberToReading(n: number): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;

  const hN = ["", "ひゃく", "にひゃく", "さんびゃく"];
  const tN = ["", "じゅう", "にじゅう", "さんじゅう", "よんじゅう", "ごじゅう", "ろくじゅう", "ななじゅう", "はちじゅう", "きゅうじゅう"];
  const oN = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];

  return `${hN[h] || ""}${tN[t]}${oN[o]}`;
}

function PlaceColumn({
  label,
  count,
  color,
  onAdd,
  onRemove,
  maxDisplay,
}: {
  label: string;
  count: number;
  color: string;
  onAdd: () => void;
  onRemove: () => void;
  maxDisplay: number;
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string; block: string; blockBorder: string }> = {
    red: { bg: "bg-red-950/50", border: "border-red-700", text: "text-red-300", block: "bg-red-600", blockBorder: "border-red-400" },
    blue: { bg: "bg-blue-950/50", border: "border-blue-700", text: "text-blue-300", block: "bg-blue-600", blockBorder: "border-blue-400" },
    green: { bg: "bg-green-950/50", border: "border-green-700", text: "text-green-300", block: "bg-green-600", blockBorder: "border-green-400" },
  };
  const c = colorMap[color];

  return (
    <div className={`${c.bg} rounded-xl border ${c.border} p-3 flex-1 flex flex-col items-center min-h-[280px]`}>
      <p className={`${c.text} text-sm font-bold mb-1`}>{label}</p>
      <p className="text-white text-3xl font-bold mb-3">{count}</p>

      {/* Blocks */}
      <div className="flex-1 flex flex-wrap gap-1 justify-center content-start w-full mb-3">
        {Array.from({ length: Math.min(count, maxDisplay) }).map((_, i) => (
          <div
            key={i}
            className={`${c.block} border ${c.blockBorder} rounded animate-bounce-in`}
            style={{
              width: label === "百のくらい" ? 36 : label === "十のくらい" ? 28 : 20,
              height: label === "百のくらい" ? 36 : label === "十のくらい" ? 28 : 20,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
        {count > maxDisplay && (
          <span className="text-gray-400 text-xs">+{count - maxDisplay}</span>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 w-full">
        <button
          onClick={onRemove}
          className="flex-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white font-bold py-2 rounded-lg text-lg transition-colors"
          disabled={count <= 0}
        >
          −
        </button>
        <button
          onClick={onAdd}
          className="flex-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white font-bold py-2 rounded-lg text-lg transition-colors"
        >
          ＋
        </button>
      </div>
    </div>
  );
}

export default function PlaceValuePage() {
  const [target, setTarget] = useState(() => randomTarget());
  const [place, setPlace] = useState<PlaceState>({ hundreds: 0, tens: 0, ones: 0 });
  const [showReward, setShowReward] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [message, setMessage] = useState("ブロックを いれて かずを つくろう！");
  const [carryAnimation, setCarryAnimation] = useState<string | null>(null);

  const currentValue = place.hundreds * 100 + place.tens * 10 + place.ones;

  const updatePlace = useCallback(
    (field: keyof PlaceState, delta: number) => {
      if (cleared) return;

      setPlace((prev) => {
        const newVal = prev[field] + delta;
        if (newVal < 0) return prev;

        let next = { ...prev, [field]: newVal };

        // Auto carry: ones >= 10
        if (next.ones >= 10) {
          setCarryAnimation("ones-to-tens");
          setTimeout(() => setCarryAnimation(null), 600);
          playBundle();
          next = { ...next, ones: next.ones - 10, tens: next.tens + 1 };
          setMessage("一が 10こで 十に くりあがったよ！");
        }

        // Auto carry: tens >= 10
        if (next.tens >= 10) {
          setCarryAnimation("tens-to-hundreds");
          setTimeout(() => setCarryAnimation(null), 600);
          playBundle();
          next = { ...next, tens: next.tens - 10, hundreds: next.hundreds + 1 };
          setMessage("十が 10こで 百に くりあがったよ！");
        }

        const val = next.hundreds * 100 + next.tens * 10 + next.ones;

        if (val === target) {
          setCleared(true);
          setMessage(`せいかい！ ${target} = ${next.hundreds}百 ${next.tens}十 ${next.ones}一 だね！`);
          playSuccess();
          setTimeout(() => setShowReward(true), 800);
        } else if (delta > 0) {
          playPop();
        }

        return next;
      });
    },
    [cleared, target]
  );

  const nextProblem = () => {
    setTarget(randomTarget());
    setPlace({ hundreds: 0, tens: 0, ones: 0 });
    setCleared(false);
    setShowReward(false);
    setMessage("ブロックを いれて かずを つくろう！");
  };

  const handleCheck = () => {
    if (currentValue === target) {
      setCleared(true);
      setMessage(`せいかい！ ${target} = ${place.hundreds}百 ${place.tens}十 ${place.ones}一 だね！`);
      playSuccess();
      setTimeout(() => setShowReward(true), 800);
    } else {
      playError();
      setMessage(
        currentValue < target
          ? `${currentValue} は ちいさいよ。もっと ブロックを いれよう！`
          : `${currentValue} は おおきいよ。ブロックを へらそう！`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-gray-950 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-yellow-400 text-sm hover:underline">
            ← もどる
          </Link>
          <span className="text-blue-300 text-sm">くらいのへや</span>
        </div>

        {/* Target */}
        <div className="text-center mb-3">
          <p className="text-gray-300 text-sm mb-1">このかずを つくろう</p>
          <div className="text-5xl font-bold text-yellow-300">{target}</div>
          <p className="text-gray-400 text-xs mt-1">{numberToReading(target)}</p>
        </div>

        {/* Current value */}
        <div className="text-center mb-3">
          <span className="text-gray-400 text-sm">いまのかず: </span>
          <span className={`text-2xl font-bold ${currentValue === target ? "text-green-400" : "text-white"}`}>
            {currentValue}
          </span>
          {carryAnimation && (
            <span className="ml-2 text-yellow-300 text-sm animate-bounce">くりあがり！</span>
          )}
        </div>

        {/* Message */}
        <div className="bg-gray-800/70 rounded-xl p-3 mb-4 text-center">
          <p className="text-white text-sm">{message}</p>
        </div>

        {/* Place value columns */}
        <div className="flex gap-2 mb-4">
          <PlaceColumn
            label="百のくらい"
            count={place.hundreds}
            color="red"
            onAdd={() => updatePlace("hundreds", 1)}
            onRemove={() => updatePlace("hundreds", -1)}
            maxDisplay={9}
          />
          <PlaceColumn
            label="十のくらい"
            count={place.tens}
            color="blue"
            onAdd={() => updatePlace("tens", 1)}
            onRemove={() => updatePlace("tens", -1)}
            maxDisplay={12}
          />
          <PlaceColumn
            label="一のくらい"
            count={place.ones}
            color="green"
            onAdd={() => updatePlace("ones", 1)}
            onRemove={() => updatePlace("ones", -1)}
            maxDisplay={15}
          />
        </div>

        {/* Check / Next button */}
        {!cleared ? (
          <div className="text-center">
            <button onClick={handleCheck} className="mc-btn-blue mc-btn text-lg px-8 py-3">
              こたえあわせ ✓
            </button>
          </div>
        ) : (
          <div className="text-center animate-slide-up">
            <button onClick={nextProblem} className="mc-btn text-xl px-10 py-4">
              つぎのもんだい →
            </button>
          </div>
        )}
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
