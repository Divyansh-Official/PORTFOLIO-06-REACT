import React, { useEffect, useRef, useState } from 'react';
import NavBar from '../components/navBar';
import { Logo } from '../components/logo';
import info from '../data/info.json';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── helpers ────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(3, '0');

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const img = new Image();
    img.src = src;
    img.onload  = () => res(img);
    img.onerror = () => rej(new Error(`Failed: ${src}`));
  });

// ─── component ──────────────────────────────────────────────────────────────

export const Hero: React.FC = () => {
  const sectionRef    = useRef<HTMLElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const nameRef       = useRef<HTMLHeadingElement>(null);
  const roleRef       = useRef<HTMLParagraphElement>(null);
  const aboutRef      = useRef<HTMLParagraphElement>(null);
  const socialsRef    = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  const framesRef  = useRef<HTMLImageElement[]>([]);
  const currentIdx = useRef(0);

  const [frameCount, setFrameCount] = useState(0);
  const [loaded, setLoaded]         = useState(false);
  const [loadPct, setLoadPct]       = useState(0);

  // ── auto-detect frame count ──────────────────────────────────────────────
  useEffect(() => {
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
      setFrameCount(count || 1);
    })();
  }, []);

  // ── preload all frames ───────────────────────────────────────────────────
  useEffect(() => {
    if (!frameCount) return;
    const srcs = Array.from(
      { length: frameCount },
      (_, i) => `/Frames/ezgif-frame-${pad(i + 1)}.png`
    );
    let done = 0;
    Promise.all(
      srcs.map(src =>
        loadImage(src).then(img => {
          done++;
          setLoadPct(Math.round((done / frameCount) * 100));
          return img;
        })
      )
    ).then(imgs => {
      framesRef.current = imgs;
      setLoaded(true);
    });
  }, [frameCount]);

  // ── draw helper — COVER fill (Math.max = no black bars) ─────────────────
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img    = framesRef.current[index];
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // sync pixel buffer to CSS size
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // COVER: Math.max fills whole canvas — no letterbox bars
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width  - img.width  * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  };

  // ── GSAP setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || !frameCount) return;

    drawFrame(0);
    ScrollTrigger.getAll().forEach(t => t.kill());

    const section  = sectionRef.current!;
    const STORY_PX = window.innerHeight * 4;

    // Pin the section; pinSpacing:true adds real scroll height below
    ScrollTrigger.create({
      trigger   : section,
      start     : 'top top',
      end       : `+=${STORY_PX}`,
      pin       : true,
      pinSpacing: true,
      anticipatePin: 1,
    });

    // Frame scrub
    const obj = { f: 0 };
    gsap.to(obj, {
      f: frameCount - 1,
      ease: 'none',
      scrollTrigger: {
        trigger : section,
        start   : 'top top',
        end     : `+=${STORY_PX}`,
        scrub   : 0.5,
        onUpdate: () => {
          const idx = Math.round(obj.f);
          if (idx !== currentIdx.current) {
            currentIdx.current = idx;
            drawFrame(idx);
          }
        },
      },
    });

    // Text: fade + scale + blur out on scroll down → reverses on scroll up
    const textEls = [nameRef.current, roleRef.current, aboutRef.current, socialsRef.current];
    gsap.fromTo(
      textEls,
      { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' },
      {
        opacity: 0,
        scale  : 0.78,
        y      : -55,
        filter : 'blur(8px)',
        ease   : 'power2.in',
        stagger: 0.06,
        scrollTrigger: {
          trigger : section,
          start   : 'top top',
          end     : `+=${STORY_PX * 0.28}`,
          scrub   : 1,
        },
      }
    );

    // Scroll hint out
    gsap.fromTo(
      scrollHintRef.current,
      { opacity: 1 },
      {
        opacity: 0,
        scrollTrigger: {
          trigger : section,
          start   : 'top top',
          end     : `+=${STORY_PX * 0.12}`,
          scrub   : 0.8,
        },
      }
    );

    // Canvas: slow zoom
    gsap.fromTo(
      canvasRef.current,
      { scale: 1 },
      {
        scale: 1.07,
        ease: 'none',
        scrollTrigger: {
          trigger : section,
          start   : 'top top',
          end     : `+=${STORY_PX * 0.6}`,
          scrub   : 1.2,
        },
      }
    );

    // Canvas: fade out at the end
    gsap.to(canvasRef.current, {
      opacity: 0,
      ease: 'power2.in',
      scrollTrigger: {
        trigger : section,
        start   : `+=${STORY_PX * 0.83}`,
        end     : `+=${STORY_PX}`,
        scrub   : 1,
      },
    });

    ScrollTrigger.refresh();

    const onResize = () => { drawFrame(currentIdx.current); ScrollTrigger.refresh(); };
    window.addEventListener('resize', onResize);
    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      window.removeEventListener('resize', onResize);
    };
  }, [loaded, frameCount]);

  // ── entrance animation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    gsap.timeline({ delay: 0.25 })
      .from(nameRef.current,       { opacity: 0, y: 38, duration: 1,   ease: 'power3.out' })
      .from(roleRef.current,       { opacity: 0, y: 22, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .from(aboutRef.current,      { opacity: 0, y: 22, duration: 0.8, ease: 'power3.out' }, '-=0.55')
      .from(socialsRef.current,    { opacity: 0, y: 22, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .from(scrollHintRef.current, { opacity: 0,        duration: 0.5                     }, '-=0.3');
  }, [loaded]);

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* ─ hero section ─────────────────────────────────────────────────── */
        .hero-section {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;          /* clip the canvas zoom — pin spacer is a sibling, not a child */
          background: var(--bg);
        }

        /* ─ canvas: covers the full section ─────────────────────────────── */
        .hero-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transform-origin: center center;
          will-change: transform, opacity;
        }

        /* ─ vignette ─────────────────────────────────────────────────────── */
        .hero-vignette {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(ellipse 90% 55% at 50% 100%, rgba(6,6,8,0.93) 0%, transparent 70%),
            radial-gradient(ellipse 100% 38% at 50% 0%,  rgba(6,6,8,0.65) 0%, transparent 60%),
            linear-gradient(to right,
              rgba(6,6,8,0.55) 0%, transparent 28%,
              transparent 72%, rgba(6,6,8,0.55) 100%);
        }

        /* ─ text overlay ─────────────────────────────────────────────────── */
        .hero-overlay {
          position: absolute;
          z-index: 10;
          bottom: 10vh;
          left: 6vw;
          max-width: 560px;
        }

        .hero-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2.6rem, 5vw, 4.8rem);
          line-height: 1.02;
          letter-spacing: -0.025em;
          color: #fff;
          margin-bottom: 0.4em;
        }

        .hero-name .acc { color: var(--accent); }

        .hero-role {
          font-family: 'DM Mono', monospace;
          font-weight: 300;
          font-size: clamp(0.76rem, 1.15vw, 0.96rem);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 1.15em;
        }

        .hero-about {
          font-family: 'Syne', sans-serif;
          font-weight: 400;
          font-size: clamp(0.84rem, 1.1vw, 0.97rem);
          line-height: 1.78;
          color: var(--dim);
          max-width: 400px;
          margin-bottom: 2em;
        }

        /* ─ socials ──────────────────────────────────────────────────────── */
        .hero-socials { display: flex; gap: 12px; flex-wrap: wrap; }

        .social-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px 8px 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 100px;
          text-decoration: none;
          color: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 0.77rem;
          letter-spacing: 0.06em;
          backdrop-filter: blur(14px);
          transition: background 0.22s, border-color 0.22s, transform 0.18s;
        }

        .social-pill:hover {
          background: rgba(232,255,71,0.13);
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .social-pill img {
          width: 15px; height: 15px;
          filter: invert(1) brightness(1.5);
          object-fit: contain;
        }

        /* ─ scroll hint ──────────────────────────────────────────────────── */
        .scroll-hint {
          position: absolute;
          z-index: 10;
          bottom: 10vh;
          right: 5vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 0.67rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--dim);
        }

        .scroll-line {
          width: 1px;
          height: 52px;
          background: linear-gradient(to bottom, transparent, var(--accent));
          animation: lineAnim 1.9s ease-in-out infinite;
        }

        @keyframes lineAnim {
          0%   { transform: scaleY(0); transform-origin: top; }
          50%  { transform: scaleY(1); transform-origin: top; }
          51%  { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }

        /* ─ loading overlay ──────────────────────────────────────────────── */
        .loading-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: var(--bg);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 24px;
          font-family: 'DM Mono', monospace;
          color: var(--dim);
          font-size: 0.8rem;
          letter-spacing: 0.12em;
          transition: opacity 0.7s ease, visibility 0.7s ease;
        }
        .loading-overlay.gone {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }
        .load-track {
          width: 220px; height: 1px;
          background: var(--border); border-radius: 2px; overflow: hidden;
        }
        .load-fill {
          height: 100%;
          background: var(--accent); border-radius: 2px;
          transition: width 0.1s linear;
        }
        .load-pct { color: var(--accent); font-size: 0.72rem; }
      `}</style>

      {/* Loading overlay */}
      <div className={`loading-overlay${loaded ? ' gone' : ''}`}>
        <Logo />
        <div className="load-track">
          <div className="load-fill" style={{ width: `${loadPct}%` }} />
        </div>
        <span className="load-pct">{loadPct}%</span>
        <span>Preparing experience…</span>
      </div>

      <NavBar />

      <section ref={sectionRef} className="hero-section">
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="hero-vignette" />

        <div className="hero-overlay">
          <h1 ref={nameRef} className="hero-name">
            {info.name.split(' ').map((word, i) =>
              i === 0
                ? <span key={i} className="acc">{word}&nbsp;</span>
                : <span key={i}>{word}</span>
            )}
          </h1>

          <p ref={roleRef} className="hero-role">{info.role}</p>
          <p ref={aboutRef} className="hero-about">{info.about}</p>

          <div ref={socialsRef} className="hero-socials">
            {info.socials.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="social-pill">
                <img src={s.iconUrl} alt={s.name} />
                {s.name}
              </a>
            ))}
          </div>
        </div>

        <div ref={scrollHintRef} className="scroll-hint">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>
    </>
  );
};