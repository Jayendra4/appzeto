import { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import rawTasks from '../data/tasks.json';
import { cleanTaskData } from '../utils/dataCleaner';
import { pushHistory, undoHistory, redoHistory } from '../utils/historyUtils';
import { saveBoardState, loadBoardState, clearBoardState } from '../utils/storage';

// Action types
export const ActionTypes = {
  INITIALIZE_BOARD: 'INITIALIZE_BOARD',
  MOVE_TASK: 'MOVE_TASK',
  REORDER_TASK: 'REORDER_TASK',
  UNDO: 'UNDO',
  REDO: 'REDO',
  SET_FILTERS: 'SET_FILTERS',
  RESET_BOARD: 'RESET_BOARD'
};

// Initial filters state
const initialFilters = {
  assignees: [],
  searchText: '',
  overdueOnly: false
};

// Reducer function
const kanbanReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.INITIALIZE_BOARD: {
      return {
        ...state,
        tasks: action.payload.tasks,
        originalTasks: structuredClone(action.payload.originalTasks),
        issuesFixed: action.payload.issuesFixed,
        tasksLoaded: action.payload.tasksLoaded,
        history: action.payload.history || [],
        future: action.payload.future || [],
        filters: action.payload.filters || initialFilters
      };
    }
    
    case ActionTypes.MOVE_TASK: {
      const { taskId, newStatus } = action.payload;
      
      // Step 1: Create new tasks array with updated status (immutable update)
      const newTasks = state.tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      
      // Step 2: Save current state to history before applying change, clear future
      // This ensures undo can restore exactly as it was before this action
      const { newHistory, newFuture } = pushHistory(state.history, state.tasks);
      
      return {
        ...state,
        tasks: newTasks, // Use our updated tasks
        history: newHistory,
        future: newFuture
      };
    }
    
    case ActionTypes.REORDER_TASK: {
      const { taskId, newIndex, status } = action.payload;
      
      // Step 1: Get all tasks in the target column and reorder them
      const columnTasks = state.tasks.filter(task => task.status === status);
      const taskToReorder = columnTasks.find(task => task.id === taskId);
      if (!taskToReorder) return state;
      
      // Remove task from current position in column and insert at new index
      const filteredColumn = columnTasks.filter(task => task.id !== taskId);
      const reorderedColumn = [
        ...filteredColumn.slice(0, newIndex),
        taskToReorder,
        ...filteredColumn.slice(newIndex)
      ];
      
      // Step 2: Build new global tasks array while preserving order of other columns
      // Strategy:
      // - Iterate through original tasks array
      // - For tasks NOT in target column: keep them in their original position
      // - For tasks IN target column: take them from our reorderedColumn in order
      // This ensures relative order of other columns remains completely unchanged
      let columnPointer = 0;
      const newTasks = state.tasks.map(task => {
        if (task.status !== status) {
          return task;
        }
        // This task is in our target column - take the next task from reorderedColumn
        const reorderedTask = reorderedColumn[columnPointer];
        columnPointer++;
        return reorderedTask;
      });
      
      const { newHistory, newFuture } = pushHistory(state.history, state.tasks);
      return {
        ...state,
        tasks: newTasks,
        history: newHistory,
        future: newFuture
      };
    }
    
    case ActionTypes.UNDO: {
      const { tasks, history, future } = undoHistory(
        state.history,
        state.tasks,
        state.future
      );
      return { ...state, tasks, history, future };
    }
    
    case ActionTypes.REDO: {
      const { tasks, history, future } = redoHistory(
        state.history,
        state.tasks,
        state.future
      );
      return { ...state, tasks, history, future };
    }
    
    case ActionTypes.SET_FILTERS: {
      return {
        ...state,
        filters: { ...state.filters, ...action.payload.filters }
      };
    }
    
    case ActionTypes.RESET_BOARD: {
      // Make deep copy of originalTasks to avoid accidental mutations
      const resetTasks = structuredClone(state.originalTasks);
      return {
        ...state,
        tasks: resetTasks,
        history: [],
        future: [],
        filters: initialFilters
      };
    }
    
    default:
      return state;
  }
};

// Task data model documentation:
// Expected shape of a clean task object:
// {
//   id: string | number - Unique identifier
//   title: string - Task title
//   description: string - Task description
//   status: string - One of Backlog / In Progress / Review / Done
//   assignee: string - Assignee name or "Unassigned"
//   estimateHours: number - Estimated hours (0 if invalid)
//   dueDate: Date | null - Parsed due date
//   completedDate: Date | null - Parsed completed date
//   hasWarning: boolean - True if status was invalid and converted to Backlog
// }

const KanbanContext = createContext(null);

export const KanbanProvider = ({ children }) => {
  // Initial state
  const initialState = useMemo(() => {
    return {
      tasks: [],
      originalTasks: [],
      history: [],
      future: [],
      filters: initialFilters,
      issuesFixed: 0,
      tasksLoaded: 0
    };
  }, []);
  
  const [state, dispatch] = useReducer(kanbanReducer, initialState);
  
  // Initialize board once on mount
  useEffect(() => {
    // Load flow: try to load saved state first, if not present, load cleaned data
    const savedState = loadBoardState();
    if (savedState) {
      dispatch({
        type: ActionTypes.INITIALIZE_BOARD,
        payload: savedState
      });
    } else {
      const cleanedData = cleanTaskData(rawTasks);
      dispatch({
        type: ActionTypes.INITIALIZE_BOARD,
        payload: {
          tasks: cleanedData.cleanedTasks,
          // Make deep copy of cleaned tasks for originalTasks (pristine reference)
          originalTasks: structuredClone(cleanedData.cleanedTasks),
          issuesFixed: cleanedData.issuesFixed,
          tasksLoaded: cleanedData.tasksLoaded
        }
      });
    }
  }, []);
  
  // Save flow: save state whenever tasks, history, future, or filters change
  // Note: we save the entire state so we can restore everything on reload
  useEffect(() => {
    // Only save if tasks are initialized (not empty array) to avoid overwriting with initial state
    if (state.tasks.length > 0 && state.originalTasks.length > 0) {
      saveBoardState(state);
    }
  }, [state.tasks, state.history, state.future, state.filters]);
  
  // Actions creator functions
  const moveTask = (taskId, newStatus) => {
    dispatch({
      type: ActionTypes.MOVE_TASK,
      payload: { taskId, newStatus }
    });
  };
  
  const reorderTask = (taskId, newIndex, status) => {
    dispatch({
      type: ActionTypes.REORDER_TASK,
      payload: { taskId, newIndex, status }
    });
  };
  
  const undo = () => {
    dispatch({ type: ActionTypes.UNDO });
  };
  
  const redo = () => {
    dispatch({ type: ActionTypes.REDO });
  };
  
  const setFilters = (filters) => {
    dispatch({
      type: ActionTypes.SET_FILTERS,
      payload: { filters }
    });
  };
  
  const resetBoard = () => {
    // Clear localStorage first
    clearBoardState();
    dispatch({ type: ActionTypes.RESET_BOARD });
  };
  
  return (
    <KanbanContext.Provider
      value={{
        ...state,
        dispatch,
        moveTask,
        reorderTask,
        undo,
        redo,
        setFilters,
        resetBoard
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
};

// Custom hook to use the Kanban context
export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};
