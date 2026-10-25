"use client";

import { useEffect, useState } from "react";

export const LAND_QUERY = "(orientation: landscape) and (min-width: 900px) and (min-height: 560px)";

/** Design-px → rem, so sizes follow the root font size (larger on iPad). */
export const rem = (px: number) => `${px / 16}rem`;

/**
 * Current UI scale (root font size / 16). Use it where real pixels are needed,
 * e.g. pointer hit-testing or drag maths.
 */
export function useUiScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const read = () => setScale(parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return scale;
}

/** True on iPad landscape (matches the Tailwind `land:` screen). */
export function useIsLandscape() {
  const [land, setLand] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(LAND_QUERY);
    const read = () => setLand(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return land;
}
