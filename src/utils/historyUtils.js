// History management utilities
// History stores complete board snapshots to support undo/redo with exact state restoration
// Future stack stores redoable states when user has undone actions
// Uses structuredClone() to deep copy tasks, preserving Date objects and exact state

const MAX_HISTORY_LENGTH = 10;

// pushHistory: Adds current state to history, maintains max history length, clears future
export const pushHistory = (history, currentTasks) => {
  // Create deep copy of tasks to preserve exact state (including Date objects)
  const snapshot = structuredClone(currentTasks);
  
  // Add new snapshot to history, keep last MAX_HISTORY_LENGTH items
  const newHistory = [...history, snapshot].slice(-MAX_HISTORY_LENGTH);
  
  // Clear future since new action invalidates redo path
  return { newHistory, newFuture: [] };
};

// undoHistory: Moves last item from history to future, returns previous state
export const undoHistory = (history, currentTasks, future) => {
  if (history.length === 0) {
    return { tasks: currentTasks, history, future };
  }
  
  // Take last history entry as previous state
  const previousTasks = history[history.length - 1];
  // New history is all except last entry
  const newHistory = history.slice(0, -1);
  // New future adds deep copy of current tasks to front
  const newFuture = [structuredClone(currentTasks), ...future];
  
  return { tasks: previousTasks, history: newHistory, future: newFuture };
};

// redoHistory: Moves first item from future to history, returns next state
export const redoHistory = (history, currentTasks, future) => {
  if (future.length === 0) {
    return { tasks: currentTasks, history, future };
  }
  
  // Take first future entry as next state
  const nextTasks = future[0];
  // New future is all except first entry
  const newFuture = future.slice(1);
  // New history adds deep copy of current tasks to end
  const newHistory = [...history, structuredClone(currentTasks)];
  
  return { tasks: nextTasks, history: newHistory, future: newFuture };
};
