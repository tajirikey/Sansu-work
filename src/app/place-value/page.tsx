"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import TenBundle from "@/components/TenBundle";
import HundredPlate from "@/components/HundredPlate";
import { playPop, playBundle, playSuccess, playError } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

const DOT_SIZE = 20;

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
  renderUnit,
}: {
  label: string;
  count: number;
  color: "red" | "blue" | "green";
  onAdd: () => void;
  onRemove: () => void;
  renderUnit: () => React.ReactNode;
}) {
  const styles = {
    red: { bg: "bg-red-950/50", border: "border-red-700", text: "text-red-300", btn: "bg-red-800 hover:bg-red-700 active:bg-red-600" },
    blue: { bg: "bg-blue-950/50", border: "border-blue-700", text: "text-blue-300", btn: "bg-blue-800 hover:bg-blue-700 active:bg-blue-600" },
    green: { bg: "bg-green-950/50", border: "border-green-700", text: "text-green-300", btn: "bg-green-800 hover:bg-green-700 active:bg-green-600" },
  };
  const s = styles[color];

  return (
    <div className={`${s.bg} rounded-xl border ${s.border} p-3 flex-1 flex flex-col items-center min-h-[300px]`}>
      <p className={`${s.text} text-xs font-bold mb-1`}>{label}</p>
      <p className="text-white text-3xl font-bold mb-3">{count}</p>

      {/* units display */}
      <div className="flex-1 flex flex-wrap gap-1 justify-center content-start w-full mb-3">
        {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
          <div key={i} className="animate-bounce-in" style={{ animationDelay: `${i * 0.05}s` }}>
            {renderUnit()}
          </div>
        ))}
        {count > 12 && (
          <span className="text-gray-400 text-xs self-center">+{count - 12}</span>
        )}
      </div>

      {/* +/- buttons */}
      <div className="flex gap-2 w-full">
        <button
          onClick={onRemove}
          disabled={count <= 0}
          className={`flex-1 ${s.btn} disabled:opacity-30 text-white font-bold py-3 rounded-lg text-xl transition-colors active:scale-95`}
        >
          −
        </button>
        <button
          onClick={onAdd}
          className={`flex-1 ${s.btn} text-white font-bold py-3 rounded-lg text-xl transition-colors active:scale-95`}
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
  const [carryMessage, setCarryMessage] = useState<string | null>(null);

  const currentValue = place.hundreds * 100 + place.tens * 10 + place.ones;

  const updatePlace = useCallback(
    (field: keyof PlaceState, delta: number) => {
      if (cleared) return;
      playPop();

      setPlace((prev) => {
        const newVal = prev[field] + delta;
        if (newVal < 0) return prev;

        let next = { ...prev, [field]: newVal };

        // Auto carry: ones >= 10
        if (next.ones >= 10) {
          playBundle();
          next = { ...next, ones: next.ones - 10, tens: next.tens + 1 };
          setCarryMessage("一が 10こで 十に くりあがり！");
          setTimeout(() => setCarryMessage(null), 1500);
        }

        // Auto carry: tens >= 10
        if (next.tens >= 10) {
          playBundle();
          next = { ...next, tens: next.tens - 10, hundreds: next.hundreds + 1 };
          setCarryMessage("十が 10こで 百に くりあがり！");
          setTimeout(() => setCarryMessage(null), 1500);
        }

        return next;
      });
    },
    [cleared],
  );

  /* ── answer check (user-initiated ONLY) ── */
  const handleCheck = () => {
    if (currentValue === target) {
      setCleared(true);
      playSuccess();
      setMessage(
        `せいかい！ ${target} = ${place.hundreds}百 ${place.tens}十 ${place.ones}一 だね！`,
      );
      setTimeout(() => setShowReward(true), 800);
    } else {
      playError();
      if (currentValue < target) {
        setMessage(`${currentValue} は ちいさいよ。もっと ブロックを いれよう！`);
      } else {
        setMessage(`${currentValue} は おおきいよ。ブロックを へらそう！`);
      }
    }
  };

  const nextProblem = () => {
    setTarget(randomTarget());
    setPlace({ hundreds: 0, tens: 0, ones: 0 });
    setCleared(false);
    setShowReward(false);
    setMessage("ブロックを いれて かずを つくろう！");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-gray-950 p-4 pb-32">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-yellow-400 text-sm hover:underline">
            ← もどる
          </Link>
          <span className="text-blue-300 text-sm font-bold">かずくんハウス</span>
        </div>

        {/* target */}
        <div className="text-center mb-3">
          <p className="text-gray-300 text-sm mb-1">このかずを つくろう</p>
          <div className="text-5xl font-bold text-yellow-300">{target}</div>
          <p className="text-gray-400 text-xs mt-1">{numberToReading(target)}</p>
        </div>

        {/* current value */}
        <div className="text-center mb-2">
          <span className="text-gray-400 text-sm">いまのかず: </span>
          <span className={`text-2xl font-bold ${currentValue === target ? "text-green-400" : "text-white"}`}>
            {currentValue}
          </span>
        </div>

        {/* carry message */}
        {carryMessage && (
          <div className="text-center mb-2 animate-bounce">
            <span className="bg-yellow-600/80 text-white text-sm font-bold px-4 py-1 rounded-full">
              {carryMessage}
            </span>
          </div>
        )}

        {/* message */}
        <div className="bg-gray-800/70 rounded-xl p-3 mb-4 text-center">
          <p className="text-white text-sm">{message}</p>
        </div>

        {/* place value columns */}
        <div className="flex gap-2 mb-4">
          <PlaceColumn
            label="百のくらい"
            count={place.hundreds}
            color="red"
            onAdd={() => updatePlace("hundreds", 1)}
            onRemove={() => updatePlace("hundreds", -1)}
            renderUnit={() => <HundredPlate />}
          />
          <PlaceColumn
            label="十のくらい"
            count={place.tens}
            color="blue"
            onAdd={() => updatePlace("tens", 1)}
            onRemove={() => updatePlace("tens", -1)}
            renderUnit={() => <TenBundle dotSize={8} />}
          />
          <PlaceColumn
            label="一のくらい"
            count={place.ones}
            color="green"
            onAdd={() => updatePlace("ones", 1)}
            onRemove={() => updatePlace("ones", -1)}
            renderUnit={() => (
              <div
                className="rounded-full bg-green-500 border-2 border-green-300"
                style={{ width: DOT_SIZE, height: DOT_SIZE }}
              />
            )}
          />
        </div>

        {/* check / next */}
        {!cleared ? (
          <div className="text-center">
            <button onClick={handleCheck} className="mc-btn mc-btn-blue text-lg px-8 py-3">
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
