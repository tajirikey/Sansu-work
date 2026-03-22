"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { playPop, playSuccess, playError } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

/* ═══════════════════════════════════════════════
   すうじてんびん - Number Balance / Scale
   Tap the bigger number directly!
   ═══════════════════════════════════════════════ */

interface Problem {
  left: number;
  right: number;
  answer: "left" | "right" | "equal";
}

function generateProblem(level: number): Problem {
  let left: number, right: number;

  if (level <= 2) {
    left = Math.floor(Math.random() * 20) + 1;
    right = Math.floor(Math.random() * 20) + 1;
    if (left === right && Math.random() > 0.2) right = left + (Math.random() > 0.5 ? 1 : -1);
  } else if (level <= 4) {
    left = Math.floor(Math.random() * 90) + 10;
    right = Math.floor(Math.random() * 90) + 10;
    if (left === right && Math.random() > 0.2) right = left + Math.floor(Math.random() * 10) + 1;
  } else if (level <= 6) {
    left = Math.floor(Math.random() * 900) + 100;
    right = Math.floor(Math.random() * 900) + 100;
    if (left === right) right = left + Math.floor(Math.random() * 50) + 1;
  } else {
    const tricky = [
      [199, 200], [100, 99], [210, 209], [300, 299],
      [109, 190], [150, 105], [500, 499], [201, 210],
      [88, 90], [101, 110], [999, 1000],
    ];
    const pair = tricky[Math.floor(Math.random() * tricky.length)];
    if (Math.random() > 0.5) { left = pair[0]; right = pair[1]; }
    else { left = pair[1]; right = pair[0]; }
  }

  left = Math.max(1, left);
  right = Math.max(1, right);
  const answer = left > right ? "left" : left < right ? "right" : "equal";
  return { left, right, answer };
}

function decompose(n: number): { hundreds: number; tens: number; ones: number } {
  return { hundreds: Math.floor(n / 100), tens: Math.floor((n % 100) / 10), ones: n % 10 };
}

function DotVis({ n }: { n: number }) {
  const { hundreds, tens, ones } = decompose(n);
  return (
    <div className="flex flex-wrap items-end justify-center gap-1 min-h-[32px]">
      {Array.from({ length: hundreds }).map((_, i) => (
        <div key={`h${i}`} className="w-4 h-4 bg-red-400 rounded-sm border border-red-500" />
      ))}
      {Array.from({ length: tens }).map((_, i) => (
        <div key={`t${i}`} className="w-2.5 h-4 bg-blue-400 rounded-sm border border-blue-500" />
      ))}
      {Array.from({ length: ones }).map((_, i) => (
        <div key={`o${i}`} className="w-2 h-2 bg-green-400 rounded-full border border-green-500" />
      ))}
    </div>
  );
}

const LEVELS = [
  { label: "かんたん", desc: "1〜20", startLevel: 1 },
  { label: "ふつう", desc: "10〜99", startLevel: 3 },
  { label: "むずかしい", desc: "100〜999", startLevel: 5 },
  { label: "ひっかけ", desc: "199 vs 200", startLevel: 7 },
];

