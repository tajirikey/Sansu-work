"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { playPop, playSuccess, playError } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";
import TenBundle from "@/components/TenBundle";
import HundredPlate from "@/components/HundredPlate";

/* ─── reading helper ─── */
function numberToReading(n: number): string {
  if (n === 0) return "ゼロ";
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  const hN = [
    "", "ひゃく", "にひゃく", "さんびゃく", "よんひゃく",
    "ごひゃく", "ろっぴゃく", "ななひゃく", "はっぴゃく", "きゅうひゃく",
  ];
  const tN = [
    "", "じゅう", "にじゅう", "さんじゅう", "よんじゅう",
    "ごじゅう", "ろくじゅう", "ななじゅう", "はちじゅう", "きゅうじゅう",
  ];
  const oN = [
    "", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう",
  ];
  return `${hN[h]}${tN[t]}${oN[o]}`;
}

/* ─── question generator ─── */
type QuestionType = "number" | "reading" | "placeValue";

interface Question {
  target: number;
  type: QuestionType;
}

function generateQuestion(difficulty: number, lastTarget: number): Question {
  const maxAttempts = 20;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const q = generateQuestionInner(difficulty);
    if (q.target !== lastTarget) return q;
  }
  return generateQuestionInner(difficulty);
}

function generateQuestionInner(difficulty: number): Question {
  let target: number;

  if (difficulty < 3) {
    const pool = [100, 200, 300, 120, 150, 230, 340, 450, 210, 320, 500, 130, 240, 310, 420];
    target = pool[Math.floor(Math.random() * pool.length)];
  } else if (difficulty < 6) {
    const pool = [
      105, 301, 400, 250, 602, 710, 803, 190, 506, 208,
      111, 222, 333, 444, 555, 109, 110, 199, 200, 909,
      170, 360, 480, 530, 607, 801, 920, 104, 203, 502,
    ];
    target = pool[Math.floor(Math.random() * pool.length)];
  } else {
    target = Math.floor(Math.random() * 900) + 100;
  }

  let type: QuestionType;
  if (difficulty < 2) {
    type = "number";
  } else if (difficulty < 5) {
    type = Math.random() > 0.5 ? "number" : "placeValue";
  } else {
    const r = Math.random();
    type = r < 0.3 ? "number" : r < 0.6 ? "placeValue" : "reading";
  }

  return { target, type };
}

/* ─── slot roller ─── */
const CELL_H = 88;

interface SlotRollerProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  labelClass: string;
  borderClass: string;
  bgClass: string;
  centerClass: string;
  digitColor: string;
  wrong?: boolean;
  disabled?: boolean;
}

