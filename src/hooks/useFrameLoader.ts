import { useEffect, useRef, useState } from 'react';

const pad = (n: number) => String(n).padStart(3, '0');

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const img = new Image();
    img.src = src;
    img.onload  = () => res(img);
    img.onerror = () => rej(new Error(`Failed: ${src}`));
  });

/**
 * Detects frame count using binary search (O(log N) requests instead of O(N)),
 * then preloads all frames in parallel.
 */
export const useFrameLoader = (maxFrames = 300) => {
  const framesRef  = useRef<HTMLImageElement[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [loaded, setLoaded]         = useState(false);
  const [loadPct, setLoadPct]       = useState(0);

  // ── Step 1: binary-search frame count ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      // Quick probe: try frame 1 first. If it fails, nothing to load.
      try {
        await loadImage(`/Frames/ezgif-frame-${pad(1)}.png`);
      } catch {
        if (!cancelled) setFrameCount(0);
        return;
      }

      // Binary search between 1..maxFrames
      let lo = 1, hi = maxFrames;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        try {
          await loadImage(`/Frames/ezgif-frame-${pad(mid)}.png`);
          lo = mid;
        } catch {
          hi = mid - 1;
        }
      }
      if (!cancelled) setFrameCount(lo);
    };

    detect();
    return () => { cancelled = true; };
  }, [maxFrames]);

  // ── Step 2: parallel preload ────────────────────────────────────────────
  useEffect(() => {
    if (!frameCount) return;
    let cancelled = false;

    const srcs = Array.from(
      { length: frameCount },
      (_, i) => `/Frames/ezgif-frame-${pad(i + 1)}.png`
    );

    let done = 0;

    Promise.all(
      srcs.map(src =>
        loadImage(src).then(img => {
          if (cancelled) return img;
          done++;
          setLoadPct(Math.round((done / frameCount) * 100));
          return img;
        })
      )
    ).then(imgs => {
      if (cancelled) return;
      framesRef.current = imgs;
      setLoaded(true);
    });

    return () => { cancelled = true; };
  }, [frameCount]);

  return { framesRef, frameCount, loaded, loadPct };
};