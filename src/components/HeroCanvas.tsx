import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface HeroCanvasHandle {
  drawFrame: (index: number) => void;
  getCanvas: () => HTMLCanvasElement | null;
  readonly frameCount: number;
}

interface Props {
  onProgress?: (pct: number) => void;
  onLoaded?: (frameCount: number) => void;
}

const pad = (n: number) => String(n).padStart(3, '0');

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const img = new Image();
    img.src = src;
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`Failed to load: ${src}`));
  });

export const HeroCanvas = forwardRef<HeroCanvasHandle, Props>(
  ({ onProgress, onLoaded }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const framesRef = useRef<HTMLImageElement[]>([]);
    const frameCountRef = useRef(0);
    const lastFrameTimeRef = useRef(0);

    useImperativeHandle(ref, () => ({
      drawFrame(index: number) {
        const now = Date.now();
        if (now - lastFrameTimeRef.current < 33) return; // ~30fps throttle
        lastFrameTimeRef.current = now;

        const canvas = canvasRef.current;
        const img = framesRef.current[index];
        if (!canvas || !img) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const w = canvas.offsetWidth || window.innerWidth;
        const h = canvas.offsetHeight || window.innerHeight;

        canvas.width = w;
        canvas.height = h;

        const scale = Math.max(w / img.width, h / img.height);
        const x = (w - img.width * scale) / 2;
        const y = (h - img.height * scale) / 2;

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      },

      getCanvas() {
        return canvasRef.current;
      },

      get frameCount() {
        return frameCountRef.current;
      },
    }));

    useEffect(() => {
      let cancelled = false;

      (async () => {
        let count = 0;
        while (count < 300) {
          try {
            await loadImage(`/Frames/ezgif-frame-${pad(count + 1)}.png`);
            count++;
          } catch {
            break;
          }
        }
        if (cancelled || count === 0) return;

        frameCountRef.current = count;

        const srcs = Array.from(
          { length: count },
          (_, i) => `/Frames/ezgif-frame-${pad(i + 1)}.png`
        );

        let done = 0;
        const imgs = await Promise.all(
          srcs.map((src) =>
            loadImage(src).then((img) => {
              if (!cancelled) {
                done++;
                onProgress?.(Math.round((done / count) * 100));
              }
              return img;
            })
          )
        );

        if (cancelled) return;

        framesRef.current = imgs;
        onLoaded?.(count);
      })();

      return () => {
        cancelled = true;
      };
    }, [onProgress, onLoaded]);

    return (
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full block origin-center will-change-[transform,opacity]"
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    );
  }
);

HeroCanvas.displayName = 'HeroCanvas';





// import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// export interface HeroCanvasHandle {
//   drawFrame : (index: number) => void;
//   getCanvas : () => HTMLCanvasElement | null;
//   frameCount: number;
// }

// interface Props {
//   onProgress?: (pct: number) => void;
//   onLoaded?  : (frameCount: number) => void;
// }

// const pad = (n: number) => String(n).padStart(3, '0');

// const loadImage = (src: string): Promise<HTMLImageElement> =>
//   new Promise((res, rej) => {
//     const img = new Image();
//     img.src = src;
//     img.onload  = () => res(img);
//     img.onerror = () => rej(new Error(`Failed: ${src}`));
//   });

// export const HeroCanvas = forwardRef<HeroCanvasHandle, Props>(
//   ({ onProgress, onLoaded }, ref) => {
//     const canvasRef    = useRef<HTMLCanvasElement>(null);
//     const framesRef    = useRef<HTMLImageElement[]>([]);
//     const frameCountRef = useRef(0);

//     // expose handle — reads live refs so drawFrame always has latest frames
//     useImperativeHandle(ref, () => ({
//       drawFrame(index: number) {
//         const canvas = canvasRef.current;
//         const img    = framesRef.current[index];
//         if (!canvas || !img) return;
//         const ctx = canvas.getContext('2d');
//         if (!ctx) return;

//         const w = canvas.offsetWidth  || window.innerWidth;
//         const h = canvas.offsetHeight || window.innerHeight;

//         if (canvas.width  !== w) canvas.width  = w;
//         if (canvas.height !== h) canvas.height = h;

//         const scale = Math.max(w / img.width, h / img.height);
//         const x     = (w - img.width  * scale) / 2;
//         const y     = (h - img.height * scale) / 2;

//         ctx.clearRect(0, 0, w, h);
//         ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
//       },
//       getCanvas() {
//         return canvasRef.current;
//       },
//       get frameCount() {
//         return frameCountRef.current;
//       },
//     }));

//     // ── frame loading ──────────────────────────────────────────────────────
//     useEffect(() => {
//       let cancelled = false;

//       (async () => {
//         // 1. detect how many frames exist
//         let count = 0;
//         while (count < 300) {
//           try {
//             await loadImage(`/Frames/ezgif-frame-${pad(count + 1)}.png`);
//             count++;
//           } catch { break; }
//         }
//         if (cancelled || count === 0) return;

//         frameCountRef.current = count;

//         // 2. preload all frames in parallel, reporting progress
//         const srcs = Array.from(
//           { length: count },
//           (_, i) => `/Frames/ezgif-frame-${pad(i + 1)}.png`
//         );

//         let done = 0;
//         const imgs = await Promise.all(
//           srcs.map(src =>
//             loadImage(src).then(img => {
//               if (!cancelled) {
//                 done++;
//                 onProgress?.(Math.round((done / count) * 100));
//               }
//               return img;
//             })
//           )
//         );

//         if (cancelled) return;

//         framesRef.current = imgs;
//         onLoaded?.(count);
//       })();

//       return () => { cancelled = true; };
//     }, []); // eslint-disable-line react-hooks/exhaustive-deps

//     return (
//       <canvas
//         ref={canvasRef}
//         style={{ width: '100vw', height: '100vh' }}
//         className="absolute top-0 left-0 z-0 block origin-center will-change-[transform,opacity]"
//       />
//     );
//   }
// );

// HeroCanvas.displayName = 'HeroCanvas';