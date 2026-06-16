// localStorage utilities for board state persistence
// Uses JSON serialization since tasks can contain Date objects which need to be properly handled

const STORAGE_KEY = 'appzeto-sprint-board-state';

// saveBoardState: Saves board state to localStorage
export const saveBoardState = (state) => {
  try {
    // Convert Date objects to ISO strings for serialization
    const serializableState = {
      ...state,
      tasks: state.tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedDate: task.completedDate ? task.completedDate.toISOString() : null
      })),
      originalTasks: state.originalTasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedDate: task.completedDate ? task.completedDate.toISOString() : null
      })),
      history: state.history.map(historyTasks => 
        historyTasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          completedDate: task.completedDate ? task.completedDate.toISOString() : null
        }))
      ),
      future: state.future.map(futureTasks => 
        futureTasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          completedDate: task.completedDate ? task.completedDate.toISOString() : null
        }))
      )
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState));
  } catch (error) {
    console.error('Error saving board state:', error);
  }
};

// loadBoardState: Loads board state from localStorage
export const loadBoardState = () => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return null;
    
    const parsed = JSON.parse(savedState);
    // Convert ISO strings back to Date objects
    return {
      ...parsed,
      tasks: parsed.tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        completedDate: task.completedDate ? new Date(task.completedDate) : null
      })),
      originalTasks: parsed.originalTasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        completedDate: task.completedDate ? new Date(task.completedDate) : null
      })),
      history: parsed.history.map(historyTasks => 
        historyTasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          completedDate: task.completedDate ? new Date(task.completedDate) : null
        }))
      ),
      future: parsed.future.map(futureTasks => 
        futureTasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          completedDate: task.completedDate ? new Date(task.completedDate) : null
        }))
      )
    };
  } catch (error) {
    console.error('Error loading board state:', error);
    return null;
  }
};

// clearBoardState: Clears board state from localStorage
export const clearBoardState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing board state:', error);
  }
};
