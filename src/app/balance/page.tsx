"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { playPop, playSuccess, playError } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

/* ═══════════════════════════════════════════════
   すうじてんびん - Number Balance / Scale
   Compare two numbers – which side is heavier?
   ═══════════════════════════════════════════════ */

interface Problem {
  left: number;
  right: number;
  answer: "left" | "right" | "equal";
}

function generateProblem(level: number): Problem {
  let left: number, right: number;

  if (level <= 2) {
    // Ones differ (1-20)
    left = Math.floor(Math.random() * 20) + 1;
    right = Math.floor(Math.random() * 20) + 1;
    // Ensure they're different most of the time
    if (left === right && Math.random() > 0.2) right = left + (Math.random() > 0.5 ? 1 : -1);
  } else if (level <= 4) {
    // Tens differ (10-99)
    left = Math.floor(Math.random() * 90) + 10;
    right = Math.floor(Math.random() * 90) + 10;
    if (left === right && Math.random() > 0.2) right = left + Math.floor(Math.random() * 10) + 1;
  } else if (level <= 6) {
    // Hundreds (100-999)
    left = Math.floor(Math.random() * 900) + 100;
    right = Math.floor(Math.random() * 900) + 100;
    if (left === right) right = left + Math.floor(Math.random() * 50) + 1;
  } else {
    // Tricky comparisons (199 vs 200, etc.)
    const tricky = [
      [199, 200], [100, 99], [210, 209], [300, 299],
      [109, 190], [150, 105], [500, 499], [201, 210],
      [88, 90], [101, 110], [999, 1000],
    ];
    const pair = tricky[Math.floor(Math.random() * tricky.length)];
    if (Math.random() > 0.5) {
      left = pair[0]; right = pair[1];
    } else {
      left = pair[1]; right = pair[0];
    }
  }

  left = Math.max(1, left);
  right = Math.max(1, right);

  const answer = left > right ? "left" : left < right ? "right" : "equal";
  return { left, right, answer };
}

// Break a number into hundreds, tens, ones for dot visualization
function decompose(n: number): { hundreds: number; tens: number; ones: number } {
  return {
    hundreds: Math.floor(n / 100),
    tens: Math.floor((n % 100) / 10),
    ones: n % 10,
  };
}

function DotVis({ n }: { n: number }) {
  const { hundreds, tens, ones } = decompose(n);
  return (
    <div className="flex flex-wrap items-end justify-center gap-1 min-h-[40px]">
      {/* Hundreds = red squares */}
      {Array.from({ length: hundreds }).map((_, i) => (
        <div key={`h${i}`} className="w-5 h-5 bg-red-400 rounded-sm border border-red-500" />
      ))}
      {/* Tens = blue bars */}
      {Array.from({ length: tens }).map((_, i) => (
        <div key={`t${i}`} className="w-3 h-5 bg-blue-400 rounded-sm border border-blue-500" />
      ))}
      {/* Ones = green dots */}
      {Array.from({ length: ones }).map((_, i) => (
        <div key={`o${i}`} className="w-2.5 h-2.5 bg-green-400 rounded-full border border-green-500" />
      ))}
    </div>
  );
}

