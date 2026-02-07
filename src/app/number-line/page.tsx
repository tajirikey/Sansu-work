"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { playPop, playSuccess, playError, playBundle } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

type StepMode = 1 | -1 | 10 | -10;
type UserMode = "plus" | "minus" | "mix";

interface Problem {
  current: number;
  step: StepMode;
  answer: number;
}

function generateProblem(difficulty: number, mode: UserMode): Problem {
  let step: StepMode;

  if (mode === "plus") {
    step = difficulty < 5 ? 1 : (Math.random() > 0.4 ? 1 : 10);
  } else if (mode === "minus") {
    step = difficulty < 5 ? -1 : (Math.random() > 0.4 ? -1 : -10);
  } else {
    // mix
    if (difficulty < 3) {
      step = Math.random() > 0.4 ? 1 : -1;
    } else if (difficulty < 6) {
      const r = Math.random();
      step = r < 0.25 ? 1 : r < 0.5 ? -1 : r < 0.75 ? 10 : -10;
    } else {
      const r = Math.random();
      step = r < 0.25 ? 1 : r < 0.5 ? -1 : r < 0.75 ? 10 : -10;
    }
  }

  let current: number;

  if (step === 1) {
    const carryPoints = [9, 19, 29, 39, 49, 59, 69, 79, 89, 99, 109, 119, 129, 139, 149, 159, 169, 179, 189, 199];
    const easyPoints = Array.from({ length: 15 }, () => Math.floor(Math.random() * 199) + 1);
    const pool = difficulty < 2 ? carryPoints.slice(0, 5) : [...carryPoints, ...easyPoints];
    current = pool[Math.floor(Math.random() * pool.length)];
  } else if (step === -1) {
    const borrowPoints = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];
    const easyPoints = Array.from({ length: 15 }, () => Math.floor(Math.random() * 199) + 2);
    const pool = difficulty < 2 ? borrowPoints.slice(0, 5) : [...borrowPoints, ...easyPoints];
    current = pool[Math.floor(Math.random() * pool.length)];
  } else if (step === 10) {
    const carryPoints = [90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 190, 191, 192, 193];
    const easyPoints = Array.from({ length: 15 }, () =>
      Math.floor(Math.random() * 19) * 10 + Math.floor(Math.random() * 10),
    );
    const pool = difficulty < 5 ? carryPoints.slice(0, 5).concat(easyPoints.slice(0, 5)) : [...carryPoints, ...easyPoints];
    current = pool[Math.floor(Math.random() * pool.length)];
  } else {
    // step === -10
    const borrowPoints = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 200, 201, 202, 203];
    const easyPoints = Array.from({ length: 15 }, () =>
      Math.floor(Math.random() * 19) * 10 + Math.floor(Math.random() * 10) + 10,
    );
    const pool = difficulty < 5 ? borrowPoints.slice(0, 5).concat(easyPoints.slice(0, 5)) : [...borrowPoints, ...easyPoints];
    current = pool[Math.floor(Math.random() * pool.length)];
  }

  return { current, step, answer: current + step };
}

function stepLabel(step: StepMode): string {
  if (step === 1) return "つぎ（＋1）";
  if (step === -1) return "まえ（−1）";
  if (step === 10) return "＋10";
  return "−10";
}

const MODE_OPTIONS: { value: UserMode; label: string }[] = [
  { value: "plus", label: "＋ たす" },
  { value: "minus", label: "− ひく" },
  { value: "mix", label: "まぜる" },
];

