"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import TenBundle from "@/components/TenBundle";
import HundredPlate from "@/components/HundredPlate";
import { playPop, playBundle, playSuccess, playError } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

/* ─── constants ─── */
const COLS = 10;
const CELL = 36;
const DOT_SIZE = 26;
const DOT_R = DOT_SIZE / 2 + 6;

/* ─── helpers ─── */
interface DotState {
  id: number;
  selected: boolean;
  bundled: boolean;
  hiding: boolean;
}
interface BarState {
  id: number;
  selected: boolean;
  bundledToPlate: boolean;
}

function makeDots(n: number): DotState[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    selected: false,
    bundled: false,
    hiding: false,
  }));
}

function randomTarget(): number {
  // 11–99: fits on one screen
  return Math.floor(Math.random() * 89) + 11;
}

function numberToReading(n: number): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  const hN = ["", "ひゃく", "にひゃく"];
  const tN = ["", "じゅう", "にじゅう", "さんじゅう", "よんじゅう", "ごじゅう", "ろくじゅう", "ななじゅう", "はちじゅう", "きゅうじゅう"];
  const oN = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];
  return `${hN[h] || ""}${tN[t]}${oN[o]}`;
}

/* ─── page ─── */
export default function BundlingPage() {
  const [target, setTarget] = useState(() => randomTarget());
  const [dots, setDots] = useState<DotState[]>(() => makeDots(randomTarget()));
  const [bars, setBars] = useState<BarState[]>([]);
  const [plates, setPlates] = useState(0);
  const [message, setMessage] = useState("まるを 10こ えらんで「まとめる！」をおそう");
  const [cleared, setCleared] = useState(false);
  const [showReward, setShowReward] = useState(false);

  const [morphDots, setMorphDots] = useState<{ x: number; y: number }[]>([]);
  const [morphTarget, setMorphTarget] = useState<{ x: number; y: number } | null>(null);
  const [morphPhase, setMorphPhase] = useState<"idle" | "fly">("idle");
  const isAnimating = morphPhase !== "idle";

  const gridRef = useRef<HTMLDivElement>(null);
  const bundleAreaRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const lastHit = useRef(-1);

  useEffect(() => {
    const t = randomTarget();
    setTarget(t);
    setDots(makeDots(t));
  }, []);

  const visible = dots.filter((d) => !d.bundled && !d.hiding);
  const selectedCount = visible.filter((d) => d.selected).length;
  const unbundledBars = bars.filter((b) => !b.bundledToPlate);
  const selectedBarCount = unbundledBars.filter((b) => b.selected).length;

  const hitTest = useCallback(
    (cx: number, cy: number): number => {
      if (!gridRef.current) return -1;
      const rect = gridRef.current.getBoundingClientRect();
      const x = cx - rect.left;
      const y = cy - rect.top;
      const col = Math.floor(x / CELL);
      const row = Math.floor(y / CELL);
      if (col < 0 || col >= COLS || row < 0) return -1;
      const idx = row * COLS + col;
      if (idx < 0 || idx >= visible.length) return -1;
      const ctrX = col * CELL + CELL / 2;
      const ctrY = row * CELL + CELL / 2;
      if (Math.hypot(x - ctrX, y - ctrY) > DOT_R) return -1;
      return idx;
    },
    [visible.length],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (cleared || isAnimating) return;
      dragging.current = true;
      moved.current = false;
      lastHit.current = -1;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [cleared, isAnimating],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || cleared || isAnimating) return;
      moved.current = true;
      const idx = hitTest(e.clientX, e.clientY);
      if (idx >= 0 && idx !== lastHit.current) {
        lastHit.current = idx;
        const dot = visible[idx];
        if (!dot.selected) {
          playPop();
          setDots((prev) =>
            prev.map((d) => (d.id === dot.id ? { ...d, selected: true } : d)),
          );
        }
      }
    },
    [cleared, isAnimating, hitTest, visible],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      if (!moved.current) {
        const idx = hitTest(e.clientX, e.clientY);
        if (idx >= 0) {
          const dot = visible[idx];
          playPop();
          setDots((prev) =>
            prev.map((d) => (d.id === dot.id ? { ...d, selected: !d.selected } : d)),
          );
        }
      }
      dragging.current = false;
    },
    [hitTest, visible],
  );

  const handleBundleDots = useCallback(() => {
    if (isAnimating || cleared) return;
    const sel = visible.filter((d) => d.selected);
    if (sel.length !== 10) {
      playError();
      setMessage(
        sel.length === 0
          ? "まるを 10こ えらんでね"
          : `いま ${sel.length}こ えらんでるよ。10こ にしよう！`,
      );
      return;
    }

    const positions: { x: number; y: number }[] = [];
    if (gridRef.current) {
      sel.forEach((d) => {
        const el = gridRef.current!.querySelector(`[data-did="${d.id}"]`);
        if (el) {
          const r = el.getBoundingClientRect();
          positions.push({ x: r.left, y: r.top });
        }
      });
    }

    let tx = 0;
    let ty = 0;
    if (bundleAreaRef.current) {
      const r = bundleAreaRef.current.getBoundingClientRect();
      tx = r.left + 12 + (unbundledBars.length % 5) * 100;
      ty = r.top + 28;
    }

    setDots((prev) =>
      prev.map((d) =>
        sel.find((s) => s.id === d.id) ? { ...d, hiding: true, selected: false } : d,
      ),
    );

    setMorphDots(positions);
    setMorphTarget({ x: tx, y: ty });
    setMorphPhase("idle");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMorphPhase("fly");
        playBundle();
      });
    });

    setTimeout(() => {
      setDots((prev) =>
        prev.map((d) =>
          sel.find((s) => s.id === d.id)
            ? { ...d, bundled: true, hiding: false, selected: false }
            : d,
        ),
      );
      setBars((prev) => [
        ...prev,
        { id: Date.now(), selected: false, bundledToPlate: false },
      ]);
      setMorphDots([]);
      setMorphTarget(null);
      setMorphPhase("idle");
      setMessage("10こ まとめて 十のたば にしたよ！");
    }, 650);
  }, [isAnimating, cleared, visible, unbundledBars.length]);

  const handleBundleBars = useCallback(() => {
    if (isAnimating || cleared) return;
    const sel = unbundledBars.filter((b) => b.selected);
    if (sel.length !== 10) {
      playError();
      setMessage(
        sel.length === 0
          ? "十のたばを 10こ えらんでね"
          : `いま ${sel.length}こ えらんでるよ。10こ にしよう！`,
      );
      return;
    }
    playBundle();
    setBars((prev) =>
      prev.map((b) =>
        sel.find((s) => s.id === b.id)
          ? { ...b, bundledToPlate: true, selected: false }
          : b,
      ),
    );
    setPlates((p) => p + 1);
    setMessage("十のたば 10こで 百のいた にしたよ！");
  }, [isAnimating, cleared, unbundledBars]);

  const toggleBar = (barId: number) => {
    if (cleared || isAnimating) return;
    playPop();
    setBars((prev) =>
      prev.map((b) => (b.id === barId ? { ...b, selected: !b.selected } : b)),
    );
  };

  const handleCheck = () => {
    const onesLeft = dots.filter((d) => !d.bundled).length;
    const tensLeft = bars.filter((b) => !b.bundledToPlate).length;
    const val = plates * 100 + tensLeft * 10 + onesLeft;

    if (val !== target) {
      playError();
      setMessage("かずが あわないよ？ もういちど たしかめてね");
      return;
    }
    if (onesLeft >= 10) {
      playError();
      setMessage("まだ まとめられるよ！ まるを 10こ えらんで まとめよう");
      return;
    }
    if (tensLeft >= 10) {
      playError();
      setMessage("十のたばも まとめられるよ！ 10こ えらんで まとめよう");
      return;
    }
    setCleared(true);
    playSuccess();
    setMessage(
      `せいかい！ ${target} は ${plates > 0 ? plates + "百 " : ""}${tensLeft}十 ${onesLeft}一 だね！`,
    );
    setTimeout(() => setShowReward(true), 800);
  };

  const nextProblem = () => {
    const t = randomTarget();
    setTarget(t);
    setDots(makeDots(t));
    setBars([]);
    setPlates(0);
    setCleared(false);
    setShowReward(false);
    setMessage("まるを 10こ えらんで「まとめる！」をおそう");
  };

  const clearSelection = () => {
    setDots((prev) => prev.map((d) => ({ ...d, selected: false })));
    setBars((prev) => prev.map((b) => ({ ...b, selected: false })));
    setMessage("せんたく クリア！");
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-green-900 to-gray-950 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">
        {/* header */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-yellow-400 text-sm hover:underline">← もどる</Link>
          <span className="text-green-300 text-sm font-bold">まとめてみよう</span>
        </div>

        {/* target + counters row */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-center flex-1">
            <p className="text-gray-400 text-xs">つくるかず</p>
            <div className="text-4xl font-bold text-yellow-300 leading-tight">{target}</div>
            <p className="text-gray-500 text-[10px]">{numberToReading(target)}</p>
          </div>
          <div className="flex gap-2 text-xs">
            {plates > 0 && (
              <div className="bg-red-900/50 rounded px-2 py-1 border border-red-700">
                <span className="text-red-300">百</span> <span className="text-white font-bold">{plates}</span>
              </div>
            )}
            <div className="bg-blue-900/50 rounded px-2 py-1 border border-blue-700">
              <span className="text-blue-300">十</span> <span className="text-white font-bold">{unbundledBars.length}</span>
            </div>
            <div className="bg-green-900/50 rounded px-2 py-1 border border-green-700">
              <span className="text-green-300">一</span> <span className="text-white font-bold">{visible.length}</span>
            </div>
          </div>
        </div>

        {/* message */}
        <div className="bg-gray-800/70 rounded-lg p-2 mb-2 text-center">
          <p className="text-white text-xs">{message}</p>
        </div>

        {/* 百 plates */}
        {plates > 0 && (
          <div className="bg-red-950/40 rounded-lg p-2 mb-2 border border-red-800">
            <p className="text-red-300 text-[10px] mb-1 font-bold">百のいた</p>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: plates }).map((_, i) => (
                <HundredPlate key={i} />
              ))}
            </div>
          </div>
        )}

        {/* 十 bars */}
        <div ref={bundleAreaRef} className="bg-blue-950/40 rounded-lg p-2 mb-2 border border-blue-800 min-h-[56px]">
          <p className="text-blue-300 text-[10px] mb-1 font-bold">
            十のたば
            {unbundledBars.length >= 10 && (
              <span className="text-yellow-300 ml-1">← 10こ えらんで まとめよう！</span>
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unbundledBars.map((bar) => (
              <button key={bar.id} onClick={() => toggleBar(bar.id)} className="transition-transform active:scale-95">
                <TenBundle selected={bar.selected} dotSize={10} />
              </button>
            ))}
            {unbundledBars.length === 0 && (
              <p className="text-gray-600 text-[10px]">まるを まとめると ここに たばが できるよ</p>
            )}
          </div>
        </div>

        {/* 一 dots grid */}
        <div className="bg-green-950/40 rounded-lg p-2 mb-2 border border-green-800 flex-1">
          <p className="text-green-300 text-[10px] mb-1 font-bold">
            一のまる
            {selectedCount > 0 && (
              <span className="text-yellow-300 ml-1">えらんだ: {selectedCount}こ</span>
            )}
          </p>
          <div
            ref={gridRef}
            className="relative touch-none select-none"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
              gridAutoRows: `${CELL}px`,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {visible.map((dot) => (
              <div key={dot.id} data-did={dot.id} className="flex items-center justify-center">
                <div
                  className={`rounded-full border-2 transition-all duration-150
                    ${dot.selected
                      ? "bg-yellow-400 border-yellow-200 shadow-lg shadow-yellow-400/40 scale-110"
                      : "bg-green-500 border-green-300"
                    }
                    ${dot.hiding ? "opacity-0 scale-0 transition-all duration-500" : ""}`}
                  style={{ width: DOT_SIZE, height: DOT_SIZE }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* action buttons — sticky bottom */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent pt-3 pb-2">
          {!cleared ? (
            <div className="flex items-center justify-center gap-2">
              <button onClick={clearSelection} className="text-gray-400 text-xs underline px-2">
                クリア
              </button>
              <button
                onClick={handleBundleDots}
                disabled={isAnimating || selectedCount === 0}
                className="mc-btn text-sm px-4 py-2 disabled:opacity-40 disabled:transform-none"
              >
                まとめる！（{selectedCount}こ）
              </button>
              {unbundledBars.length >= 10 && (
                <button
                  onClick={handleBundleBars}
                  disabled={isAnimating || selectedBarCount === 0}
                  className="mc-btn mc-btn-red text-sm px-3 py-2 disabled:opacity-40"
                >
                  たばも まとめる！
                </button>
              )}
              <button onClick={handleCheck} className="mc-btn mc-btn-blue text-sm px-4 py-2">
                こたえあわせ ✓
              </button>
            </div>
          ) : (
            <div className="text-center animate-slide-up">
              <button onClick={nextProblem} className="mc-btn text-lg px-8 py-3">
                つぎのもんだい →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* morph animation overlay */}
      {morphDots.length > 0 && morphTarget && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
          {morphDots.map((pos, i) => {
            const tx = morphTarget.x + (i % 5) * 14;
            const ty = morphTarget.y + Math.floor(i / 5) * 14;
            const flying = morphPhase === "fly";
            return (
              <div
                key={i}
                className="absolute rounded-full bg-green-500 border-2 border-green-300"
                style={{
                  width: flying ? 10 : DOT_SIZE,
                  height: flying ? 10 : DOT_SIZE,
                  left: flying ? tx : pos.x,
                  top: flying ? ty : pos.y,
                  transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            );
          })}
        </div>
      )}

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
