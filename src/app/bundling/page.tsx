"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { playPop, playBundle, playSuccess } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

interface Dot {
  id: number;
  x: number;
  y: number;
  selected: boolean;
  bundled: boolean;
}

interface Bar {
  id: number;
  x: number;
  y: number;
  selected: boolean;
  bundledToPlate: boolean;
}

function generateDots(count: number): Dot[] {
  const dots: Dot[] = [];
  const cols = Math.min(count, 10);
  const rows = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    dots.push({
      id: i,
      x: 30 + col * 32,
      y: 30 + row * 36,
      selected: false,
      bundled: false,
    });
  }
  return dots;
}

function generateProblem(): number {
  const tens = Math.floor(Math.random() * 2) + 1; // 1-2 hundreds possible
  const ones = Math.floor(Math.random() * 10);
  const tenCount = Math.floor(Math.random() * 10);
  return tens * 100 + tenCount * 10 + ones;
}

function numberToReading(n: number): string {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;

  const hNames = ["", "ひゃく", "にひゃく"];
  const tNames = ["", "じゅう", "にじゅう", "さんじゅう", "よんじゅう", "ごじゅう", "ろくじゅう", "ななじゅう", "はちじゅう", "きゅうじゅう"];
  const oNames = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];

  return `${hNames[hundreds]}${tNames[tens]}${oNames[ones]}`;
}

