import { STATUSES, STATUS_ORDER } from '../constants';

// parseTaskDate - Handles 3 date formats:
// 1. ISO (2026-06-10)
// 2. DD/MM/YYYY (10/06/2026)
// 3. Month name (June 5, 2026)
export const parseTaskDate = (dateValue) => {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }

  // Check for DD/MM/YYYY format
  const ddMmYyyyMatch = String(dateValue).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddMmYyyyMatch) {
    const day = parseInt(ddMmYyyyMatch[1], 10);
    const month = parseInt(ddMmYyyyMatch[2], 10) - 1; // Months are 0-indexed
    const year = parseInt(ddMmYyyyMatch[3], 10);
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  }

  // Let Date constructor handle ISO and "June 5, 2026" formats
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
};

// cleanTaskData - Main cleaning function
export const cleanTaskData = (rawTasks) => {
  let issuesFixed = 0;
  
  // Step 1: Remove duplicate IDs - keep last occurrence
  // Strategy: Use a Map to track id -> last index, then filter and reverse to preserve order
  const idToLastIndex = new Map();
  rawTasks.forEach((task, index) => {
    idToLastIndex.set(task.id, index);
  });
  
  // Filter to keep only last occurrence of each id
  const dedupedTasks = rawTasks.filter((task, index) => {
    const isLastOccurrence = index === idToLastIndex.get(task.id);
    if (!isLastOccurrence) {
      issuesFixed++; // Count each duplicate removed
    }
    return isLastOccurrence;
  });

  // Step 2: Clean each individual task
  const cleanedTasks = dedupedTasks.map(task => {
    let hasWarning = false;
    
    // Clean assignee
    let assignee = task.assignee;
    const invalidAssignees = [null, undefined, '', 'N/A', 'n/a'];
    if (invalidAssignees.includes(assignee)) {
      assignee = 'Unassigned';
      issuesFixed++;
    }

    // Clean estimateHours
    let estimateHours = task.estimateHours;
    let isEstimateValid = true;
    
    // Parse numeric strings
    if (typeof estimateHours === 'string' && !isNaN(parseFloat(estimateHours)) && isFinite(estimateHours)) {
      estimateHours = parseFloat(estimateHours);
    }
    
    // Check if estimate is invalid (negative or non-numeric)
    if (
      estimateHours === null || 
      estimateHours === undefined || 
      typeof estimateHours !== 'number' || 
      isNaN(estimateHours) || 
      estimateHours < 0
    ) {
      estimateHours = 0;
      issuesFixed++;
      isEstimateValid = false;
    }

    // Clean status
    let status = task.status;
    if (!STATUS_ORDER.includes(status)) {
      status = STATUSES.BACKLOG;
      hasWarning = true;
      issuesFixed++;
    }

    // Parse dates
    const dueDate = parseTaskDate(task.dueDate);
    const completedDate = parseTaskDate(task.completedDate);

    return {
      ...task,
      assignee,
      estimateHours,
      status,
      dueDate,
      completedDate,
      hasWarning
    };
  });

  return {
    cleanedTasks,
    issuesFixed,
    tasksLoaded: cleanedTasks.length
  };
};