function SlotRoller({
  value, onChange, label,
  labelClass, borderClass, bgClass, centerClass, digitColor,
  wrong, disabled,
}: SlotRollerProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);
  const valueRef = useRef(value);
  // Velocity tracking
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);

  useEffect(() => { valueRef.current = value; }, [value]);

  const doRoll = useCallback((dir: 1 | -1) => {
    if (disabled) return;
    playPop();
    const next = (valueRef.current + dir + 10) % 10;
    valueRef.current = next;
    onChange(next);
  }, [onChange, disabled]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    dragging.current = true;
    startY.current = e.clientY;
    lastY.current = e.clientY;
    lastTime.current = Date.now();
    velocity.current = 0;
    setDragOffset(0);
    setIsSnapping(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [disabled]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = (e.clientY - lastY.current) / dt;
    }
    lastY.current = e.clientY;
    lastTime.current = now;

    let delta = e.clientY - startY.current;

    // Snap when dragged past 40% of cell (down = increase, up = decrease)
    while (delta > CELL_H * 0.4) {
      doRoll(1);
      startY.current += CELL_H;
      delta -= CELL_H;
    }
    while (delta < -CELL_H * 0.4) {
      doRoll(-1);
      startY.current -= CELL_H;
      delta += CELL_H;
    }
    setDragOffset(delta);
  }, [doRoll]);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;

    const vel = velocity.current; // px/ms
    const absVel = Math.abs(vel);

    // Flick detection: if velocity is high enough, snap even with small offset
    if (absVel > 0.3) {
      // Flick! Snap in the direction of velocity
      if (vel > 0) {
        doRoll(1);
      } else {
        doRoll(-1);
      }
    } else if (dragOffset > CELL_H * 0.2) {
      doRoll(1);
    } else if (dragOffset < -CELL_H * 0.2) {
      doRoll(-1);
    }

    setIsSnapping(true);
    setDragOffset(0);
    setTimeout(() => setIsSnapping(false), 180);
  }, [dragOffset, doRoll]);

  const digits = [2, 1, 0, -1, -2].map(i => ((value + i) % 10 + 10) % 10);
  const totalY = -CELL_H + dragOffset;

  return (
    <div className="flex flex-col items-center">
      <p className={`text-xs font-bold mb-1 ${labelClass}`}>{label}</p>

      {/* Roller body */}
      <div
        className={`overflow-hidden rounded-2xl border-4 touch-none select-none
          ${wrong ? "border-red-500 animate-shake" : borderClass}
          ${disabled ? "opacity-60" : ""} ${bgClass}`}
        style={{ width: 92, height: CELL_H * 3 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="relative w-full h-full">
          {/* Center highlight band */}
          <div
            className={`absolute left-0 right-0 pointer-events-none z-10 border-y-2
              ${wrong ? "border-red-400 bg-red-100/60" : `${borderClass} ${centerClass}`}`}
            style={{ top: CELL_H, height: CELL_H }}
          />

          {/* Scrolling digits */}
          <div
            style={{
              transform: `translateY(${totalY}px)`,
              transition: isSnapping ? "transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
            }}
          >
            {digits.map((d, i) => {
              const dist = Math.abs(i - 2);
              return (
                <div key={i} className="flex items-center justify-center" style={{ height: CELL_H }}>
                  <span
                    className="font-bold"
                    style={{
                      fontSize: dist === 0 ? 72 : dist === 1 ? 36 : 24,
                      color: dist === 0 ? (wrong ? "#EF4444" : digitColor) : "#d1d5db",
                      opacity: dist === 0 ? 1 : dist === 1 ? 0.5 : 0.25,
                    }}
                  >
                    {d}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Small up/down buttons */}
      <div className="flex gap-4 mt-1">
        <button
          onClick={() => !disabled && doRoll(-1)}
          className={`text-lg active:scale-75 transition-transform ${disabled ? "opacity-30" : labelClass}`}
        >
          ▼
        </button>
        <button
          onClick={() => !disabled && doRoll(1)}
          className={`text-lg active:scale-75 transition-transform ${disabled ? "opacity-30" : labelClass}`}
        >
          ▲
        </button>
      </div>
    </div>
  );
}

/* ─── question display ─── */
function QuestionDisplay({ question }: { question: Question }) {
  const { target, type } = question;
  const h = Math.floor(target / 100);
  const t = Math.floor((target % 100) / 10);
  const o = target % 10;

  if (type === "reading") {
    return (
      <div className="text-center">
        <p className="text-gray-400 text-xs mb-1">よみかたから かずをつくろう</p>
        <p className="text-2xl font-bold text-orange-600 tracking-wide">
          {numberToReading(target)}
        </p>
      </div>
    );
  }

  if (type === "placeValue") {
    return (
      <div className="text-center">
        <p className="text-gray-400 text-xs mb-1">くらいから かずをつくろう</p>
        <div className="flex items-baseline justify-center gap-1.5 text-2xl font-bold">
          <span className="text-red-600">{h}</span>
          <span className="text-red-400 text-lg">百</span>
          <span className="text-blue-600">{t}</span>
          <span className="text-blue-400 text-lg">十</span>
          <span className="text-green-600">{o}</span>
          <span className="text-green-400 text-lg">一</span>
        </div>
      </div>
    );
  }

  // "number" type
  return (
    <div className="text-center">
      <p className="text-gray-400 text-xs mb-1">この かずを つくろう</p>
      <p className="text-5xl font-bold text-gray-800">{target}</p>
    </div>
  );
}

/* ─── page ─── */
export default function SlotPage() {
  const [hundreds, setHundreds] = useState(0);
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const [question, setQuestion] = useState<Question>(() => generateQuestion(0, -1));
  const [cleared, setCleared] = useState(false);
  const [message, setMessage] = useState("");
  const [wrongPlaces, setWrongPlaces] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const correctCount = useRef(0);
  const totalCount = useRef(0);
  const lastTarget = useRef(-1);

  const number = hundreds * 100 + tens * 10 + ones;

  useEffect(() => {
    setQuestion(generateQuestion(0, -1));
  }, []);

  const handleCheck = useCallback(() => {
    totalCount.current += 1;
    const tgt = question.target;
    if (number === tgt) {
      correctCount.current += 1;
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCleared(true);
      setWrongPlaces(new Set());
      playSuccess();
      const h = Math.floor(tgt / 100);
      const t = Math.floor((tgt % 100) / 10);
      const o = tgt % 10;
      setMessage(
        `せいかい！ ${tgt} は ${h}百 ${t}十 ${o}一 だね！（${numberToReading(tgt)}）`,
      );
      setDifficulty((d) => Math.min(10, d + 1));
      setTimeout(() => setShowReward(true), 800);
    } else {
      playError();
      setStreak(0);
      const targetH = Math.floor(tgt / 100);
      const targetT = Math.floor((tgt % 100) / 10);
      const targetO = tgt % 10;
      const wrong = new Set<string>();
      if (hundreds !== targetH) wrong.add("h");
      if (tens !== targetT) wrong.add("t");
      if (ones !== targetO) wrong.add("o");
      setWrongPlaces(wrong);
      setMessage("あかいところが ちがうよ。なおしてみよう！");
    }
  }, [number, question, streak, hundreds, tens, ones]);

  const nextQuestion = useCallback(() => {
    lastTarget.current = question.target;
    const q = generateQuestion(difficulty, lastTarget.current);
    setQuestion(q);
    setHundreds(0);
    setTens(0);
    setOnes(0);
    setCleared(false);
    setMessage("");
    setWrongPlaces(new Set());
  }, [difficulty, question.target]);

  /* bonus: random spin to generate a quick answer */
  const spinToAnswer = useCallback(() => {
    if (cleared) return;
    const tgt = question.target;
    setHundreds(Math.floor(tgt / 100));
    setTens(Math.floor((tgt % 100) / 10));
    setOnes(tgt % 10);
    playPop();
  }, [question, cleared]);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50 to-amber-50 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">
        {/* header */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-green-700 text-sm hover:underline">← もどる</Link>
          <div className="flex items-center gap-3">
            <span className="text-orange-600 text-sm font-bold">かずをつくろう</span>
            <span className="text-orange-500 text-xs">{streak}🔥</span>
          </div>
        </div>

        {/* question */}
        <div className="bg-white/80 border border-orange-200 rounded-xl p-3 mb-3 shadow-sm">
          <QuestionDisplay question={question} />
        </div>

        {/* slot rollers */}
        <div className="flex justify-center items-start gap-3 mb-2">
          <SlotRoller
            value={hundreds}
            onChange={(v) => { setHundreds(v); setWrongPlaces((p) => { const n = new Set(p); n.delete("h"); return n; }); }}
            label="百のくらい"
            labelClass="text-red-600"
            borderClass="border-red-400"
            bgClass="bg-red-50"
            centerClass="bg-red-100/80"
            digitColor="#DC2626"
            wrong={wrongPlaces.has("h")}
            disabled={cleared}
          />
          <SlotRoller
            value={tens}
            onChange={(v) => { setTens(v); setWrongPlaces((p) => { const n = new Set(p); n.delete("t"); return n; }); }}
            label="十のくらい"
            labelClass="text-blue-600"
            borderClass="border-blue-400"
            bgClass="bg-blue-50"
            centerClass="bg-blue-100/80"
            digitColor="#2563EB"
            wrong={wrongPlaces.has("t")}
            disabled={cleared}
          />
          <SlotRoller
            value={ones}
            onChange={(v) => { setOnes(v); setWrongPlaces((p) => { const n = new Set(p); n.delete("o"); return n; }); }}
            label="一のくらい"
            labelClass="text-green-600"
            borderClass="border-green-400"
            bgClass="bg-green-50"
            centerClass="bg-green-100/80"
            digitColor="#16A34A"
            wrong={wrongPlaces.has("o")}
            disabled={cleared}
          />
        </div>

        {/* current number + equation */}
        <div className="bg-white/80 border border-gray-200 rounded-lg p-2 mb-2 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-sm font-bold">
            <span className="text-red-600">{hundreds}×100</span>
            <span className="text-gray-300">＋</span>
            <span className="text-blue-600">{tens}×10</span>
            <span className="text-gray-300">＋</span>
            <span className="text-green-600">{ones}×1</span>
            <span className="text-gray-300">＝</span>
            <span className="text-gray-800 text-base">{number}</span>
          </div>
        </div>

        {/* message */}
        {message && (
          <div
            className={`rounded-lg p-2 mb-2 text-center text-sm ${
              cleared
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* action buttons */}
        <div className="text-center mb-2">
          {!cleared ? (
            <button onClick={handleCheck} className="mc-btn mc-btn-blue text-base px-8 py-2.5">
              こたえあわせ ✓
            </button>
          ) : (
            <button onClick={nextQuestion} className="mc-btn text-base px-8 py-2.5 animate-slide-up">
              つぎのもんだい →
            </button>
          )}
        </div>

        {/* visual */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-2.5 shadow-sm flex-1 overflow-y-auto">
          <p className="text-gray-400 text-[10px] font-bold mb-1.5">いまの かずのかたち</p>

          {hundreds > 0 && (
            <div className="mb-1.5">
              <p className="text-red-500 text-[10px] font-bold mb-0.5">百 × {hundreds}</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: hundreds }).map((_, i) => (
                  <HundredPlate key={i} />
                ))}
              </div>
            </div>
          )}

          {tens > 0 && (
            <div className="mb-1.5">
              <p className="text-blue-500 text-[10px] font-bold mb-0.5">十 × {tens}</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: tens }).map((_, i) => (
                  <TenBundle key={i} dotSize={8} />
                ))}
              </div>
            </div>
          )}

          {ones > 0 && (
            <div>
              <p className="text-green-500 text-[10px] font-bold mb-0.5">一 × {ones}</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: ones }).map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-300" />
                ))}
              </div>
            </div>
          )}

          {number === 0 && (
            <p className="text-gray-400 text-center py-4 text-xs">
              ロールをスライドして かずをつくろう！
            </p>
          )}
        </div>

        {/* bottom: bonus spin + stats */}
        <div className="flex items-center justify-between mt-2 pb-2">
          <button
            onClick={spinToAnswer}
            disabled={cleared}
            className="text-gray-400 text-[10px] underline disabled:opacity-30"
          >
            ヒント（こたえを見る）
          </button>
          <div className="text-gray-400 text-[10px]">
            {totalCount.current > 0 && (
              <span>
                せいかいりつ: {correctCount.current}/{totalCount.current} (
                {Math.round((correctCount.current / totalCount.current) * 100)}%)
              </span>
            )}
          </div>
        </div>
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