export default function BalancePage() {
  const [level, setLevel] = useState(1);
  const [problem, setProblem] = useState<Problem>(() => generateProblem(1));
  const [phase, setPhase] = useState<"choose" | "correct" | "wrong">("choose");
  const [tilt, setTilt] = useState<"none" | "left" | "right" | "even">("none");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [showDots, setShowDots] = useState(false);

  const next = useCallback(() => {
    const newLevel = Math.min(8, 1 + Math.floor(score / 30));
    setLevel(newLevel);
    setProblem(generateProblem(newLevel));
    setPhase("choose");
    setTilt("none");
    setShowDots(false);
  }, [score]);

  const handleChoice = useCallback((choice: "left" | "right" | "equal") => {
    if (phase !== "choose") return;
    playPop();

    const correct = choice === problem.answer;
    setTotal((t) => t + 1);

    // Show tilt
    if (problem.left > problem.right) setTilt("left");
    else if (problem.right > problem.left) setTilt("right");
    else setTilt("even");

    setShowDots(true);

    if (correct) {
      setTimeout(() => playSuccess(), 300);
      setScore((s) => s + 10);
      setStreak((s) => {
        const ns = s + 1;
        if (ns > 0 && ns % 5 === 0) {
          setTimeout(() => setShowReward(true), 800);
        }
        return ns;
      });
      setPhase("correct");
    } else {
      setTimeout(() => playError(), 300);
      setStreak(0);
      setPhase("wrong");
    }
  }, [phase, problem]);

  // Balance beam SVG
  const beamAngle = tilt === "left" ? -12 : tilt === "right" ? 12 : 0;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-indigo-50 to-purple-50 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-indigo-700 text-sm hover:underline">
            &larr; もどる
          </Link>
          <span className="text-indigo-600 text-sm font-bold">すうじてんびん</span>
        </div>

        {/* Stats bar */}
        <div className="bg-white/90 border border-indigo-200 rounded-2xl p-3 mb-3 shadow-sm">
          <div className="flex items-center justify-between text-center">
            <div>
              <p className="text-gray-400 text-[10px]">スコア</p>
              <p className="text-indigo-600 font-bold text-lg">{score}</p>
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

        {/* Balance visualization */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          {/* The balance scale */}
          <div className="relative w-full max-w-xs h-48">
            {/* Fulcrum (triangle) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[28px] border-l-transparent border-r-transparent border-b-indigo-400" />
            </div>
            {/* Beam */}
            <div
              className="absolute bottom-7 left-1/2 -translate-x-1/2 w-64 h-2 bg-indigo-500 rounded-full origin-center transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-50%) rotate(${beamAngle}deg)` }}
            >
              {/* Left plate */}
              <div className="absolute -left-2 -top-20 w-28 flex flex-col items-center">
                <div className="bg-white border-2 border-indigo-300 rounded-xl px-3 py-2 shadow-md text-center min-w-[80px]">
                  <p className="text-3xl font-black text-indigo-700">{problem.left}</p>
                </div>
                {/* Chain */}
                <div className="w-0.5 h-4 bg-indigo-400" />
              </div>
              {/* Right plate */}
              <div className="absolute -right-2 -top-20 w-28 flex flex-col items-center">
                <div className="bg-white border-2 border-indigo-300 rounded-xl px-3 py-2 shadow-md text-center min-w-[80px]">
                  <p className="text-3xl font-black text-indigo-700">{problem.right}</p>
                </div>
                {/* Chain */}
                <div className="w-0.5 h-4 bg-indigo-400" />
              </div>
            </div>
          </div>

          {/* Dot visualization (shown after answer) */}
          {showDots && (
            <div className="w-full grid grid-cols-2 gap-3 animate-[fadeIn_0.3s_ease-out]">
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

          {/* Question / Feedback */}
          <div className="text-center mt-2">
            {phase === "choose" && (
              <p className="text-indigo-700 font-bold text-lg">
                どちらが おおきい？
              </p>
            )}
            {phase === "correct" && (
              <p className="text-green-600 font-bold text-lg animate-bounce">
                ⭕ せいかい！
              </p>
            )}
            {phase === "wrong" && (
              <p className="text-red-500 font-bold text-lg">
                ❌ {problem.answer === "left"
                  ? `${problem.left} のほうが おおきいよ`
                  : problem.answer === "right"
                    ? `${problem.right} のほうが おおきいよ`
                    : "おなじ かずだよ！"}
              </p>
            )}
          </div>

          {/* Choice buttons */}
          {phase === "choose" ? (
            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={() => handleChoice("left")}
                className="flex-1 bg-white border-3 border-indigo-300 rounded-2xl py-4 text-xl font-bold text-indigo-700 shadow-md active:scale-95 transition-transform hover:border-indigo-400"
              >
                ← ひだり
              </button>
              <button
                onClick={() => handleChoice("equal")}
                className="bg-white border-3 border-yellow-300 rounded-2xl px-4 py-4 text-xl font-bold text-yellow-600 shadow-md active:scale-95 transition-transform hover:border-yellow-400"
              >
                ＝
              </button>
              <button
                onClick={() => handleChoice("right")}
                className="flex-1 bg-white border-3 border-indigo-300 rounded-2xl py-4 text-xl font-bold text-indigo-700 shadow-md active:scale-95 transition-transform hover:border-indigo-400"
              >
                みぎ →
              </button>
            </div>
          ) : (
            <button
              onClick={next}
              className="mc-btn text-lg px-8 py-3"
            >
              つぎへ！
            </button>
          )}
        </div>
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
