"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAllItems, getCollectedItems, resetCollection, MinecraftItem } from "@/lib/rewards";
import PixelItem from "./PixelItem";
import Link from "next/link";

/* ─── Mirrored PixelItem for back face ─── */
function PixelItemMirrored({ item, size }: { item: MinecraftItem; size: number }) {
  const cellSize = size / 8;
  return (
    <div className="inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {item.pixels.map((row, y) =>
          row.map((color, x) =>
            color ? (
              <rect
                key={`${x}-${y}`}
                x={(7 - x) * cellSize}
                y={y * cellSize}
                width={cellSize + 0.5}
                height={cellSize + 0.5}
                fill={color}
                opacity={0.7}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}

/* ─── 3D Interactive Item Viewer ─── */
const ITEM_SIZE = 280;

function ItemViewer({ item, onClose }: { item: MinecraftItem; onClose: () => void }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [scale, setScale] = useState(1);
  const [pinchScale, setPinchScale] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentRX = useRef(0);
  const currentRY = useRef(0);
  const velocityX = useRef(0);
  const velocityY = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const spinTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pinch tracking
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const isPinching = useRef(false);

  // Cleanup
  useEffect(() => {
    return () => {
      if (spinTimer.current) cancelAnimationFrame(spinTimer.current as unknown as number);
    };
  }, []);

  const getPointerDist = useCallback(() => {
    const pts = Array.from(pointers.current.values());
    if (pts.length < 2) return 0;
    const dx = pts[1].x - pts[0].x;
    const dy = pts[1].y - pts[0].y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      // Start pinch
      isPinching.current = true;
      dragging.current = false;
      pinchStartDist.current = getPointerDist();
      pinchStartScale.current = pinchScale;
      return;
    }

    if (pointers.current.size === 1) {
      dragging.current = true;
      startX.current = e.clientX;
      startY.current = e.clientY;
      currentRX.current = rotateX;
      currentRY.current = rotateY;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      lastTime.current = Date.now();
      velocityX.current = 0;
      velocityY.current = 0;
      setIsAnimating(false);
      if (spinTimer.current) {
        cancelAnimationFrame(spinTimer.current as unknown as number);
        spinTimer.current = null;
      }
    }
  }, [rotateX, rotateY, pinchScale, getPointerDist]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Pinch zoom
    if (isPinching.current && pointers.current.size >= 2) {
      const dist = getPointerDist();
      if (pinchStartDist.current > 0) {
        const ratio = dist / pinchStartDist.current;
        setPinchScale(Math.max(0.5, Math.min(4, pinchStartScale.current * ratio)));
      }
      return;
    }

    // Single pointer drag → rotation
    if (!dragging.current) return;
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocityX.current = (e.clientX - lastX.current) / dt;
      velocityY.current = (e.clientY - lastY.current) / dt;
    }
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    lastTime.current = now;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    const newRY = currentRY.current + dx * 0.5;
    const newRX = currentRX.current - dy * 0.5;

    // No clamp: free rotation in any direction
    setRotateX(newRX);
    setRotateY(newRY);

    // Subtle squish based on angular distance from flat
    const normRX = ((newRX % 360) + 360) % 360;
    const normRY = ((newRY % 360) + 360) % 360;
    const distFromFlat = Math.min(normRX, 360 - normRX) + Math.min(normRY, 360 - normRY);
    setScale(1 - Math.min(distFromFlat * 0.0005, 0.08));
  }, [getPointerDist]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);

    if (isPinching.current) {
      if (pointers.current.size < 2) {
        isPinching.current = false;
      }
      return;
    }

    if (!dragging.current) return;
    dragging.current = false;

    const vx = velocityX.current;
    const vy = velocityY.current;
    const speed = Math.sqrt(vx * vx + vy * vy);

    if (speed > 0.2) {
      // Flick → free spin with strong inertia, no rotation clamp
      let rx = rotateX;
      let ry = rotateY;
      // Big velocity multiplier for that "シャーッ" feel
      let mvx = vx * 400;
      let mvy = -vy * 400;

      const tick = () => {
        // Gentle friction: spins a long time
        mvx *= 0.975;
        mvy *= 0.975;
        ry += mvx * 0.016;
        rx += mvy * 0.016;
        setRotateX(rx);
        setRotateY(ry);
        setScale(1);

        if (Math.abs(mvx) > 0.3 || Math.abs(mvy) > 0.3) {
          spinTimer.current = requestAnimationFrame(tick) as unknown as ReturnType<typeof setInterval>;
        } else {
          spinTimer.current = null;
          // Smoothly settle to nearest "nice" angle (0 or 180)
          const snapRY = Math.round(ry / 180) * 180;
          const snapRX = Math.round(rx / 180) * 180;
          setIsAnimating(true);
          setRotateX(snapRX);
          setRotateY(snapRY);
          setScale(1);
        }
      };
      spinTimer.current = requestAnimationFrame(tick) as unknown as ReturnType<typeof setInterval>;
    } else {
      // Light release: spring back to nearest face
      const snapRY = Math.round(rotateY / 180) * 180;
      const snapRX = Math.round(rotateX / 180) * 180;
      setIsAnimating(true);
      setRotateX(snapRX);
      setRotateY(snapRY);
      setScale(1);
    }
  }, [rotateX, rotateY]);

  const rarityConfig = {
    common: { label: "コモン", color: "text-gray-500", border: "border-gray-300", bg: "bg-gray-50", backBg: "#F9FAFB" },
    uncommon: { label: "アンコモン", color: "text-green-600", border: "border-green-300", bg: "bg-green-50", backBg: "#F0FDF4" },
    rare: { label: "レア", color: "text-blue-600", border: "border-blue-300", bg: "bg-blue-50", backBg: "#EFF6FF" },
    epic: { label: "エピック", color: "text-purple-600", border: "border-purple-300", bg: "bg-purple-50", backBg: "#FAF5FF" },
  };
  const rc = rarityConfig[item.rarity];

  const renderSize = Math.round(ITEM_SIZE * pinchScale);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 3D card with front + back */}
        <div
          className="touch-none select-none"
          style={{ perspective: "1000px" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            style={{
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
              transition: isAnimating ? "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
              transformStyle: "preserve-3d",
              position: "relative",
              width: renderSize + 48,
              height: renderSize + 48,
            }}
          >
            {/* Front face */}
            <div
              className={`absolute inset-0 rounded-2xl border-4 ${rc.border} ${rc.bg} shadow-2xl flex items-center justify-center`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <PixelItem item={item} size={renderSize} />
            </div>

            {/* Back face */}
            <div
              className={`absolute inset-0 rounded-2xl border-4 ${rc.border} shadow-2xl flex flex-col items-center justify-center gap-2`}
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                backgroundColor: rc.backBg,
              }}
            >
              <PixelItemMirrored item={item} size={Math.round(renderSize * 0.7)} />
              <p className={`text-sm font-bold ${rc.color}`}>{item.nameJa}</p>
              <p className="text-xs text-gray-400">{item.name}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 text-center">
          <p className="text-white text-2xl font-bold drop-shadow-lg">{item.nameJa}</p>
          <p className="text-gray-300 text-sm">{item.name}</p>
          <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold ${rc.bg} ${rc.color} border ${rc.border}`}>
            {rc.label}
          </span>
        </div>

        {/* Hint */}
        <p className="text-gray-400 text-xs mt-3 animate-pulse">
          スワイプで まわす ・ ピンチで おおきく！
        </p>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-3 px-6 py-2 rounded-xl bg-white/90 text-gray-700 font-bold text-sm active:scale-95 shadow-md"
        >
          とじる
        </button>
      </div>
    </div>
  );
}

/* ─── Collection Page ─── */
export default function Collection() {
  const [collected, setCollected] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MinecraftItem | null>(null);
  const allItems = getAllItems();

  useEffect(() => {
    setCollected(getCollectedItems());
  }, []);

  const handleReset = () => {
    resetCollection();
    setCollected([]);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4 pb-24">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-green-700 text-sm mb-4 inline-block hover:underline">
          ← もどる
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          アイテムコレクション
        </h1>
        <p className="text-center text-gray-500 mb-4">
          {collected.length} / {allItems.length} あつめた！
        </p>
        <div className="bg-white/80 rounded-xl p-2 shadow-sm border border-gray-200">
          <div className="grid grid-cols-4 gap-2">
            {allItems.map((item) => {
              const isCollected = collected.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => isCollected && setSelectedItem(item)}
                  disabled={!isCollected}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-all active:scale-90 ${
                    isCollected
                      ? "bg-amber-50 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                      : "bg-gray-100 border border-gray-200 cursor-default"
                  }`}
                >
                  {isCollected ? (
                    <>
                      <PixelItem item={item} size={48} />
                      <span className="text-[10px] text-gray-600 mt-1 text-center leading-tight">
                        {item.nameJa}
                      </span>
                    </>
                  ) : (
                    <div className="text-3xl text-gray-300">？</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <div className="mt-6 text-center">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-gray-400 text-xs underline hover:text-gray-600"
            >
              コレクションをリセット
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm font-bold mb-3">
                ほんとうに ぜんぶ けしていい？
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-bold active:scale-95"
                >
                  やめる
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold active:scale-95"
                >
                  リセットする
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Item Viewer Modal */}
      {selectedItem && (
        <ItemViewer item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
