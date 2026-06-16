// Board selectors - pure functions to compute derived state from tasks
// Selectors are memoizable (can use useMemo) to prevent unnecessary re-renders
// 
// Important:
// - getFilteredTasks() is for VISUAL ONLY (what users see)
// - All other selectors (getColumnTasks, getColumnCount, etc.) use FULL tasks
//   This ensures:
//   1. WIP limits, column counts, hour totals always reflect full board state
//   2. Undo/Redo works with full state, not filtered
//   3. Reset board returns to original full state

import { STATUS_ORDER } from '../constants';

// getColumnTasks: Returns all tasks for a specific column (unfiltered)
export const getColumnTasks = (tasks, status) => {
  return tasks.filter(task => task.status === status);
};

// getColumnCount: Returns number of tasks in a column (unfiltered)
export const getColumnCount = (tasks, status) => {
  return getColumnTasks(tasks, status).length;
};

// getColumnHours: Returns total estimated hours in a column (unfiltered)
export const getColumnHours = (tasks, status) => {
  return getColumnTasks(tasks, status).reduce((total, task) => total + task.estimateHours, 0);
};

// getFilteredTasks: Returns tasks filtered by assignees, search text, and overdue flag
export const getFilteredTasks = (tasks, filters) => {
  return tasks.filter(task => {
    // Assignee filter
    if (filters.assignees.length > 0 && !filters.assignees.includes(task.assignee)) {
      return false;
    }
    
    // Search text filter (search by title only, case-insensitive, partial match)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      if (!matchesTitle) {
        return false;
      }
    }
    
    // Overdue filter
    if (filters.overdueOnly) {
      if (task.status === 'Done') {
        return false;
      }
      if (!task.dueDate) {
        return false;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (task.dueDate >= today) {
        return false;
      }
    }
    
    return true;
  });
};

// Helper to get week start (Monday) and week end (Sunday)
export const getWeekBoundaries = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday is day 1
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
};

// getCompletedThisWeekHours: Returns total hours for tasks completed this week
export const getCompletedThisWeekHours = (tasks) => {
  const { weekStart, weekEnd } = getWeekBoundaries();
  
  return tasks.filter(task => {
    if (task.status !== 'Done' || !task.completedDate) {
      return false;
    }
    return task.completedDate >= weekStart && task.completedDate <= weekEnd;
  }).reduce((total, task) => total + task.estimateHours, 0);
};
