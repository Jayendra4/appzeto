import { useEffect, useRef, useState } from 'react';

const MouseGlow = () => {
  const glowRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const rafRef = useRef(null);
  const currentPosRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const animate = () => {
      const dx = mousePos.x - currentPosRef.current.x;
      const dy = mousePos.y - currentPosRef.current.y;
      
      // Smooth interpolation
      currentPosRef.current.x += dx * 0.15;
      currentPosRef.current.y += dy * 0.15;

      if (glowRef.current) {
        glowRef.current.style.left = `${currentPosRef.current.x}px`;
        glowRef.current.style.top = `${currentPosRef.current.y}px`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mousePos]);

  return (
    <div
      ref={glowRef}
      className="mouse-glow"
      style={{
        left: `${mousePos.x}px`,
        top: `${mousePos.y}px`
      }}
    />
  );
};

export default MouseGlow;
