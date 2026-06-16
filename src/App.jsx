import { useEffect } from 'react';
import { KanbanProvider } from './context/KanbanContext';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';
import MagneticCursor from './components/MagneticCursor';

function App() {
  useEffect(() => {
    const handleMouseMove = (e) => {
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <KanbanProvider>
      <MagneticCursor />
      <div className="grid-pattern" />
      <Dashboard />
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: 'rgba(18, 18, 20, 0.85)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
            borderRadius: '20px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            padding: '18px 24px',
            letterSpacing: '-0.01em',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f8fafc',
            },
            style: {
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 0 40px -20px rgba(16, 185, 129, 0.3)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f8fafc',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 0 40px -20px rgba(239, 68, 68, 0.3)',
            },
          },
        }}
      />
    </KanbanProvider>
  );
}

export default App;
