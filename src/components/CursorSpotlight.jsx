import React, { useEffect, useRef } from 'react';

const CursorSpotlight = () => {
  // Use refs for smooth updates
  const mousePos = useRef({ x: -1000, y: -1000 });
  const spotlightPos = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef(null);
  const spotlightRef = useRef(null);

  // Lerp for smooth animation
  const lerp = (start, end, factor) => {
    return start + (end - start) * factor;
  };

  const animate = () => {
    // Smooth follow
    spotlightPos.current.x = lerp(spotlightPos.current.x, mousePos.current.x, 0.2);
    spotlightPos.current.y = lerp(spotlightPos.current.y, mousePos.current.y, 0.2);

    if (spotlightRef.current) {
      spotlightRef.current.style.transform = `translate3d(${spotlightPos.current.x - 300}px, ${spotlightPos.current.y - 300}px, 0)`;
    }

    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={spotlightRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '600px',
        height: '600px',
        pointerEvents: 'none',
        zIndex: 0,
        background: `radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(59, 130, 246, 0.15) 30%, rgba(16, 185, 129, 0.08) 60%, transparent 80%)`,
        borderRadius: '50%',
        filter: 'blur(60px)',
        willChange: 'transform',
        mixBlendMode: 'screen',
      }}
    />
  );
};

export default CursorSpotlight;
