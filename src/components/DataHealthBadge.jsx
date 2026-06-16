import { useKanban } from '../context/KanbanContext';
import styles from './Header.module.css';

const DataHealthBadge = () => {
  const { issuesFixed, tasksLoaded } = useKanban();

  return (
    <div className={styles.healthBadge}>
      <div className={styles.healthIndicator}>✓</div>
      <div className={styles.healthText}>
        <span className={styles.healthTextDesktop}>
          {issuesFixed} issues fixed · {tasksLoaded} tasks loaded
        </span>
        <span className={styles.healthTextMobile}>
          {issuesFixed} · {tasksLoaded}
        </span>
      </div>
    </div>
  );
};

export default DataHealthBadge;
