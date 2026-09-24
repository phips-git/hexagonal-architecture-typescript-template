import assert from 'node:assert';
import { test } from 'node:test';
import { EmailContentNoopAdapter } from '../email-content.noop.adapter';

test('EmailContentNoopAdapter', async () => {
  const adapter = new EmailContentNoopAdapter();

  await test('generates password reset email', async () => {
    const email = await adapter.generatePasswordReset(
      'user@example.com',
      'https://example.com/reset/abc123'
    );

    assert.strictEqual(email.to, 'user@example.com');
    assert.strictEqual(email.subject, 'Password Reset Test');
    assert.ok(email.html.includes('{{RESET_LINK}}'));
    assert.ok(email.idempotencyKey!.includes('password-reset-'));
  });

  await test('generates email verification email', async () => {
    const email = await adapter.generateEmailVerification(
      'user@example.com',
      'https://example.com/verify/xyz789'
    );

    assert.strictEqual(email.to, 'user@example.com');
    assert.strictEqual(email.subject, 'Email Verification Test');
    assert.ok(email.idempotencyKey!.includes('verification-'));
  });

  await test('generates tenant invitation email', async () => {
    const email = await adapter.generateTenantInvitation(
      'user@example.com',
      'Acme Corp',
      'https://example.com/invite/def456'
    );

    assert.strictEqual(email.to, 'user@example.com');
    assert.ok(email.subject.includes('Acme Corp'));
    assert.ok(email.idempotencyKey!.includes('invitation-'));
  });
});
