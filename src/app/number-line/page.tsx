"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { playPop, playSuccess, playError, playBundle } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

type StepMode = 1 | 10;

interface Problem {
  current: number;
  step: StepMode;
  answer: number;
}

function generateProblem(difficulty: number): Problem {
  const step: StepMode = difficulty < 3 ? 1 : difficulty < 6 ? (Math.random() > 0.5 ? 1 : 10) : 10;

  let current: number;
  if (step === 1) {
    // Focus on carry-over points
    const carryPoints = [9, 19, 29, 39, 49, 59, 69, 79, 89, 99, 109, 119, 129, 139, 149, 159, 169, 179, 189, 199];
    const easyPoints = Array.from({ length: 20 }, () => Math.floor(Math.random() * 200));
    const pool = difficulty < 2 ? carryPoints.slice(0, 5) : [...carryPoints, ...easyPoints];
    current = pool[Math.floor(Math.random() * pool.length)];
  } else {
    // step === 10, focus on tens carry
    const carryPoints = [90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 190, 191, 192, 193];
    const easyPoints = Array.from({ length: 15 }, () => Math.floor(Math.random() * 19) * 10 + Math.floor(Math.random() * 10));
    const pool = difficulty < 5 ? carryPoints.slice(0, 5).concat(easyPoints.slice(0, 5)) : [...carryPoints, ...easyPoints];
    current = pool[Math.floor(Math.random() * pool.length)];
  }

  return {
    current,
    step,
    answer: current + step,
  };
}

