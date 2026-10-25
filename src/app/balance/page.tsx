"use client";

import { useState, useCallback } from "react";
import { rem, useUiScale } from "@/lib/ui";
import GameHeader from "@/components/GameHeader";
import LevelSelect from "@/components/LevelSelect";
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
    <div className="flex flex-wrap items-end justify-center gap-1 min-h-[2rem]">
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
      className="fixed inset-0 dream-dots bg-gradient-to-b from-indigo-50 to-purple-50 p-3 flex flex-col touch-manipulation"
      style={{ overflow: "hidden" }}
    >
      <div className="max-w-lg land:max-w-6xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <GameHeader title="すうじてんびん" accent="#5B5FEF" />

        {phase === "select" ? (
          <LevelSelect
            emoji="⚖️"
            title="すうじてんびん"
            subtitle="おおきい かずを タップしよう！"
            accent="#5B5FEF"
            tint="#E8E9FF"
            levels={LEVELS}
            onSelect={startWithLevel}
          />
        ) : (
          <div
            className="flex-1 flex flex-col min-h-0"
            onClick={handleScreenTap}
          >
            {/* Stats bar */}
            <div className="surface rounded-2xl p-2 mb-2 flex-shrink-0 land:max-w-3xl land:w-full land:mx-auto">
              <div className="flex items-center justify-between text-center">
                <div>
                  <p className="text-gray-400 text-[0.625rem]">スコア</p>
                  <p className="text-indigo-600 font-bold text-lg leading-tight">{score}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[0.625rem]">れんぞく</p>
                  <p className="text-orange-500 font-bold text-lg leading-tight">{streak}</p>
                </div>
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhase("select"); }}
                    className="text-gray-400 text-[0.625rem] underline"
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
              <div className="relative w-full max-w-sm flex-shrink-0 md:[zoom:1.3] land:[zoom:1.55] land:mt-16">
                {/* Fulcrum */}
                <div className="flex justify-center">
                  <div className="relative" style={{ width: rem(280) }}>
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
                          className={`rounded-xl px-3 py-3 shadow-md text-center min-w-[5.625rem] transition-all active:scale-95 select-none touch-manipulation border-3
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
                          className={`rounded-xl px-3 py-3 shadow-md text-center min-w-[5.625rem] transition-all active:scale-95 select-none touch-manipulation border-3
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
                      <div className="w-0 h-0 border-l-[1.125rem] border-r-[1.125rem] border-b-[1.5rem] border-l-transparent border-r-transparent border-b-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dot visualization (shown after answer) */}
              {showDots && (
                <div className="w-full land:max-w-3xl grid grid-cols-2 gap-3 mt-4 animate-[fadeIn_0.3s_ease-out] flex-shrink-0">
                  <div className="surface rounded-xl p-2 text-center">
                    <DotVis n={problem.left} />
                    <p className="text-[0.625rem] text-gray-400 mt-1">
                      {decompose(problem.left).hundreds > 0 && <span className="text-red-400">●百 </span>}
                      {decompose(problem.left).tens > 0 && <span className="text-blue-400">●十 </span>}
                      <span className="text-green-400">●一</span>
                    </p>
                  </div>
                  <div className="surface rounded-xl p-2 text-center">
                    <DotVis n={problem.right} />
                    <p className="text-[0.625rem] text-gray-400 mt-1">
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
