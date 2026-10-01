export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];
