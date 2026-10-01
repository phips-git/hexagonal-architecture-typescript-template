export const UserRole = {
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer'
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
