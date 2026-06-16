import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import CursorSpotlight from '../components/CursorSpotlight';
import { useKanban } from '../context/KanbanContext';
import { STATUS_ORDER } from '../constants';
import { 
  getColumnTasks, 
  getColumnCount, 
  getColumnHours, 
  getFilteredTasks,
  getCompletedThisWeekHours 
} from '../utils/selectors';
import { canMoveToColumn } from '../utils/wipUtils';
import { useDebounce } from '../hooks/useDebounce';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import styles from './Dashboard.module.css';

// Status to style mapping
const STATUS_CLASS_MAP = {
  'Backlog': styles.statusBacklog,
  'In Progress': styles.statusInProgress,
  'Review': styles.statusReview,
  'Done': styles.statusDone,
};

// Get initials from name
const getInitials = (name) => {
  if (!name || name === 'Unassigned') return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Translate a destination index from the filtered-visible column array
// into the equivalent index in the full (unfiltered) column array.
// Required because DnD reports indices relative to what is rendered,
// but the reducer operates on the complete task list.
const mapFilteredIndexToFull = (taskId, destIndex, allTasks, filteredTasks, status) => {
  // Full column without the moved card
  const fullColWithoutMoved = getColumnTasks(allTasks, status).filter(t => t.id !== taskId);
  // Filtered column without the moved card
  const filteredColWithoutMoved = getColumnTasks(filteredTasks, status).filter(t => t.id !== taskId);

  // No visible tasks or dropped at position 0 → find index of first visible in full
  if (destIndex === 0) {
    if (filteredColWithoutMoved.length === 0) return 0;
    const firstVisible = filteredColWithoutMoved[0];
    return fullColWithoutMoved.findIndex(t => t.id === firstVisible.id);
  }

  // Dropped after the task at (destIndex - 1) in filtered view
  const prevVisible = filteredColWithoutMoved[destIndex - 1];
  if (!prevVisible) return fullColWithoutMoved.length; // past the end

  return fullColWithoutMoved.findIndex(t => t.id === prevVisible.id) + 1;
};

const Dashboard = () => {
  const { 
    tasks, 
    filters,
    setFilters,
    moveTask, 
    reorderTask,
    resetBoard
  } = useKanban();
  
  // Local state for search input (immediate updates)
  const [searchInput, setSearchInput] = useState(filters.searchText);
  // Debounce search input to avoid excessive re-renders
  const debouncedSearch = useDebounce(searchInput, 300);
  
  // Active tab for mobile view
  const [activeTab, setActiveTab] = useState(STATUS_ORDER[0]);
  
  // Is mobile? Check window width matching the CSS media query
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 900px)').matches;
    }
    return false;
  });

  // Listen to window resize using matchMedia
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    
    // Initial check
    setIsMobile(mediaQuery.matches);
    
    const handleMediaQueryChange = (e) => {
      setIsMobile(e.matches);
    };

    // Use addEventListener (modern browsers)
    mediaQuery.addEventListener('change', handleMediaQueryChange);
    return () => mediaQuery.removeEventListener('change', handleMediaQueryChange);
  }, []);
  
  const uniqueAssignees = Array.from(new Set(tasks.map(task => task.assignee))).sort();
  
  // Sync debounced search to context
  useEffect(() => {
    if (debouncedSearch !== filters.searchText) {
      setFilters({ searchText: debouncedSearch });
    }
  }, [debouncedSearch, setFilters, filters.searchText]);
  
  // Get filtered tasks for rendering only
  const filteredTasks = getFilteredTasks(tasks, filters);

  // Handle drag and drop end event
  const handleDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;
    
    // If no destination, do nothing
    if (!destination) return;
    
    // If dropped in same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    const taskId = draggableId;
    const destinationStatus = destination.droppableId;
    const sourceStatus = source.droppableId;
    
    // Cross-column move
    if (destinationStatus !== sourceStatus) {
      const wipCheck = canMoveToColumn(tasks, destinationStatus, taskId);
      if (!wipCheck.allowed) {
        toast.error(wipCheck.message);
        return;
      }
      moveTask(taskId, destinationStatus);
      // On mobile, follow the card to its new column
      setActiveTab(destinationStatus);
      return;
    }
    
    // Same-column reorder:
    // destination.index is relative to the RENDERED (filtered) list.
    // Translate it to the full column index so the reducer places the
    // card in the correct position even when filters hide some cards.
    const fullDestIndex = mapFilteredIndexToFull(
      taskId,
      destination.index,
      tasks,
      filteredTasks,
      sourceStatus
    );
    reorderTask(taskId, fullDestIndex, sourceStatus);
  }, [tasks, filteredTasks, moveTask, reorderTask]);
  
  // Toggle assignee filter
  const toggleAssignee = (assignee) => {
    const newAssignees = filters.assignees.includes(assignee)
      ? filters.assignees.filter(a => a !== assignee)
      : [...filters.assignees, assignee];
    setFilters({ assignees: newAssignees });
  };

  // Reset with confirmation to prevent accidental data loss
  const handleReset = () => {
    if (window.confirm('Reset the board to its original state? All moves and history will be lost.')) {
      resetBoard();
    }
  };

  // Shared card renderer to avoid duplication between desktop and mobile paths
  const renderCard = (task, index) => (
    <Draggable key={String(task.id)} draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => {
        const cardStyle = {
          ...provided.draggableProps.style,
          zIndex: snapshot.isDragging ? 9999 : 'auto',
        };
        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`task-card ${styles.taskCard} ${task.hasWarning ? styles.warning : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
            style={cardStyle}
          >
            {/* Warning badge for status-fixed cards */}
            {task.hasWarning && (
              <div className={styles.warningBadge}>⚠️</div>
            )}

            {/* Task Title */}
            <h3 className={styles.taskTitle}>{task.title}</h3>

            {/* Task Footer */}
            <div className={styles.taskFooter}>
              {/* Assignee with Avatar */}
              <div className={styles.assignee}>
                <div className={`${styles.avatar} ${task.assignee === 'Unassigned' ? styles.unassigned : ''}`}>
                  {getInitials(task.assignee)}
                </div>
                <span className={styles.assigneeName}>{task.assignee}</span>
              </div>

              {/* Estimate Badge */}
              <span className={styles.estimateBadge}>{task.estimateHours}h</span>
            </div>
          </div>
        );
      }}
    </Draggable>
  );

  // Shared column header renderer
  const renderColumnHeader = (status, count, hours) => (
    <div className={styles.columnHeader}>
      <div className={styles.columnTitle}>
        <div className={styles.statusDot} />
        <h2 className={styles.columnName}>{status}</h2>
      </div>
      <div className={styles.columnMeta}>
        <span className={styles.countBadge}>{count}</span>
        <span className={styles.hoursBadge}>{hours}h</span>
      </div>
    </div>
  );

  // Shared empty state renderer
  const renderEmptyState = (status) => (
    <div className={styles.emptyState}>
      <span className={styles.emptyStateIcon}>📝</span>
      <span className={styles.emptyStateText}>
        {searchInput || filters.assignees.length > 0 || filters.overdueOnly
          ? 'No matching tasks'
          : `No tasks in ${status}`}
      </span>
      <span className={styles.emptyStateHint}>
        Drag a task here to get started
      </span>
    </div>
  );

  const hasActiveFilters = !!(searchInput || filters.assignees.length > 0 || filters.overdueOnly);

  return (
    <>
      <CursorSpotlight />
      <div>
        <Header onReset={handleReset} />
        
        {/* Mobile Tab Bar — each tab shows its live task count */}
        <div className={styles.tabBar}>
          {STATUS_ORDER.map(status => {
            const isActive = activeTab === status;
            const tabCount = getColumnCount(tasks, status);
            return (
              <button
                key={status}
                className={`${styles.tab} ${isActive ? styles.active : ''}`}
                onClick={() => setActiveTab(status)}
              >
                {status}
                <span className={`${styles.tabCount} ${isActive ? styles.tabCountActive : ''}`}>
                  {tabCount}
                </span>
              </button>
            );
          })}
        </div>
        
        <main className={styles.container}>
          {/* Filter Bar */}
          <div className={styles.filterBar}>
            {/* Search Field */}
            <div className={styles.searchContainer}>
              <span className={styles.searchIcon}>🔍</span>
              <input 
                id="task-search"
                type="text" 
                placeholder="Search tasks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={styles.searchInput}
                aria-label="Search tasks"
              />
            </div>
            
            {/* Assignee Dropdown */}
            <div style={{ position: 'relative' }}>
              <AssigneeDropdown 
                assignees={uniqueAssignees}
                selectedAssignees={filters.assignees}
                onToggle={toggleAssignee}
              />
            </div>
            
            {/* Overdue Toggle — accessible button with switch role */}
            <button
              role="switch"
              aria-checked={filters.overdueOnly}
              className={styles.filterControl}
              onClick={() => setFilters({ overdueOnly: !filters.overdueOnly })}
            >
              <div className={`${styles.toggleContainer} ${filters.overdueOnly ? styles.active : ''}`}>
                <div className={styles.toggleKnob} />
              </div>
              <span className={styles.filterLabel}>Overdue only</span>
            </button>
          </div>

          {/* Active-filter notice — warns users that reorder drag is relative to filtered view */}
          {hasActiveFilters && (
            <div className={styles.filterNotice}>
              <span>🔎</span>
              <span>Filters active — column totals reflect full board. Card order changes apply to full column.</span>
            </div>
          )}
          
          {/* Kanban Board */}
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Desktop View */}
            {!isMobile && (
              <div className={styles.kanbanBoard}>
                {STATUS_ORDER.map((status) => {
                  const count = getColumnCount(tasks, status);
                  const hours = getColumnHours(tasks, status);
                  const doneThisWeekHours = status === 'Done' ? getCompletedThisWeekHours(tasks) : null;
                  const columnTasksVisible = getColumnTasks(filteredTasks, status);
                  const statusClass = STATUS_CLASS_MAP[status];
                  
                  return (
                    <div key={status} className={`${styles.column} ${statusClass}`}>
                      {renderColumnHeader(status, count, hours)}
                      
                      {doneThisWeekHours !== null && (
                        <div className={styles.doneThisWeek}>
                          <span>📊</span>
                          Done this week: <b>{doneThisWeekHours}h</b>
                        </div>
                      )}
                      
                      <Droppable droppableId={status}>
                        {(provided, snapshot) => (
                          <div
                            className={`column ${styles.droppableZone} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {columnTasksVisible.length === 0 && renderEmptyState(status)}
                            {columnTasksVisible.map((task, index) => renderCard(task, index))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Mobile View: Only active column */}
            {isMobile && (
              <div className={styles.mobileContainer}>
                {STATUS_ORDER.map((status) => {
                  if (status !== activeTab) return null;
                  
                  const count = getColumnCount(tasks, status);
                  const hours = getColumnHours(tasks, status);
                  const doneThisWeekHours = status === 'Done' ? getCompletedThisWeekHours(tasks) : null;
                  const columnTasksVisible = getColumnTasks(filteredTasks, status);
                  const statusClass = STATUS_CLASS_MAP[status];
                  
                  return (
                    <div key={status} className={`${styles.column} ${statusClass}`}>
                      {/* Column header shown on mobile too — fix for missing context */}
                      {renderColumnHeader(status, count, hours)}

                      {doneThisWeekHours !== null && (
                        <div className={styles.doneThisWeek}>
                          <span>📊</span>
                          Done this week: <b>{doneThisWeekHours}h</b>
                        </div>
                      )}
                      
                      <Droppable droppableId={status}>
                        {(provided, snapshot) => (
                          <div
                            className={`column ${styles.droppableZone} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {columnTasksVisible.length === 0 && renderEmptyState(status)}
                            {columnTasksVisible.map((task, index) => renderCard(task, index))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            )}
          </DragDropContext>
        </main>
      </div>
    </>
  );
};

// Assignee Dropdown Component
const AssigneeDropdown = ({ assignees, selectedAssignees, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.assignee-dropdown-wrapper')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="assignee-dropdown-wrapper">
      <div 
        className={styles.filterControl}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen); }}
      >
        <span className={styles.filterIcon}>👤</span>
        <span className={styles.filterLabel}>
          Assignee {selectedAssignees.length > 0 ? `(${selectedAssignees.length})` : ''}
        </span>
        <span className={`${styles.filterChevron} ${isOpen ? styles.open : ''}`}>▼</span>
        
        {isOpen && (
          <div className={styles.assigneeMenu} role="listbox">
            {assignees.map(assignee => (
              <div 
                key={assignee}
                className={`${styles.assigneeOption} ${selectedAssignees.includes(assignee) ? styles.selected : ''}`}
                role="option"
                aria-selected={selectedAssignees.includes(assignee)}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(assignee);
                }}
              >
                <input 
                  type="checkbox"
                  checked={selectedAssignees.includes(assignee)}
                  onChange={() => {}}
                  className={styles.assigneeCheckbox}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <span className={styles.assigneeName}>{assignee}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
