import type { Email } from '../models';

export interface EmailPort {
  send(message: Email): Promise<void>;
}
