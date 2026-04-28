import React, { useEffect, useRef } from 'react';
import { Logo } from './logo';
import info from '../data/info.json';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Badge ────────────────────────────────────────────────────────────────────
// Place <Badge /> anywhere in App.tsx (outside the Hero section so it stays
// visible across the whole page).  It is fixed-positioned top-left.
//
// Scroll behaviour:
//   ↓ scroll  →  text blurs + slides left + fades out, icon shrinks, pill narrows
//   ↑ scroll  →  everything reverses (scrub = bidirectional)
// ─────────────────────────────────────────────────────────────────────────────

export const Badge: React.FC = () => {
  const pillRef  = useRef<HTMLDivElement>(null);
  const iconRef  = useRef<HTMLDivElement>(null);
  const textRef  = useRef<HTMLDivElement>(null);
  const dotRef   = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const pill = pillRef.current!;
    const icon = iconRef.current!;
    const text = textRef.current!;

    // ── baseline measurements (expanded) ──────────────────────────────────
    // We'll animate to these "collapsed" values
    const SCROLL_DISTANCE = 120; // px of scroll to complete the transition

    const ctx = gsap.context(() => {

      // Text: slide left + blur + fade out
      gsap.fromTo(
        text,
        {
          opacity : 1,
          x       : 0,
          filter  : 'blur(0px)',
          width   : 'auto',
          maxWidth: '260px',
        },
        {
          opacity : 0,
          x       : -14,
          filter  : 'blur(6px)',
          maxWidth: '0px',
          ease    : 'power2.inOut',
          scrollTrigger: {
            trigger: document.body,
            start  : 'top top',
            end    : `+=${SCROLL_DISTANCE}`,
            scrub  : 0.8,
          },
        }
      );

      // Icon: scale down
      gsap.fromTo(
        icon,
        { scale: 1 },
        {
          scale : 0.70,
          ease  : 'power2.inOut',
          scrollTrigger: {
            trigger: document.body,
            start  : 'top top',
            end    : `+=${SCROLL_DISTANCE}`,
            scrub  : 0.8,
          },
        }
      );

      // Pill: shrink padding + gap
      gsap.fromTo(
        pill,
        { paddingRight: '18px', gap: '10px' },
        {
          paddingRight: '8px',
          gap         : '0px',
          ease        : 'power2.inOut',
          scrollTrigger: {
            trigger: document.body,
            start  : 'top top',
            end    : `+=${SCROLL_DISTANCE}`,
            scrub  : 0.8,
          },
        }
      );

    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Mono:wght@300;400&display=swap');

        .badge-pill {
          /* fixed top-left, always on top */
          position : fixed;
          top       : 22px;
          left      : 24px;
          z-index   : 9000;

          /* layout */
          display        : inline-flex;
          align-items    : center;
          gap            : 10px;
          padding        : 6px 18px 6px 6px;

          /* glass surface */
          background     : rgba(255, 255, 255, 0.055);
          backdrop-filter: blur(18px) saturate(1.4);
          -webkit-backdrop-filter: blur(18px) saturate(1.4);
          border         : 1px solid rgba(255, 255, 255, 0.10);
          border-radius  : 100px;

          /* subtle glow */
          box-shadow:
            0 0 0 1px rgba(232, 255, 71, 0.06),
            0 4px 24px rgba(0, 0, 0, 0.35);

          cursor: default;
          user-select: none;

          /* let GSAP animate gap/padding */
          will-change: gap, padding;
        }

        /* icon wrapper — fixed square so the pill height never jumps */
        .badge-icon {
          flex-shrink: 0;
          width      : 38px;
          height     : 38px;
          border-radius: 50%;
          overflow   : hidden;
          display    : flex;
          align-items: center;
          justify-content: center;
          transform-origin: center center;
          will-change: transform;
        }

        /* text side — overflow hidden so text can slide out cleanly */
        .badge-text-wrap {
          overflow   : hidden;
          white-space: nowrap;
          will-change: max-width, opacity, filter, transform;
          /* transition handled entirely by GSAP */
        }

        .badge-name {
          font-family : 'Syne', sans-serif;
          font-weight : 700;
          font-size   : 0.92rem;
          letter-spacing: 0.01em;
          color       : #ffffff;
          line-height : 1;
          display     : flex;
          align-items : baseline;
          gap         : 2px;
        }

        .badge-copy {
          font-family : 'DM Mono', monospace;
          font-size   : 0.6rem;
          font-weight : 300;
          color       : rgba(232, 255, 71, 0.75);
          vertical-align: super;
          line-height : 1;
        }

        /* hover lift */
        .badge-pill:hover {
          box-shadow:
            0 0 0 1px rgba(232, 255, 71, 0.18),
            0 6px 28px rgba(0, 0, 0, 0.4);
          border-color: rgba(232, 255, 71, 0.18);
          transition: box-shadow 0.3s ease, border-color 0.3s ease;
        }
      `}</style>

      <div ref={pillRef} className="badge-pill">

        {/* Icon — uses the project's existing Logo component */}
        <div ref={iconRef} className="badge-icon">
          <Logo />
        </div>

        {/* Text — clipped out on scroll */}
        <div ref={textRef} className="badge-text-wrap">
          <span className="badge-name">
            {info.name}
            <sup ref={dotRef} className="badge-copy">©</sup>
          </span>
        </div>

      </div>
    </>
  );
};