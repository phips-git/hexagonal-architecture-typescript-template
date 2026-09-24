import type { Email } from '../../domain/models';
import type { EmailContentPort } from '../../domain/ports';

export class EmailContentNoopAdapter implements EmailContentPort {
  async generatePasswordReset(
    recipientEmail: string,
    resetLink: string
  ): Promise<Email> {
    return {
      to: recipientEmail,
      subject: 'Password Reset Test',
      html: '<p>Reset password link: {{RESET_LINK}}</p>',
      text: `Reset password link: ${resetLink}`,
      idempotencyKey: `password-reset-${resetLink}`
    };
  }

  async generateEmailVerification(
    recipientEmail: string,
    verificationLink: string
  ): Promise<Email> {
    return {
      to: recipientEmail,
      subject: 'Email Verification Test',
      html: '<p>Verify email link: {{VERIFICATION_LINK}}</p>',
      text: `Verify email link: ${verificationLink}`,
      idempotencyKey: `verification-${verificationLink}`
    };
  }

  async generateTenantInvitation(
    recipientEmail: string,
    tenantName: string,
    inviteLink: string
  ): Promise<Email> {
    return {
      to: recipientEmail,
      subject: `Tenant Invitation Test: ${tenantName}`,
      html: `<p>Join ${tenantName}: {{INVITE_LINK}}</p>`,
      text: `Join ${tenantName}: ${inviteLink}`,
      idempotencyKey: `invitation-${inviteLink}`
    };
  }
}