export default function BundlingPage() {
  const [targetNumber, setTargetNumber] = useState(23);
  const [dots, setDots] = useState<Dot[]>(() => generateDots(23));
  const [bars, setBars] = useState<Bar[]>([]);
  const [plates, setPlates] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [message, setMessage] = useState("まるを 10こ タップして えらんでね！");
  const [round, setRound] = useState(1);
  const selectionCount = useRef(0);

  const totalOnes = dots.filter((d) => !d.bundled).length;
  const totalTens = bars.filter((b) => !b.bundledToPlate).length;

  const checkComplete = useCallback(
    (currentPlates: number, currentBars: Bar[], currentDots: Dot[]) => {
      const unbundledDots = currentDots.filter((d) => !d.bundled).length;
      const unbundledBars = currentBars.filter((b) => !b.bundledToPlate).length;
      // Complete when all possible bundling is done
      if (unbundledDots < 10 && unbundledBars < 10) {
        const total = currentPlates * 100 + unbundledBars * 10 + unbundledDots;
        if (total === targetNumber) {
          setCleared(true);
          setMessage(`せいかい！ ${targetNumber} は ${currentPlates > 0 ? currentPlates + "百 " : ""}${unbundledBars}十 ${unbundledDots}一 だね！`);
          playSuccess();
          setTimeout(() => setShowReward(true), 1000);
        }
      }
    },
    [targetNumber]
  );

  const handleDotTap = (dotId: number) => {
    if (cleared) return;

    setDots((prev) => {
      const updated = prev.map((d) => {
        if (d.id === dotId && !d.bundled) {
          return { ...d, selected: !d.selected };
        }
        return d;
      });

      const selectedCount = updated.filter((d) => d.selected && !d.bundled).length;
      selectionCount.current = selectedCount;

      if (selectedCount === 10) {
        playBundle();
        // Bundle the 10 selected dots
        const bundled = updated.map((d) => (d.selected && !d.bundled ? { ...d, bundled: true, selected: false } : d));
        const newBar: Bar = {
          id: bars.length + Date.now(),
          x: 30 + bars.filter((b) => !b.bundledToPlate).length * 45,
          y: 10,
          selected: false,
          bundledToPlate: false,
        };

        setTimeout(() => {
          setBars((prevBars) => {
            const newBars = [...prevBars, newBar];
            setTimeout(() => checkComplete(plates, newBars, bundled), 100);
            return newBars;
          });
          setMessage("すごい！ 10こ まとめて じゅうの たば にしたよ！");
        }, 300);

        return bundled;
      } else if (selectedCount > 0) {
        setMessage(`${selectedCount}こ えらんだよ。あと ${10 - selectedCount}こ！`);
      }

      return updated;
    });
    playPop();
  };

  const handleBarTap = (barId: number) => {
    if (cleared) return;

    setBars((prev) => {
      const updated = prev.map((b) => {
        if (b.id === barId && !b.bundledToPlate) {
          return { ...b, selected: !b.selected };
        }
        return b;
      });

      const selectedBars = updated.filter((b) => b.selected && !b.bundledToPlate).length;

      if (selectedBars === 10) {
        playBundle();
        const bundled = updated.map((b) => (b.selected && !b.bundledToPlate ? { ...b, bundledToPlate: true, selected: false } : b));
        const newPlates = plates + 1;
        setTimeout(() => {
          setPlates(newPlates);
          setMessage("すごい！ じゅうのたば 10こで ひゃくのいた にしたよ！");
          setTimeout(() => checkComplete(newPlates, bundled, dots), 100);
        }, 300);
        return bundled;
      } else if (selectedBars > 0) {
        setMessage(`たば ${selectedBars}こ えらんだよ。あと ${10 - selectedBars}こ！`);
      }

      return updated;
    });
    playPop();
  };

  const nextProblem = () => {
    const num = round < 3 ? 10 + Math.floor(Math.random() * 90) : generateProblem();
    setTargetNumber(num);
    setDots(generateDots(num > 200 ? 200 : num));
    setBars([]);
    setPlates(0);
    setCleared(false);
    setShowReward(false);
    setMessage("まるを 10こ タップして えらんでね！");
    setRound((r) => r + 1);
    selectionCount.current = 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-gray-950 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-yellow-400 text-sm hover:underline">
            ← もどる
          </Link>
          <span className="text-green-300 text-sm">まとめてみよう</span>
        </div>

        {/* Target */}
        <div className="text-center mb-4">
          <p className="text-gray-300 text-sm mb-1">このかずを つくろう</p>
          <div className="text-5xl font-bold text-yellow-300">{targetNumber}</div>
          <p className="text-gray-400 text-xs mt-1">{numberToReading(targetNumber)}</p>
        </div>

        {/* Status */}
        <div className="flex justify-center gap-4 mb-3 text-sm">
          {plates > 0 && (
            <div className="bg-red-900/50 rounded-lg px-3 py-1 border border-red-700">
              <span className="text-red-300">百のいた:</span>{" "}
              <span className="text-white font-bold">{plates}</span>
            </div>
          )}
          <div className="bg-blue-900/50 rounded-lg px-3 py-1 border border-blue-700">
            <span className="text-blue-300">十のたば:</span>{" "}
            <span className="text-white font-bold">{totalTens}</span>
          </div>
          <div className="bg-green-900/50 rounded-lg px-3 py-1 border border-green-700">
            <span className="text-green-300">バラ:</span>{" "}
            <span className="text-white font-bold">{totalOnes}</span>
          </div>
        </div>

        {/* Message */}
        <div className="bg-gray-800/70 rounded-xl p-3 mb-4 text-center">
          <p className="text-white text-sm">{message}</p>
        </div>

        {/* Bars area (tens) */}
        {bars.filter((b) => !b.bundledToPlate).length > 0 && (
          <div className="bg-blue-950/50 rounded-xl p-3 mb-3 border border-blue-800">
            <p className="text-blue-300 text-xs mb-2">十のたば（タップして 10こ あつめると 百になるよ）</p>
            <div className="flex flex-wrap gap-2">
              {bars
                .filter((b) => !b.bundledToPlate)
                .map((bar) => (
                  <button
                    key={bar.id}
                    onClick={() => handleBarTap(bar.id)}
                    className={`w-12 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                      bar.selected
                        ? "bg-yellow-500 border-yellow-300 scale-110"
                        : "bg-blue-700 border-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    <div className="flex flex-col gap-[1px]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-[1px]">
                          <div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
                          <div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[9px] text-white/70 mt-0.5">10</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Plates area (hundreds) */}
        {plates > 0 && (
          <div className="bg-red-950/50 rounded-xl p-3 mb-3 border border-red-800">
            <p className="text-red-300 text-xs mb-2">百のいた</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: plates }).map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-lg bg-red-700 border-2 border-red-500 flex items-center justify-center"
                >
                  <span className="text-white font-bold text-sm">100</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dots area (ones) */}
        <div className="bg-green-950/50 rounded-xl p-3 border border-green-800">
          <p className="text-green-300 text-xs mb-2">
            バラのまる（10こ タップして えらぼう）
            {selectionCount.current > 0 && (
              <span className="text-yellow-300 ml-2">えらんだ: {dots.filter((d) => d.selected && !d.bundled).length}こ</span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5 justify-start">
            {dots
              .filter((d) => !d.bundled)
              .map((dot) => (
                <button
                  key={dot.id}
                  onClick={() => handleDotTap(dot.id)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    dot.selected
                      ? "bg-yellow-400 border-yellow-200 scale-110 shadow-lg shadow-yellow-500/50"
                      : "bg-green-500 border-green-300 hover:bg-green-400 active:bg-yellow-400"
                  }`}
                />
              ))}
          </div>
        </div>

        {/* Next button */}
        {cleared && (
          <div className="mt-6 text-center animate-slide-up">
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
