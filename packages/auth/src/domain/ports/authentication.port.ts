import type { User } from '../models/user.models';

export interface AuthenticationPort {
  authenticateRequest(headers: Record<string, string>): Promise<User | null>;
}
