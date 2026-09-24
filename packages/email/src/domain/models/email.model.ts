export interface Email {
  to: string;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
}
