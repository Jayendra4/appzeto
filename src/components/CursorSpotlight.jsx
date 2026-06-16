import React, { useEffect, useRef } from 'react';

const CursorSpotlight = () => {
  const mousePos = useRef({ x: -1000, y: -1000 });
  const spotlightPos = useRef({ x: -1000, y: -1000 });
  const glowPos = useRef({ x: -1000, y: -1000 });
  const ambientPos = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef(null);
  const spotlightRef = useRef(null);
  const glowRef = useRef(null);
  const ambientRef = useRef(null);
  const timeRef = useRef(0);

  const lerp = (start, end, factor) => {
    return start + (end - start) * factor;
  };

  const animate = () => {
    timeRef.current += 0.016;

    // Liquid smooth follow with different factors for each layer
    spotlightPos.current.x = lerp(spotlightPos.current.x, mousePos.current.x, 0.08);
    spotlightPos.current.y = lerp(spotlightPos.current.y, mousePos.current.y, 0.08);

    glowPos.current.x = lerp(glowPos.current.x, mousePos.current.x, 0.12);
    glowPos.current.y = lerp(glowPos.current.y, mousePos.current.y, 0.12);

    // Ambient layer follows more slowly for depth
    ambientPos.current.x = lerp(ambientPos.current.x, mousePos.current.x, 0.04);
    ambientPos.current.y = lerp(ambientPos.current.y, mousePos.current.y, 0.04);

    if (spotlightRef.current) {
      spotlightRef.current.style.transform = `translate3d(${spotlightPos.current.x - 400}px, ${spotlightPos.current.y - 400}px, 0)`;
      // Pulsing intensity
      const pulse = Math.sin(timeRef.current * 2) * 0.1 + 0.9;
      spotlightRef.current.style.opacity = pulse;
    }

    if (glowRef.current) {
      glowRef.current.style.transform = `translate3d(${glowPos.current.x - 250}px, ${glowPos.current.y - 250}px, 0)`;
    }

    if (ambientRef.current) {
      ambientRef.current.style.transform = `translate3d(${ambientPos.current.x - 600}px, ${ambientPos.current.y - 600}px, 0)`;
    }

    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      // Update CSS variables for background spotlight
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Ambient layer - largest, most subtle */}
      <div
        ref={ambientRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '1200px',
          height: '1200px',
          pointerEvents: 'none',
          zIndex: 0,
          background: `radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, rgba(59, 130, 246, 0.04) 30%, rgba(16, 185, 129, 0.02) 60%, transparent 80%)`,
          borderRadius: '50%',
          filter: 'blur(120px)',
          willChange: 'transform',
          mixBlendMode: 'screen',
          opacity: 0.6,
        }}
      />
      
      {/* Main spotlight - large soft glow */}
      <div
        ref={spotlightRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '800px',
          height: '800px',
          pointerEvents: 'none',
          zIndex: 0,
          background: `radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(59, 130, 246, 0.15) 35%, rgba(16, 185, 129, 0.08) 65%, transparent 80%)`,
          borderRadius: '50%',
          filter: 'blur(90px)',
          willChange: 'transform',
          mixBlendMode: 'screen',
          opacity: 0.9,
        }}
      />
      
      {/* Secondary glow - smaller, more intense */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '500px',
          height: '500px',
          pointerEvents: 'none',
          zIndex: 0,
          background: `radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.18) 40%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(60px)',
          willChange: 'transform',
          mixBlendMode: 'screen',
          opacity: 0.75,
        }}
      />
    </>
  );
};

export default CursorSpotlight;