export default function NumberLinePage() {
  const [problem, setProblem] = useState<Problem>(() => generateProblem(0));
  const [userAnswer, setUserAnswer] = useState("");
  const [showReward, setShowReward] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [message, setMessage] = useState("");
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [numbersOnLine, setNumbersOnLine] = useState<number[]>([]);
  const correctCount = useRef(0);
  const totalCount = useRef(0);

  // Build visible number line
  useEffect(() => {
    const center = problem.current;
    const start = Math.max(0, center - 5 * problem.step);
    const nums: number[] = [];
    for (let i = start; i <= center + 5 * problem.step; i += problem.step) {
      nums.push(i);
    }
    setNumbersOnLine(nums);
  }, [problem]);

  const handleSubmit = useCallback(() => {
    const parsed = parseInt(userAnswer, 10);
    totalCount.current += 1;

    if (parsed === problem.answer) {
      correctCount.current += 1;
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCleared(true);

      const isCarry =
        (problem.step === 1 && problem.current % 10 === 9) ||
        (problem.step === 10 && problem.current % 100 >= 90);

      if (isCarry) {
        playBundle();
        setMessage(`すごい！ ${problem.current} の つぎは ${problem.answer}！くりあがり できたね！`);
      } else {
        playSuccess();
        setMessage(`せいかい！ ${problem.current} + ${problem.step} = ${problem.answer}`);
      }

      // Reward every 5 correct answers
      if (newStreak > 0 && newStreak % 5 === 0) {
        setTimeout(() => setShowReward(true), 800);
      }

      setDifficulty(Math.min(10, difficulty + 1));
    } else {
      playError();
      setStreak(0);
      setShowCorrectAnswer(true);
      setMessage(`おしい！ ${problem.current} + ${problem.step} = ${problem.answer} だよ`);
    }
  }, [userAnswer, problem, streak, difficulty]);

  const nextProblem = () => {
    setProblem(generateProblem(difficulty));
    setUserAnswer("");
    setCleared(false);
    setShowCorrectAnswer(false);
    setMessage("");
  };

  const handleNumberPad = (val: string) => {
    if (cleared || showCorrectAnswer) return;
    if (val === "del") {
      setUserAnswer((prev) => prev.slice(0, -1));
    } else if (val === "ok") {
      if (userAnswer.length > 0) handleSubmit();
    } else {
      if (userAnswer.length < 3) {
        setUserAnswer((prev) => prev + val);
      }
    }
    playPop();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-gray-950 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-yellow-400 text-sm hover:underline">
            ← もどる
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-purple-300 text-sm">かぞえよう</span>
            <span className="text-yellow-400 text-xs">{streak}🔥</span>
          </div>
        </div>

        {/* Number line visualization */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4 overflow-x-auto">
          <div className="flex items-end justify-center gap-0 min-w-max mx-auto">
            {numbersOnLine.map((num, i) => {
              const isCurrent = num === problem.current;
              const isAnswer = num === problem.answer && (cleared || showCorrectAnswer);
              const isNextUnknown = num === problem.answer && !cleared && !showCorrectAnswer;

              return (
                <div key={`${num}-${i}`} className="flex flex-col items-center" style={{ minWidth: 40 }}>
                  {/* Character on current number */}
                  {isCurrent && (
                    <div className="text-2xl mb-1 animate-bounce">🧱</div>
                  )}
                  {isAnswer && (
                    <div className="text-2xl mb-1 animate-bounce-in">⭐</div>
                  )}
                  {isNextUnknown && (
                    <div className="text-2xl mb-1 text-yellow-300 animate-pulse">❓</div>
                  )}

                  {/* Number label */}
                  <span
                    className={`text-xs font-bold mb-1 ${
                      isCurrent
                        ? "text-yellow-300 text-sm"
                        : isAnswer
                        ? "text-green-400 text-sm"
                        : isNextUnknown
                        ? "text-yellow-500"
                        : "text-gray-500"
                    }`}
                  >
                    {isNextUnknown ? "？" : num}
                  </span>

                  {/* Tick mark */}
                  <div
                    className={`w-0.5 ${
                      isCurrent || isAnswer ? "h-6 bg-yellow-400" : "h-4 bg-gray-600"
                    }`}
                  />

                  {/* Line */}
                  {i < numbersOnLine.length - 1 && (
                    <div className="w-full h-0.5 bg-gray-600 -mb-0.5" />
                  )}
                </div>
              );
            })}
          </div>
          {/* Continuous line */}
          <div className="h-0.5 bg-gray-600 -mt-0.5 mx-4" />
        </div>

        {/* Question */}
        <div className="text-center mb-4">
          <p className="text-gray-300 text-lg mb-2">
            <span className="text-yellow-300 text-3xl font-bold">{problem.current}</span>
            <span className="text-gray-400 mx-2">の つぎ（+{problem.step}）は？</span>
          </p>
        </div>

        {/* Answer display */}
        <div className="text-center mb-4">
          <div className="inline-block bg-gray-800 border-2 border-gray-600 rounded-xl px-8 py-3 min-w-[150px]">
            <span className={`text-4xl font-bold ${userAnswer ? "text-white" : "text-gray-600"}`}>
              {userAnswer || "???"}
            </span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`rounded-xl p-3 mb-4 text-center ${
              cleared ? "bg-green-900/50 border border-green-700" : showCorrectAnswer ? "bg-red-900/50 border border-red-700" : "bg-gray-800/70"
            }`}
          >
            <p className="text-white text-sm">{message}</p>
          </div>
        )}

        {/* Number pad */}
        {!cleared && !showCorrectAnswer ? (
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"].map((val) => (
              <button
                key={val}
                onClick={() => handleNumberPad(val)}
                className={`py-4 rounded-xl text-2xl font-bold transition-all active:scale-95 ${
                  val === "ok"
                    ? "bg-green-700 hover:bg-green-600 text-white"
                    : val === "del"
                    ? "bg-red-800 hover:bg-red-700 text-white text-base"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
              >
                {val === "del" ? "けす" : val === "ok" ? "✓" : val}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center animate-slide-up">
            <button onClick={nextProblem} className="mc-btn text-xl px-10 py-4">
              つぎのもんだい →
            </button>
          </div>
        )}

        {/* Progress */}
        <div className="text-center text-gray-500 text-xs mt-2">
          {totalCount.current > 0 && (
            <span>
              せいかいりつ: {correctCount.current}/{totalCount.current} (
              {Math.round((correctCount.current / totalCount.current) * 100)}%)
            </span>
          )}
        </div>
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
