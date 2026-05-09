import { useEffect, useRef, useState } from 'react';
import trivistaLogo from '../assets/logo.png';

const TEAL = '#00D1B2';
const BG = '#0A0A0A';

export default function LoadingScreen({ onComplete }) {
  const [phase, setPhase] = useState(0); // 0=logo, 1=text, 2=fadeout, 3=done
  const containerRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete?.();
      return;
    }

    // Phase 1: SVG stroke draws in (0-1200ms)
    setPhase(1);

    // Phase 2: Text fade in (800-1600ms)
    const t2 = setTimeout(() => setPhase(2), 800);

    // Phase 3: Fade out (1800ms)
    const t3 = setTimeout(() => setPhase(3), 1800);

    // Complete (2400ms)
    const t4 = setTimeout(() => {
      onComplete?.();
    }, 2400);

    return () => { clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  if (phase > 3) return null;

  const trivistaLetters = 'TRIVISTA'.split('');
  const labsLetters = 'LABS'.split('');

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: BG,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase >= 3 ? 0 : 1,
        transition: 'opacity 600ms ease',
        pointerEvents: phase >= 3 ? 'none' : 'all',
      }}
    >
      {/* Logo image with entrance animation */}
      <img
        src={trivistaLogo}
        alt="Trivista Labs"
        style={{
          width: 200,
          height: 200,
          objectFit: 'contain',
          marginBottom: 32,
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'scale(1)' : 'scale(0.6)',
          transition: 'opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1)',
          filter: `drop-shadow(0 0 24px rgba(0, 209, 178, ${phase >= 1 ? 0.3 : 0}))`,
        }}
      />



      {/* Loading bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          width: 120,
          height: 2,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: phase >= 2 ? '100%' : '0%',
            height: '100%',
            background: TEAL,
            transition: 'width 1400ms cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  );
}
