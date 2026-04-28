import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NavBar from '../components/navBar';
import info from '../data/info.json';

gsap.registerPlugin(ScrollTrigger);

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SCROLL_MULTIPLIER = 5; // total scroll = 5x viewport height
const frameSrc = (i: number) =>
  `/Frames/ezgif-frame-${String(i).padStart(3, '0')}.png`;

// ─── HELPER ───────────────────────────────────────────────────────────────────
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const img   = new Image();
    img.src     = src;
    img.onload  = () => res(img);
    img.onerror = () => rej();
  });

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const Hero: React.FC = () => {
  // Refs
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const stickyRef     = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const nameRef       = useRef<HTMLHeadingElement>(null);
  const roleRef       = useRef<HTMLParagraphElement>(null);
  const aboutRef      = useRef<HTMLParagraphElement>(null);
  const socialsRef    = useRef<HTMLDivElement>(null);
  const hintRef       = useRef<HTMLDivElement>(null);
  const framesRef     = useRef<HTMLImageElement[]>([]);
  const currentIdx    = useRef(0);
  const lastDraw      = useRef(0);
  const frameCountRef = useRef(0);

  // State
  const [loaded,     setLoaded]     = useState(false);
  const [loadPct,    setLoadPct]    = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  // ── DRAW: pixel-perfect cover fill ────────────────────────────────────────
  const draw = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img    = framesRef.current[index];
    if (!canvas || !img?.complete) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Match canvas buffer to its CSS size
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width  = W;
      canvas.height = H;
    }

    // object-fit: cover math
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const sw = img.naturalWidth  * scale;
    const sh = img.naturalHeight * scale;
    const sx = (W - sw) / 2;
    const sy = (H - sh) / 2;

    ctx.drawImage(img, sx, sy, sw, sh);
  }, []);

  // ── DRAW THROTTLED @ 30fps ────────────────────────────────────────────────
  const drawAt = useCallback((index: number) => {
    const now   = performance.now();
    const clamped = Math.max(0, Math.min(index, frameCountRef.current - 1));
    if (
      clamped === currentIdx.current &&
      now - lastDraw.current < 33
    ) return;
    currentIdx.current = clamped;
    lastDraw.current   = now;
    draw(clamped);
  }, [draw]);

  // ── AUTO-DETECT + PRELOAD FRAMES ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Detect count
      let count = 0;
      while (count < 400) {
        try   { await loadImage(frameSrc(count + 1)); count++; }
        catch { break; }
      }
      if (cancelled || count === 0) return;

      frameCountRef.current = count;
      setFrameCount(count);

      // 2. Parallel preload
      let done = 0;
      const imgs = await Promise.all(
        Array.from({ length: count }, (_, i) =>
          loadImage(frameSrc(i + 1)).then(img => {
            if (!cancelled) {
              done++;
              setLoadPct(Math.round((done / count) * 100));
            }
            return img;
          })
        )
      );
      if (cancelled) return;
      framesRef.current = imgs;
      setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, []);

  // ── RESIZE ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      draw(currentIdx.current);
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  // ── GSAP ScrollTrigger ────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || frameCount === 0) return;

    ScrollTrigger.getAll().forEach(t => t.kill());

    // Draw first frame
    draw(0);

    const wrapper    = wrapperRef.current!;
    const endOffset  = window.innerHeight * SCROLL_MULTIPLIER;
    const endStr     = `+=${endOffset}`;

    // ── Pin sticky div ──────────────────────────────────────────────────────
    ScrollTrigger.create({
      trigger      : wrapper,
      start        : 'top top',
      end          : endStr,
      pin          : stickyRef.current,
      pinSpacing   : false, // wrapper provides the scroll height
      anticipatePin: 1,
    });

    // ── Frame scrub ─────────────────────────────────────────────────────────
    const proxy = { f: 0 };
    gsap.to(proxy, {
      f   : frameCount - 1,
      ease: 'none',
      scrollTrigger: {
        trigger  : wrapper,
        start    : 'top top',
        end      : endStr,
        scrub    : 0.5,
        onUpdate : self => {
          drawAt(Math.round(self.progress * (frameCount - 1)));
        },
      },
    });

    // ── Text block fade-out ─────────────────────────────────────────────────
    gsap.to(
      [nameRef.current, roleRef.current, aboutRef.current, socialsRef.current],
      {
        opacity: 0,
        y      : -80,
        scale  : 0.8,
        filter : 'blur(10px)',
        stagger: 0.07,
        ease   : 'power2.in',
        scrollTrigger: {
          trigger  : wrapper,
          start    : 'top top',
          end      : `+=${endOffset * 0.35}`,
          scrub    : 1.2,
        },
      }
    );

    // ── Scroll hint fade ────────────────────────────────────────────────────
    gsap.to(hintRef.current, {
      opacity: 0,
      scrollTrigger: {
        trigger: wrapper,
        start  : 'top top',
        end    : `+=${endOffset * 0.12}`,
        scrub  : 0.6,
      },
    });

    // ── Canvas slow zoom ────────────────────────────────────────────────────
    gsap.fromTo(
      canvasRef.current,
      { scale: 1 },
      {
        scale: 1.1,
        ease : 'none',
        scrollTrigger: {
          trigger: wrapper,
          start  : 'top top',
          end    : `+=${endOffset * 0.7}`,
          scrub  : 1.5,
        },
      }
    );

    // ── Canvas fade at end ──────────────────────────────────────────────────
    gsap.to(canvasRef.current, {
      opacity: 0,
      ease   : 'power2.in',
      scrollTrigger: {
        trigger: wrapper,
        start  : `top+=${endOffset * 0.85}`,
        end    : `top+=${endOffset}`,
        scrub  : 1,
      },
    });

    ScrollTrigger.refresh();

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, [loaded, frameCount, draw, drawAt]);

  // ── ENTRANCE ANIMATION ────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    gsap.timeline({ delay: 0.3 })
      .from(nameRef.current,    { opacity: 0, y: 50, duration: 1.2, ease: 'power3.out' })
      .from(roleRef.current,    { opacity: 0, y: 30, duration: 1.0, ease: 'power3.out' }, '-=0.8')
      .from(aboutRef.current,   { opacity: 0, y: 30, duration: 1.0, ease: 'power3.out' }, '-=0.65')
      .from(socialsRef.current, { opacity: 0, y: 20, duration: 0.9, ease: 'power3.out' }, '-=0.55')
      .from(hintRef.current,    { opacity: 0,        duration: 0.8                     }, '-=0.4');
  }, [loaded]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Loading overlay ── */}
      
      {/* {!loaded && (
        <div
          style={{
            position      : 'fixed',
            inset         : 0,
            zIndex        : 9999,
            background    : '#050505',
            display       : 'flex',
            flexDirection : 'column',
            alignItems    : 'center',
            justifyContent: 'center',
            gap           : '20px',
          }}
        >
          <div style={{ width: 220, height: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${loadPct}%`, background: '#e81f4a', transition: 'width 0.1s' }} />
          </div>
          <p style={{ color: '#e81f4a', fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.3em' }}>
            {loadPct}% — LOADING
          </p>
        </div>
      )} */}

      <NavBar />

      {/*
        ── WRAPPER ────────────────────────────────────────────────────────────
        This gives the page real scroll height.
        MUST be position:relative so ScrollTrigger can measure it.
        MUST NOT be overflow:hidden.
      */}
      <div
        ref={wrapperRef}
        style={{
          position: 'relative',
          width   : '100%',
          // scroll distance = SCROLL_MULTIPLIER × 100vh
          // +1 for the initial 100vh visible area
          height  : `${(SCROLL_MULTIPLIER + 1) * 100}vh`,
          background: '#050505',
        }}
      >
        {/*
          ── STICKY ────────────────────────────────────────────────────────
          Sticks to top while wrapper scrolls.
          MUST be: position:sticky, top:0, exact 100vh height.
          MUST have overflow:hidden to clip canvas zoom.
        */}
        <div
          ref={stickyRef}
          style={{
            position: 'sticky',
            top     : 0,
            left    : 0,
            width   : '100%',
            height  : '100vh',
            overflow: 'hidden',
          }}
        >
          {/*
            ── CANVAS ──────────────────────────────────────────────────────
            MUST be position:absolute, inset:0.
            Width/height 100% of sticky parent = 100vw × 100vh.
          */}
          <canvas
            ref={canvasRef}
            style={{
              position      : 'absolute',
              top           : 0,
              left          : 0,
              width         : '100%',
              height        : '100%',
              display       : 'block',
              transformOrigin: 'center center',
              willChange    : 'transform, opacity',
            }}
          />

          {/* ── Vignette ── */}
          <div
            style={{
              position      : 'absolute',
              inset         : 0,
              zIndex        : 2,
              pointerEvents : 'none',
              background    : `
                radial-gradient(ellipse 90% 55% at 50% 100%, rgba(5,5,5,0.97) 0%, transparent 68%),
                radial-gradient(ellipse 100% 35% at 50% 0%,  rgba(5,5,5,0.65) 0%, transparent 55%),
                linear-gradient(to right, rgba(5,5,5,0.5) 0%, transparent 22%, transparent 78%, rgba(5,5,5,0.5) 100%)
              `,
            }}
          />

          {/* ── Text Overlay ── */}
          <div
            style={{
              position : 'absolute',
              zIndex   : 10,
              bottom   : '12vh',
              left     : '6vw',
              maxWidth : 600,
            }}
          >
            <h1
              ref={nameRef}
              style={{
                fontFamily   : "'Syne', sans-serif",
                fontWeight   : 800,
                fontSize     : 'clamp(2.8rem, 6vw, 5.5rem)',
                lineHeight   : 1,
                letterSpacing: '-0.03em',
                color        : '#fff',
                margin       : 0,
              }}
            >
              {info.name.split(' ').map((word, i) => (
                <span key={i} style={{ color: i === 0 ? '#e81f4a' : '#fff' }}>
                  {word}{i < info.name.split(' ').length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>

            <p
              ref={roleRef}
              style={{
                fontFamily   : "'DM Mono', monospace",
                fontSize     : 'clamp(0.78rem, 1.1vw, 1rem)',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color        : '#e81f4a',
                margin       : '0.8em 0 1.3em',
              }}
            >
              {info.role}
            </p>

            <p
              ref={aboutRef}
              style={{
                fontSize  : 'clamp(0.88rem, 1.05vw, 1rem)',
                lineHeight: 1.75,
                color     : 'rgba(255,255,255,0.6)',
                maxWidth  : 440,
              }}
            >
              {info.about}
            </p>
          </div>

          {/* ── Scroll Hint ── */}
          <div
            ref={hintRef}
            style={{
              position     : 'absolute',
              bottom       : '10vh',
              right        : '5vw',
              zIndex       : 10,
              display      : 'flex',
              flexDirection: 'column',
              alignItems   : 'center',
              gap          : 8,
              fontFamily   : "'DM Mono', monospace",
              fontSize     : 'clamp(0.6rem, 0.8vw, 0.72rem)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color        : 'rgba(255,255,255,0.35)',
            }}
          >
            <span>Scroll</span>
            <div
              style={{
                width     : 1,
                height    : 52,
                background: 'linear-gradient(to bottom, transparent, #e81f4a)',
                animation : 'pulse 1.8s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};