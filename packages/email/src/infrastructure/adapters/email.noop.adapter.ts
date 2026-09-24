import type { Email } from '../../domain/models';
import type { EmailPort } from '../../domain/ports';

export class EmailNoopAdapter implements EmailPort {
  private readonly logs: Email[] = [];

  async send(message: Email): Promise<void> {
    this.logs.push(message);
  }

  getSentEmails(): Email[] {
    return [...this.logs];
  }

  reset(): void {
    this.logs.length = 0;
  }
}
