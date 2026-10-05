import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadPreview } from '../src/dev/previewUpload.ts';
const signal = new AbortController().signal;
const send = (transport, s = signal) =>
  uploadPreview(
    'test-image',
    'http://receiver:8765/',
    'test-token',
    transport,
    s,
  );
test('preview transport sends a paired PNG and requires an explicit save confirmation', async () => {
  await send(async (url, options) => {
    assert.equal(url, 'http://receiver:8765/preview');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.deepEqual(JSON.parse(options.body), { png: 'test-image' });
    assert.equal(options.signal, signal);
    return { ok: true, status: 201, json: async () => ({ saved: true }) };
  });
  for (const result of [null, {}, { saved: false }, { saved: 'true' }]) {
    await assert.rejects(
      send(async () => ({ ok: true, status: 201, json: async () => result })),
      /did not confirm/,
    );
  }
  await assert.rejects(
    send(async () => ({
      ok: true,
      status: 201,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    })),
    /invalid save confirmation/,
  );
});
test('preview failures distinguish unreachable/timeout, pairing, oversize, busy and save errors', async () => {
  await assert.rejects(
    send(async () => {
      throw new Error('Network request failed');
    }),
    /Could not reach.*kept for Retry/,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    send(async () => {
      throw new Error('Aborted');
    }, controller.signal),
    /timed out.*kept for Retry/,
  );
  for (const [status, match] of [
    [401, /pairing tokens/],
    [413, /12 MB/],
    [429, /Wait a moment/],
    [500, /HTTP 500/],
  ]) {
    await assert.rejects(
      send(async () => ({ ok: false, status, json: async () => ({}) })),
      match,
    );
  }
});
