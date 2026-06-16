// Constants for the Kanban board
// Centralized place to store all shared constants to avoid magic strings

export const STATUSES = {
  BACKLOG: 'Backlog',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done'
};

export const STATUS_ORDER = [
  STATUSES.BACKLOG,
  STATUSES.IN_PROGRESS,
  STATUSES.REVIEW,
  STATUSES.DONE
];

export const WIP_LIMITS = {
  [STATUSES.IN_PROGRESS]: 5,
  [STATUSES.REVIEW]: 3
};
