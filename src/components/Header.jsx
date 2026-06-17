import DataHealthBadge from './DataHealthBadge';
import { useKanban } from '../context/KanbanContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import toast from 'react-hot-toast';
import styles from './Header.module.css';

const Header = ({ onReset }) => {
  const { history, future, undo, redo } = useKanban();
  
  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ctrlKey: true,
      shiftKey: true,
      key: 'z',
      onKeyDown: () => {
        if (future.length > 0) {
          redo();
          toast.success('Redo performed');
        }
      }
    },
    {
      ctrlKey: true,
      key: 'z',
      onKeyDown: () => {
        if (history.length > 0) {
          undo();
          toast.success('Undo performed');
        }
      }
    }
  ]);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
      <div className={styles.container}>
        {/* Branding */}
        <div className={styles.branding}>
          {/* Logo Icon */}
          <div className={styles.logo}>A</div>
          <div className={styles.brandText}>
            <h1 className={styles.brandTitle}>Appzeto Sprint Board</h1>
          </div>
        </div>
        
        <div className={styles.controls}>
          {/* Undo/Redo Controls */}
          <div className={styles.actionButtons}>
            <button 
              onClick={() => {
                if (history.length > 0) {
                  undo();
                  toast.success('Undo performed');
                }
              }}
              disabled={history.length === 0}
              className={`${styles.actionButton} ${history.length > 0 ? styles.active : ''}`}
            >
              <span className={styles.actionButtonIcon}>↩</span>
              <span className={styles.actionButtonText}>Undo</span>
            </button>
            
            <button 
              onClick={() => {
                if (future.length > 0) {
                  redo();
                  toast.success('Redo performed');
                }
              }}
              disabled={future.length === 0}
              className={`${styles.actionButton} ${future.length > 0 ? styles.active : ''}`}
            >
              <span className={styles.actionButtonIcon}>↪</span>
              <span className={styles.actionButtonText}>Redo</span>
            </button>
          </div>
          
          {/* Data Health Badge */}
       <div className={styles.desktopOnly}>
  <DataHealthBadge />
</div>
          
          {/* Reset Button */}
          <button 
            onClick={onReset}
            className={styles.resetButton}
          >
            <span className={styles.resetButtonIcon}>🔄</span>
            <span className={styles.resetButtonText}>Reset</span>
          </button>
        </div>
      </div>{/* .container */}
      </div>{/* .headerInner */}
    </header>
  );
};

export default Header;
