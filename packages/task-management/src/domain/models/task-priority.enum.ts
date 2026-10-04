import { createEnumValidator } from '@hexagonal-ts-template/common/domain';

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const isValidTaskPriority = createEnumValidator(TaskPriority);
