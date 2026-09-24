import type { Email } from '../models';

export interface EmailContentPort {
  generatePasswordReset(
    recipientEmail: string,
    resetLink: string
  ): Email | Promise<Email>;

  generateEmailVerification(
    recipientEmail: string,
    verificationLink: string
  ): Email | Promise<Email>;

  generateTenantInvitation(
    recipientEmail: string,
    tenantName: string,
    inviteLink: string
  ): Email | Promise<Email>;
}
