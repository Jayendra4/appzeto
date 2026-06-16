import { WIP_LIMITS } from '../constants';


export const canMoveToColumn = (tasks, destinationStatus, taskId) => {
  // If no WIP limit for this status, allow move
  if (!WIP_LIMITS[destinationStatus]) return { allowed: true };
  
  const currentCount = tasks.filter(t => t.status === destinationStatus).length;
  
  
  const isAlreadyInColumn = tasks.some(t => t.id === taskId && t.status === destinationStatus);
  if (isAlreadyInColumn) return { allowed: true };
  
  if (currentCount >= WIP_LIMITS[destinationStatus]) {
    return { 
      allowed: false, 
      message: `Cannot move task. ${destinationStatus} WIP limit (${WIP_LIMITS[destinationStatus]}) reached.` 
    };
  }
  
  return { allowed: true };
};
