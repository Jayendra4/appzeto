import React, { useState, useEffect } from 'react';
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

const Dashboard = () => {
  const { 
    tasks, 
    filters,
    setFilters,
    moveTask, 
    reorderTask 
  } = useKanban();
  
  // Local state for search input (immediate updates)
  const [searchInput, setSearchInput] = useState(filters.searchText);
  // Debounce search input to avoid excessive re-renders
  const debouncedSearch = useDebounce(searchInput, 300);
  
  // Active tab for mobile view
  const [activeTab, setActiveTab] = useState(STATUS_ORDER[0]);
  
  // Is mobile? Check window width (900px breakpoint)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  // Listen to window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
  const handleDragEnd = (result) => {
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
    
    // If moving to a different column, check WIP limits
    if (destinationStatus !== sourceStatus) {
      const wipCheck = canMoveToColumn(tasks, destinationStatus, taskId);
      if (!wipCheck.allowed) {
        toast.error(wipCheck.message);
        return;
      }
      // If allowed, move the task
      moveTask(taskId, destinationStatus);
      // For mobile view: if moving to different column, switch to that column!
      setActiveTab(destinationStatus);
      return;
    }
    
    // If same column, reorder
    reorderTask(taskId, destination.index, sourceStatus);
  };
  
  // Toggle assignee filter
  const toggleAssignee = (assignee) => {
    const newAssignees = filters.assignees.includes(assignee)
      ? filters.assignees.filter(a => a !== assignee)
      : [...filters.assignees, assignee];
    setFilters({ assignees: newAssignees });
  };

  return (
    <>
      <CursorSpotlight />
      <div className={styles.dashboard}>
        {/* Fixed header — always on top */}
        <Header />

        {/* Fixed mobile tab bar — sits directly below the header */}
        <div className={styles.tabBar}>
          {STATUS_ORDER.map(status => (
            <button
              key={status}
              className={`${styles.tab} ${activeTab === status ? styles.active : ''}`}
              onClick={() => setActiveTab(status)}
            >
              {status}
            </button>
          ))}
        </div>

        <main className={styles.container}>
          {/* Filter Bar */}
          <div className={styles.filterBar}>
            {/* Search Field */}
            <div className={styles.searchContainer}>
              <span className={styles.searchIcon}>🔍</span>
              <input 
                type="text" 
                placeholder="Search tasks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={styles.searchInput}
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
            
            {/* Overdue Toggle */}
            <div 
              className={styles.filterControl}
              onClick={() => setFilters({ overdueOnly: !filters.overdueOnly })}
            >
              <div className={`${styles.toggleContainer} ${filters.overdueOnly ? styles.active : ''}`}>
                <div className={styles.toggleKnob} />
              </div>
              <span className={styles.filterLabel}>Overdue only</span>
            </div>
          </div>
          
          {/* Kanban Board */}
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Desktop View */}
            {!isMobile && (
              <div className={styles.kanbanBoard}>
                {STATUS_ORDER.map((status) => {
                  // Use full tasks for count, hours, WIP
                  const count = getColumnCount(tasks, status);
                  const hours = getColumnHours(tasks, status);
                  const doneThisWeekHours = status === 'Done' ? getCompletedThisWeekHours(tasks) : null;
                  
                  // Use filtered tasks only for rendering visible cards
                  const columnTasksVisible = getColumnTasks(filteredTasks, status);
                  const statusClass = STATUS_CLASS_MAP[status];
                  
                  return (
                    <div key={status} className={`${styles.column} ${statusClass}`}>
                      {/* Column Header */}
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
                      
                      {/* Done this week for Done column */}
                      {doneThisWeekHours !== null && (
                        <div className={styles.doneThisWeek}>
                          <span>📊</span>
                          Done this week: <b>{doneThisWeekHours}h</b>
                        </div>
                      )}
                      
                      {/* Droppable Zone */}
                      <Droppable droppableId={status}>
                        {(provided, snapshot) => (
                          <div
                            className={`column ${styles.droppableZone} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {/* Empty State */}
                            {columnTasksVisible.length === 0 && (
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
                            )}
                            
                            {/* Task Cards */}
                            {columnTasksVisible.map((task, index) => (
                              <Draggable key={String(task.id)} draggableId={String(task.id)} index={index}>
                                {(provided, snapshot) => {
                                  // Merge dnd styles with custom styles
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
                            ))}
                            
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
                  
                  // Use full tasks for count, hours, WIP
                  const count = getColumnCount(tasks, status);
                  const hours = getColumnHours(tasks, status);
                  const doneThisWeekHours = status === 'Done' ? getCompletedThisWeekHours(tasks) : null;
                  
                  // Use filtered tasks only for rendering visible cards
                  const columnTasksVisible = getColumnTasks(filteredTasks, status);
                  const statusClass = STATUS_CLASS_MAP[status];
                  
                  return (
                    <div key={status} className={`${styles.column} ${statusClass}`}>
                      {/* Done this week for Done column */}
                      {doneThisWeekHours !== null && (
                        <div className={styles.doneThisWeek}>
                          <span>📊</span>
                          Done this week: <b>{doneThisWeekHours}h</b>
                        </div>
                      )}
                      
                      {/* Droppable Zone */}
                      <Droppable droppableId={status}>
                        {(provided, snapshot) => (
                          <div
                            className={`column ${styles.droppableZone} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {/* Empty State */}
                            {columnTasksVisible.length === 0 && (
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
                            )}
                            
                            {/* Task Cards */}
                            {columnTasksVisible.map((task, index) => (
                              <Draggable key={String(task.id)} draggableId={String(task.id)} index={index}>
                                {(provided, snapshot) => {
                                  // Merge dnd styles with custom styles
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
                            ))}
                            
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
      >
        <span className={styles.filterIcon}>👤</span>
        <span className={styles.filterLabel}>
          Assignee {selectedAssignees.length > 0 ? `(${selectedAssignees.length})` : ''}
        </span>
        <span className={`${styles.filterChevron} ${isOpen ? styles.open : ''}`}>▼</span>
        
        {isOpen && (
          <div className={styles.assigneeMenu}>
            {assignees.map(assignee => (
              <div 
                key={assignee}
                className={`${styles.assigneeOption} ${selectedAssignees.includes(assignee) ? styles.selected : ''}`}
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
