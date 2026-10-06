import type { User, UserId } from '../models';

export interface UserPersistencePort {
  findById(userId: UserId): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  create(user: Omit<User, 'id'>): Promise<User>;

  update(
    userId: UserId,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>
  ): Promise<User>;
}
