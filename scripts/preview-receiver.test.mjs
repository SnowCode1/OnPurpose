import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { once } from 'node:events';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createPreviewReceiver } from './preview-receiver.mjs';

const token = 'preview-test-token-with-at-least-32-characters';
const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

async function receiver(t, directoryOverride) {
  const root = await mkdtemp(join(tmpdir(), 'onpurpose-preview-'));
  const directory = directoryOverride
    ? join(root, 'not-a-directory')
    : join(root, 'previews');
  if (directoryOverride)
    await writeFile(directory, 'file blocks directory creation');
  const server = createPreviewReceiver({ token, directory });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    const closed = once(server, 'close');
    server.close();
    server.closeAllConnections();
    await closed;
    await rm(root, { recursive: true, force: true });
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const post = (body, extraHeaders = {}) =>
    fetch(`${url}/preview`, {
      method: 'POST',
      headers: { ...headers, ...extraHeaders },
      body,
    });
  return { url, headers, post, directory };
}

test('saves a PNG exactly and atomically updates latest while retaining earlier captures', async (t) => {
  const { post, directory } = await receiver(t);
  const first = await post(
    JSON.stringify({ png, filename: '../../escape.png' }),
  );
  assert.equal(first.status, 201);
  const saved = await first.json();
  assert.equal(saved.saved, true);
  assert.match(saved.filename, /^[\w-]+\.png$/);
  assert.deepEqual(
    await readFile(join(directory, saved.filename)),
    Buffer.from(png, 'base64'),
  );
  const second = await post(JSON.stringify({ png }));
  assert.equal(second.status, 201);
  assert.notEqual((await second.json()).filename, saved.filename);
  assert.deepEqual(
    await readFile(join(directory, 'latest.png')),
    Buffer.from(png, 'base64'),
  );
  assert.equal((await readdir(directory)).length, 3);
});

test('rejects missing or incorrect pairing and browser-origin uploads', async (t) => {
  const { post, directory } = await receiver(t);
  for (const headers of [
    { Authorization: '' },
    { Authorization: 'Bearer wrong' },
    { Origin: 'https://example.com' },
  ]) {
    assert.equal((await post(JSON.stringify({ png }), headers)).status, 401);
  }
  await assert.rejects(readdir(directory), { code: 'ENOENT' });
});

test('rejects malformed JSON, non-PNG data, and truncated PNGs without writing files', async (t) => {
  const { post, directory } = await receiver(t);
  for (const body of [
    'broken json',
    'null',
    '{}',
    JSON.stringify({ png: 'not base64' }),
    JSON.stringify({ png: Buffer.from('not an image').toString('base64') }),
    JSON.stringify({
      png: Buffer.from(png, 'base64').subarray(0, 40).toString('base64'),
    }),
  ]) {
    assert.equal((await post(body)).status, 400);
  }
  await assert.rejects(readdir(directory), { code: 'ENOENT' });
});

test('bounds upload size', async (t) => {
  const { post } = await receiver(t);
  assert.equal((await post('x'.repeat(12 * 1024 * 1024 + 1))).status, 413);
});

test('does not expose images or arbitrary routes and requires JSON uploads', async (t) => {
  const { url, headers, post } = await receiver(t);
  assert.equal((await fetch(`${url}/health`, { headers })).status, 200);
  assert.equal((await fetch(`${url}/latest.png`, { headers })).status, 404);
  assert.equal((await post(png, { 'Content-Type': 'text/plain' })).status, 415);
});

test('reports storage failure instead of acknowledging an unsaved image', async (t) => {
  const { post } = await receiver(t, true);
  const response = await post(JSON.stringify({ png }));
  assert.equal(response.status, 500);
  assert.equal((await response.json()).saved, undefined);
});

test('refuses an empty or weak pairing token', () => {
  for (const invalid of [undefined, '', 'short']) {
    assert.throws(
      () => createPreviewReceiver({ token: invalid, directory: tmpdir() }),
      /pairing token/,
    );
  }
});
