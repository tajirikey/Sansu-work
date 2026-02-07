"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { playPop, playSuccess } from "@/lib/sounds";
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
}

function SlotRoller({
  value, onChange, label,
  labelClass, borderClass, bgClass, centerClass, digitColor,
}: SlotRollerProps) {
  const [transY, setTransY] = useState(-CELL_H);
  const [animate, setAnimate] = useState(false);
  const rolling = useRef(false);
  const startY = useRef(0);

  const roll = useCallback((dir: 1 | -1) => {
    if (rolling.current) return;
    rolling.current = true;
    playPop();
    setAnimate(true);
    setTransY(-CELL_H + -dir * CELL_H);
    setTimeout(() => {
      setAnimate(false);
      onChange((value + dir + 10) % 10);
      setTransY(-CELL_H);
      rolling.current = false;
    }, 200);
  }, [value, onChange]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const delta = startY.current - e.clientY;
    if (Math.abs(delta) > 25) {
      roll(delta > 0 ? 1 : -1);
    }
  }, [roll]);

  const digits = [-2, -1, 0, 1, 2].map(i => ((value + i) % 10 + 10) % 10);

  return (
    <div className="flex flex-col items-center">
      <p className={`text-xs font-bold mb-1 ${labelClass}`}>{label}</p>

      {/* Up */}
      <button
        onClick={() => roll(1)}
        className={`text-2xl active:scale-75 transition-transform py-0.5 ${labelClass}`}
      >
        ▲
      </button>

      {/* Roller */}
      <div
        className={`overflow-hidden rounded-2xl border-4 touch-none select-none ${borderClass} ${bgClass}`}
        style={{ width: 92, height: CELL_H * 3 }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div className="relative w-full h-full">
          {/* Center highlight band */}
          <div
            className={`absolute left-0 right-0 pointer-events-none z-10 border-y-2 ${borderClass} ${centerClass}`}
            style={{ top: CELL_H, height: CELL_H }}
          />

          {/* Scrolling digits */}
          <div
            style={{
              transform: `translateY(${transY}px)`,
              transition: animate ? "transform 0.2s ease-out" : "none",
            }}
          >
            {digits.map((d, i) => {
              const dist = Math.abs(i - 2);
              return (
                <div
                  key={i}
                  className="flex items-center justify-center"
                  style={{ height: CELL_H }}
                >
                  <span
                    className="font-bold"
                    style={{
                      fontSize: dist === 0 ? 72 : dist === 1 ? 36 : 24,
                      color: dist === 0 ? digitColor : "#d1d5db",
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

      {/* Down */}
      <button
        onClick={() => roll(-1)}
        className={`text-2xl active:scale-75 transition-transform py-0.5 ${labelClass}`}
      >
        ▼
      </button>
    </div>
  );
}

/* ─── random spin ─── */
function useRandomSpin(
  setH: (v: number) => void,
  setT: (v: number) => void,
  setO: (v: number) => void,
) {
  const spinning = useRef(false);

  const spin = useCallback(() => {
    if (spinning.current) return;
    spinning.current = true;

    const finalH = Math.floor(Math.random() * 9) + 1;
    const finalT = Math.floor(Math.random() * 10);
    const finalO = Math.floor(Math.random() * 10);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setH(Math.floor(Math.random() * 10));
      if (count < 12) setT(Math.floor(Math.random() * 10));
      if (count < 8) setO(Math.floor(Math.random() * 10));

      if (count === 8) { setO(finalO); playPop(); }
      if (count === 12) { setT(finalT); playPop(); }
      if (count >= 15) {
        clearInterval(interval);
        setH(finalH);
        playSuccess();
        spinning.current = false;
      }
    }, 100);
  }, [setH, setT, setO]);

  return spin;
}

/* ─── page ─── */
export default function SlotPage() {
  const [hundreds, setHundreds] = useState(1);
  const [tens, setTens] = useState(2);
  const [ones, setOnes] = useState(3);

  const number = hundreds * 100 + tens * 10 + ones;
  const spin = useRandomSpin(setHundreds, setTens, setOnes);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-orange-50 to-amber-50 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">
        {/* header */}
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="text-green-700 text-sm hover:underline">← もどる</Link>
          <span className="text-orange-600 text-sm font-bold">かずをつくろう</span>
        </div>

        {/* slot rollers */}
        <div className="flex justify-center items-start gap-3 mb-3">
          <SlotRoller
            value={hundreds}
            onChange={setHundreds}
            label="百のくらい"
            labelClass="text-red-600"
            borderClass="border-red-400"
            bgClass="bg-red-50"
            centerClass="bg-red-100/80"
            digitColor="#DC2626"
          />
          <SlotRoller
            value={tens}
            onChange={setTens}
            label="十のくらい"
            labelClass="text-blue-600"
            borderClass="border-blue-400"
            bgClass="bg-blue-50"
            centerClass="bg-blue-100/80"
            digitColor="#2563EB"
          />
          <SlotRoller
            value={ones}
            onChange={setOnes}
            label="一のくらい"
            labelClass="text-green-600"
            borderClass="border-green-400"
            bgClass="bg-green-50"
            centerClass="bg-green-100/80"
            digitColor="#16A34A"
          />
        </div>

        {/* random spin button */}
        <div className="text-center mb-3">
          <button
            onClick={spin}
            className="mc-btn text-sm px-5 py-2"
          >
            スロットまわす！🎰
          </button>
        </div>

        {/* number + reading */}
        <div className="text-center mb-3">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-red-600 text-5xl font-bold">{hundreds}</span>
            <span className="text-blue-600 text-5xl font-bold">{tens}</span>
            <span className="text-green-600 text-5xl font-bold">{ones}</span>
          </div>
          <p className="text-gray-500 text-base mt-1">{numberToReading(number)}</p>
        </div>

        {/* place value equation */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-2.5 mb-3 shadow-sm">
          <div className="flex items-center justify-center gap-1.5 font-bold flex-wrap">
            <span className="text-red-600">{hundreds}×100</span>
            <span className="text-gray-300">＋</span>
            <span className="text-blue-600">{tens}×10</span>
            <span className="text-gray-300">＋</span>
            <span className="text-green-600">{ones}×1</span>
            <span className="text-gray-300">＝</span>
            <span className="text-gray-800 text-lg">{number}</span>
          </div>
        </div>

        {/* visual representation */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-3 shadow-sm flex-1 overflow-y-auto">
          <p className="text-gray-400 text-[10px] font-bold mb-2">かずのかたち</p>

          {/* hundreds */}
          {hundreds > 0 && (
            <div className="mb-2">
              <p className="text-red-500 text-[10px] font-bold mb-1">百 × {hundreds}</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: hundreds }).map((_, i) => (
                  <HundredPlate key={i} />
                ))}
              </div>
            </div>
          )}

          {/* tens */}
          {tens > 0 && (
            <div className="mb-2">
              <p className="text-blue-500 text-[10px] font-bold mb-1">十 × {tens}</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: tens }).map((_, i) => (
                  <TenBundle key={i} dotSize={8} />
                ))}
              </div>
            </div>
          )}

          {/* ones */}
          {ones > 0 && (
            <div>
              <p className="text-green-500 text-[10px] font-bold mb-1">一 × {ones}</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: ones }).map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-green-500 border-2 border-green-300" />
                ))}
              </div>
            </div>
          )}

          {number === 0 && (
            <p className="text-gray-400 text-center py-8 text-sm">
              ロールをうごかして<br />かずをつくろう！
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