export default function BalancePage() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [level, setLevel] = useState(1);
  const [problem, setProblem] = useState<Problem>(() => generateProblem(1));
  const [phase, setPhase] = useState<"select" | "choose" | "correct" | "wrong">("select");
  const [tilt, setTilt] = useState<"none" | "left" | "right" | "even">("none");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [showDots, setShowDots] = useState(false);

  const startWithLevel = (idx: number) => {
    setLevelIdx(idx);
    const lv = LEVELS[idx].startLevel;
    setLevel(lv);
    setProblem(generateProblem(lv));
    setScore(0);
    setStreak(0);
    setPhase("choose");
    setTilt("none");
    setShowDots(false);
  };

  const next = useCallback(() => {
    const baseLv = LEVELS[levelIdx].startLevel;
    const newLevel = Math.min(baseLv + 1, baseLv + Math.floor(score / 30));
    setLevel(newLevel);
    setProblem(generateProblem(newLevel));
    setPhase("choose");
    setTilt("none");
    setShowDots(false);
  }, [score, levelIdx]);

  const handleChoice = useCallback((choice: "left" | "right" | "equal") => {
    if (phase !== "choose") return;
    playPop();

    const correct = choice === problem.answer;

    if (problem.left > problem.right) setTilt("left");
    else if (problem.right > problem.left) setTilt("right");
    else setTilt("even");

    setShowDots(true);

    if (correct) {
      setTimeout(() => playSuccess(), 300);
      setScore((s) => s + 10);
      setStreak((s) => {
        const ns = s + 1;
        if (ns > 0 && ns % 5 === 0) setTimeout(() => setShowReward(true), 800);
        return ns;
      });
      setPhase("correct");
    } else {
      setTimeout(() => playError(), 300);
      setStreak(0);
      setPhase("wrong");
    }
  }, [phase, problem]);

  // Tap anywhere to proceed after answer
  const handleScreenTap = useCallback(() => {
    if (phase === "correct" || phase === "wrong") next();
  }, [phase, next]);

  const beamAngle = tilt === "left" ? -12 : tilt === "right" ? 12 : 0;

  return (
    <div
      className="fixed inset-0 bg-gradient-to-b from-indigo-50 to-purple-50 p-3 flex flex-col touch-manipulation"
      style={{ overflow: "hidden" }}
    >
      <div className="max-w-lg mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-1 flex-shrink-0">
          <Link href="/" className="text-indigo-700 text-sm hover:underline">
            &larr; もどる
          </Link>
          <span className="text-indigo-600 text-sm font-bold">すうじてんびん</span>
        </div>

        {phase === "select" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-5xl mb-3">⚖️</p>
              <h2 className="text-2xl font-bold text-indigo-700 mb-2">すうじてんびん</h2>
              <p className="text-gray-500 text-sm">おおきい かずを タップしよう！</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {LEVELS.map((lv, i) => (
                <button
                  key={i}
                  onClick={() => startWithLevel(i)}
                  className="px-4 py-3 rounded-xl font-bold transition-all bg-white border-2 border-indigo-200 text-indigo-600 active:scale-95 hover:border-indigo-400 shadow-sm"
                >
                  <span className="block text-base">{lv.label}</span>
                  <span className="block text-[10px] opacity-60 mt-0.5">{lv.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="flex-1 flex flex-col min-h-0"
            onClick={handleScreenTap}
          >
            {/* Stats bar */}
            <div className="bg-white/90 border border-indigo-200 rounded-2xl p-2 mb-2 shadow-sm flex-shrink-0">
              <div className="flex items-center justify-between text-center">
                <div>
                  <p className="text-gray-400 text-[10px]">スコア</p>
                  <p className="text-indigo-600 font-bold text-lg leading-tight">{score}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">れんぞく</p>
                  <p className="text-orange-500 font-bold text-lg leading-tight">{streak}</p>
                </div>
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhase("select"); }}
                    className="text-gray-400 text-[10px] underline"
                  >
                    レベルへんこう
                  </button>
                  <p className="text-purple-600 font-bold text-sm">{LEVELS[levelIdx].label}</p>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="text-center flex-shrink-0 mb-1">
              {phase === "choose" && (
                <p className="text-indigo-700 font-bold text-base">
                  おおきいほうを タップ！ おなじなら まんなかの ＝
                </p>
              )}
              {phase === "correct" && (
                <p className="text-green-600 font-bold text-lg animate-bounce">
                  ⭕ せいかい！
                </p>
              )}
              {phase === "wrong" && (
                <p className="text-red-500 font-bold text-base">
                  ❌ {problem.answer === "left"
                    ? `${problem.left} のほうが おおきいよ`
                    : problem.answer === "right"
                      ? `${problem.right} のほうが おおきいよ`
                      : "おなじ かずだよ！"}
                </p>
              )}
            </div>

            {/* Balance: numbers are tappable */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
              <div className="relative w-full max-w-sm flex-shrink-0">
                {/* Fulcrum */}
                <div className="flex justify-center">
                  <div className="relative" style={{ width: 280 }}>
                    {/* Beam */}
                    <div
                      className="w-full h-2 bg-indigo-500 rounded-full origin-center transition-transform duration-700 ease-out relative"
                      style={{ transform: `rotate(${beamAngle}deg)` }}
                    >
                      {/* Left number plate - TAPPABLE */}
                      <div className="absolute left-0 -top-24 w-28 flex flex-col items-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleChoice("left"); }}
                          disabled={phase !== "choose"}
                          className={`rounded-xl px-3 py-3 shadow-md text-center min-w-[90px] transition-all active:scale-95 select-none touch-manipulation border-3
                            ${phase !== "choose"
                              ? (problem.answer === "left"
                                ? "bg-green-100 border-green-400"
                                : "bg-white border-indigo-200")
                              : "bg-white border-indigo-300 hover:border-indigo-500 hover:shadow-lg cursor-pointer"
                            }`}
                        >
                          <p className="text-3xl font-black text-indigo-700">{problem.left}</p>
                        </button>
                        <div className="w-0.5 h-3 bg-indigo-400" />
                      </div>

                      {/* Equal button in center */}
                      <div className="absolute left-1/2 -translate-x-1/2 -top-16">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleChoice("equal"); }}
                          disabled={phase !== "choose"}
                          className={`w-12 h-12 rounded-full shadow-md text-xl font-black transition-all active:scale-90 select-none touch-manipulation border-3
                            ${phase !== "choose"
                              ? (problem.answer === "equal"
                                ? "bg-green-100 border-green-400 text-green-600"
                                : "bg-white border-yellow-200 text-yellow-400")
                              : "bg-white border-yellow-300 text-yellow-600 hover:border-yellow-500 cursor-pointer"
                            }`}
                        >
                          ＝
                        </button>
                      </div>

                      {/* Right number plate - TAPPABLE */}
                      <div className="absolute right-0 -top-24 w-28 flex flex-col items-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleChoice("right"); }}
                          disabled={phase !== "choose"}
                          className={`rounded-xl px-3 py-3 shadow-md text-center min-w-[90px] transition-all active:scale-95 select-none touch-manipulation border-3
                            ${phase !== "choose"
                              ? (problem.answer === "right"
                                ? "bg-green-100 border-green-400"
                                : "bg-white border-indigo-200")
                              : "bg-white border-indigo-300 hover:border-indigo-500 hover:shadow-lg cursor-pointer"
                            }`}
                        >
                          <p className="text-3xl font-black text-indigo-700">{problem.right}</p>
                        </button>
                        <div className="w-0.5 h-3 bg-indigo-400" />
                      </div>
                    </div>

                    {/* Fulcrum triangle */}
                    <div className="flex justify-center mt-1">
                      <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[24px] border-l-transparent border-r-transparent border-b-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dot visualization (shown after answer) */}
              {showDots && (
                <div className="w-full grid grid-cols-2 gap-3 mt-4 animate-[fadeIn_0.3s_ease-out] flex-shrink-0">
                  <div className="bg-white/80 rounded-xl p-2 border border-indigo-200 text-center">
                    <DotVis n={problem.left} />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {decompose(problem.left).hundreds > 0 && <span className="text-red-400">●百 </span>}
                      {decompose(problem.left).tens > 0 && <span className="text-blue-400">●十 </span>}
                      <span className="text-green-400">●一</span>
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2 border border-indigo-200 text-center">
                    <DotVis n={problem.right} />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {decompose(problem.right).hundreds > 0 && <span className="text-red-400">●百 </span>}
                      {decompose(problem.right).tens > 0 && <span className="text-blue-400">●十 </span>}
                      <span className="text-green-400">●一</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Tap to continue hint */}
              {(phase === "correct" || phase === "wrong") && (
                <p className="text-gray-400 text-sm mt-3 animate-pulse flex-shrink-0">タップして つぎへ</p>
              )}
            </div>
          </div>
        )}
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