export default function NumberLinePage() {
  const [mode, setMode] = useState<UserMode>("plus");
  const [problem, setProblem] = useState<Problem>(() => generateProblem(0, "plus"));
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

  useEffect(() => {
    const center = problem.current;
    const absStep = Math.abs(problem.step);
    const start = Math.max(0, center - 5 * absStep);
    const end = center + 5 * absStep;
    const nums: number[] = [];
    for (let i = start; i <= end; i += absStep) {
      nums.push(i);
    }
    setNumbersOnLine(nums);
  }, [problem]);

  const switchMode = (newMode: UserMode) => {
    setMode(newMode);
    setProblem(generateProblem(difficulty, newMode));
    setUserAnswer("");
    setCleared(false);
    setShowCorrectAnswer(false);
    setMessage("");
  };

  const handleSubmit = useCallback(() => {
    const parsed = parseInt(userAnswer, 10);
    if (isNaN(parsed)) return;

    totalCount.current += 1;

    if (parsed === problem.answer) {
      correctCount.current += 1;
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCleared(true);

      const isCarry =
        (problem.step === 1 && problem.current % 10 === 9) ||
        (problem.step === -1 && problem.current % 10 === 0) ||
        (problem.step === 10 && problem.current % 100 >= 90) ||
        (problem.step === -10 && problem.current % 100 < 10);

      if (isCarry) {
        playBundle();
        setMessage(
          problem.step === -1
            ? `すごい！ ${problem.current} の まえは ${problem.answer}！くりさがり できたね！`
            : `すごい！ ${problem.current} の つぎは ${problem.answer}！くりあがり できたね！`,
        );
      } else {
        playSuccess();
        setMessage(`せいかい！ ${problem.current} ${problem.step > 0 ? "+" : ""}${problem.step} = ${problem.answer}`);
      }

      if (newStreak > 0 && newStreak % 5 === 0) {
        setTimeout(() => setShowReward(true), 800);
      }
      setDifficulty(Math.min(10, difficulty + 1));
    } else {
      playError();
      setStreak(0);
      setShowCorrectAnswer(true);
      setMessage(`おしい！ ${problem.current} ${problem.step > 0 ? "+" : ""}${problem.step} = ${problem.answer} だよ`);
    }
  }, [userAnswer, problem, streak, difficulty]);

  const nextProblem = () => {
    setProblem(generateProblem(difficulty, mode));
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
    <div className="min-h-[100dvh] bg-gradient-to-b from-purple-50 to-amber-50 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-green-700 text-sm hover:underline">← もどる</Link>
          <div className="flex items-center gap-3">
            <span className="text-purple-600 text-sm font-bold">かぞえよう</span>
            <span className="text-orange-500 text-xs">{streak}🔥</span>
          </div>
        </div>

        {/* mode toggle */}
        <div className="flex justify-center gap-1 mb-3">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => switchMode(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                mode === opt.value
                  ? "bg-purple-500 text-white border-2 border-purple-400 shadow-md"
                  : "bg-white text-gray-500 border-2 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* number line */}
        <div className="bg-white/80 border border-gray-200 shadow-sm rounded-xl p-3 mb-3 overflow-x-auto">
          <div className="flex items-end justify-center gap-0 min-w-max mx-auto">
            {numbersOnLine.map((num, i) => {
              const isCurrent = num === problem.current;
              const isAnswer = num === problem.answer && (cleared || showCorrectAnswer);
              const isNextUnknown = num === problem.answer && !cleared && !showCorrectAnswer;

              return (
                <div key={`${num}-${i}`} className="flex flex-col items-center" style={{ minWidth: 38 }}>
                  {isCurrent && <div className="text-xl mb-1 animate-bounce">🧱</div>}
                  {isAnswer && <div className="text-xl mb-1 animate-bounce-in">⭐</div>}
                  {isNextUnknown && <div className="text-xl mb-1 text-yellow-300 animate-pulse">❓</div>}

                  <span
                    className={`text-xs font-bold mb-1 ${
                      isCurrent ? "text-purple-600 text-sm" : isAnswer ? "text-green-400 text-sm" : isNextUnknown ? "text-orange-500" : "text-gray-400"
                    }`}
                  >
                    {isNextUnknown ? "？" : num}
                  </span>

                  <div className={`w-0.5 ${isCurrent || isAnswer ? "h-5 bg-yellow-400" : "h-3 bg-gray-300"}`} />
                </div>
              );
            })}
          </div>
          <div className="h-0.5 bg-gray-300 -mt-0.5 mx-4" />
        </div>

        {/* question */}
        <div className="text-center mb-3">
          <span className="text-purple-700 text-3xl font-bold">{problem.current}</span>
          <span className="text-gray-500 mx-2 text-base">の {stepLabel(problem.step)} は？</span>
        </div>

        {/* answer display */}
        <div className="text-center mb-3">
          <div className="inline-block bg-white border-2 border-gray-300 shadow-sm rounded-xl px-6 py-2 min-w-[140px]">
            <span className={`text-3xl font-bold ${userAnswer ? "text-gray-800" : "text-gray-300"}`}>
              {userAnswer || "???"}
            </span>
          </div>
        </div>

        {/* message */}
        {message && (
          <div
            className={`rounded-lg p-2 mb-3 text-center ${
              cleared ? "bg-green-50 border border-green-200" : showCorrectAnswer ? "bg-red-50 border border-red-200" : "bg-white/80"
            }`}
          >
            <p className="text-gray-700 text-sm">{message}</p>
          </div>
        )}

        {/* number pad / next */}
        <div className="flex-1 flex flex-col justify-end">
          {!cleared && !showCorrectAnswer ? (
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto w-full">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"].map((val) => (
                <button
                  key={val}
                  onClick={() => handleNumberPad(val)}
                  className={`py-3.5 rounded-xl text-xl font-bold transition-all active:scale-95 ${
                    val === "ok"
                      ? "bg-green-500 hover:bg-green-600 text-white text-base"
                      : val === "del"
                      ? "bg-red-100 hover:bg-red-200 text-red-700 text-sm"
                      : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 shadow-sm"
                  }`}
                >
                  {val === "del" ? "けす" : val === "ok" ? "こたえあわせ ✓" : val}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center animate-slide-up">
              <button onClick={nextProblem} className="mc-btn text-lg px-8 py-3">
                つぎのもんだい →
              </button>
            </div>
          )}
        </div>

        {/* progress */}
        <div className="text-center text-gray-400 text-xs mt-2 pb-2">
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
