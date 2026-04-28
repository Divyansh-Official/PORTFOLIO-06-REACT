import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onReady: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onReady }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    let done = false;

    const interval = setInterval(() => {
      // Organic easing: fast at start, slows in middle, fast at end
      const remaining = 100 - current;
      const increment = Math.random() * Math.min(remaining * 0.08, 4) + 0.5;
      current = Math.min(current + increment, 100);

      setProgress(Math.floor(current));

      if (current >= 100 && !done) {
        done = true;
        clearInterval(interval);
        setTimeout(onReady, 600);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [onReady]);

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
      style={{
        // BULLETPROOF: These inline styles CANNOT be overridden by Tailwind
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0d0d0d',
        overflow: 'hidden',
        zIndex: 9999,
        // The magic: a single flex container that IS the full screen
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >

      {/* ── EXACT CENTER LOGO ───────────────────────────────────────────── */}
      {/*
        We use position: absolute + transform: translate(-50%, -50%)
        This is the ONLY 100% reliable centering method across all
        screen sizes, ratios, and browsers.
      */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {/* Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            width: 'clamp(150px, 35vmin, 400px)',
            height: 'clamp(150px, 35vmin, 400px)',
            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        {/* The Japanese Character */}
        <motion.span
          initial={{ opacity: 0, scale: 0.88, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.1,
          }}
          style={{
            // vmin is the KEY unit: smaller of vw/vh
            // Works perfectly on portrait phones AND landscape tablets
            fontSize: 'clamp(5rem, 10vmin, 13rem)',
            fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif',
            color: '#ffffff',
            fontWeight: 100,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            userSelect: 'none',
            display: 'block',
            textShadow: '0 0 60px rgba(255,255,255,0.06)',
          }}
        >
          ディヴヤンシュ
        </motion.span>
      </div>

      {/* ── PROGRESS BAR (Pinned to Bottom) ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          // Safe area for mobile notch at bottom
          paddingBottom: 'clamp(1.5rem, 4vh, 3rem)',
          paddingLeft: 'clamp(1.5rem, 5vw, 4rem)',
          paddingRight: 'clamp(1.5rem, 5vw, 4rem)',
          zIndex: 2,
        }}
      >
        {/* Label Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: 'clamp(8px, 1vw, 10px)',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              fontWeight: 300,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Loading Experience
          </span>
          <span
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 'clamp(9px, 1.1vw, 12px)',
              fontWeight: 300,
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {progress}
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>%</span>
          </span>
        </div>

        {/* Progress Track */}
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Fill Bar */}
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '999px',
            }}
          />

          {/* Shimmer Sweep */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: 'linear',
              delay: 0.5,
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '30%',
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              borderRadius: '999px',
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};