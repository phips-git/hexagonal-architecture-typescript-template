import assert from 'node:assert';
import { test } from 'node:test';
import type { Email } from '../../../domain/models';
import { EmailNoopAdapter } from '../email.noop.adapter';

test('EmailNoopAdapter', async () => {
  const adapter = new EmailNoopAdapter();

  await test('does not send emails, just logs them', async () => {
    const testEmail: Email = {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML</p>',
      text: 'Test text'
    };

    await adapter.send(testEmail);

    assert.deepStrictEqual(adapter.getSentEmails(), [testEmail]);
  });

  await test('resets logs', async () => {
    await adapter.send({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    });

    adapter.reset();
    assert.deepStrictEqual(adapter.getSentEmails(), []);
  });
});
