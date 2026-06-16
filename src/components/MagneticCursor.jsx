import { useEffect, useRef, useState } from 'react';

const MagneticCursor = () => {
  const cursorRef = useRef(null);
  const cursorOuterRef = useRef(null);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const cursorPos = useRef({ x: -1000, y: -1000 });
  const cursorOuterPos = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  // Smooth interpolation function
  const lerp = (start, end, factor) => {
    return start + (end - start) * factor;
  };

  // Magnetic attraction calculation
  const calculateMagneticPull = (element, mouseX, mouseY) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = mouseX - centerX;
    const distanceY = mouseY - centerY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    const maxDistance = 150;
    const pullStrength = Math.max(0, 1 - distance / maxDistance);
    
    return {
      x: distanceX * pullStrength * 0.3,
      y: distanceY * pullStrength * 0.3,
      strength: pullStrength
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      // Update CSS variables for ambient lighting
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
    };

    const handleMouseOver = (e) => {
      const target = e.target.closest('.magnetic-target, button, a, .task-card, .filterControl, .tab');
      if (target) {
        setIsHovering(true);
        if (cursorRef.current) {
          cursorRef.current.style.transform = 'translate(-50%, -50%) scale(2.5)';
          cursorRef.current.style.background = 'rgba(139, 92, 246, 0.15)';
        }
        if (cursorOuterRef.current) {
          cursorOuterRef.current.style.transform = 'translate(-50%, -50%) scale(1.5)';
          cursorOuterRef.current.style.borderColor = 'rgba(139, 92, 246, 0.5)';
        }
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest('.magnetic-target, button, a, .task-card, .filterControl, .tab');
      if (target) {
        setIsHovering(false);
        if (cursorRef.current) {
          cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
          cursorRef.current.style.background = 'rgba(139, 92, 246, 0.08)';
        }
        if (cursorOuterRef.current) {
          cursorOuterRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
          cursorOuterRef.current.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        }
      }
    };

    const animate = () => {
      // Inner cursor - fast, responsive
      cursorPos.current.x = lerp(cursorPos.current.x, mousePos.current.x, 0.25);
      cursorPos.current.y = lerp(cursorPos.current.y, mousePos.current.y, 0.25);

      // Outer cursor - slower, more liquid
      cursorOuterPos.current.x = lerp(cursorOuterPos.current.x, mousePos.current.x, 0.12);
      cursorOuterPos.current.y = lerp(cursorOuterPos.current.y, mousePos.current.y, 0.12);

      if (cursorRef.current) {
        cursorRef.current.style.left = `${cursorPos.current.x}px`;
        cursorRef.current.style.top = `${cursorPos.current.y}px`;
      }

      if (cursorOuterRef.current) {
        cursorOuterRef.current.style.left = `${cursorOuterPos.current.x}px`;
        cursorOuterRef.current.style.top = `${cursorOuterPos.current.y}px`;
      }

      // Apply magnetic attraction to hovered elements
      if (isHovering) {
        const magneticElements = document.querySelectorAll('.magnetic-target:hover, button:hover, a:hover, .task-card:hover');
        magneticElements.forEach(element => {
          const pull = calculateMagneticPull(element, mousePos.current.x, mousePos.current.y);
          if (pull.strength > 0) {
            element.style.transform = `translate(${pull.x}px, ${pull.y}px)`;
          }
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isHovering]);

  return (
    <>
      {/* Inner cursor - small, precise */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.08)',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%) scale(1)',
          transition: 'transform 0.15s ease-out, background 0.15s ease-out',
          willChange: 'transform, left, top',
          mixBlendMode: 'screen',
        }}
      />
      
      {/* Outer cursor - large, soft glow */}
      <div
        ref={cursorOuterRef}
        style={{
          position: 'fixed',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 9998,
          transform: 'translate(-50%, -50%) scale(1)',
          transition: 'transform 0.25s ease-out, border-color 0.25s ease-out',
          willChange: 'transform, left, top',
        }}
      />
    </>
  );
};

export default MagneticCursor;
