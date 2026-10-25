"use client";

import { useEffect, useState } from "react";

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
