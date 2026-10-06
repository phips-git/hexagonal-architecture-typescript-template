import type { User } from '../../domain/models';
import type { UserPersistencePort } from '../../domain/ports';

export class NoOpUserPersistenceAdapter implements UserPersistencePort {
  async findById(): Promise<User | null> {
    return null;
  }

  async findByEmail(): Promise<User | null> {
    return null;
  }

  async create(): Promise<User> {
    return null as unknown as User;
  }

  async update(): Promise<User> {
    return null as unknown as User;
  }
}
