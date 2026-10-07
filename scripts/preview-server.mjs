import { resolve } from 'node:path';
import { createPreviewReceiver } from './preview-receiver.mjs';

if (process.env.EXPO_PUBLIC_DEV_PREVIEW !== 'true') {
  console.error(
    'Preview sharing is off. Set EXPO_PUBLIC_DEV_PREVIEW=true in .env.local.',
  );
  process.exit(1);
}

try {
  const url = new URL(process.env.EXPO_PUBLIC_PREVIEW_URL);
  if (
    url.protocol !== 'http:' ||
    !url.port ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'Use http://YOUR_COMPUTER_LAN_IP:8765 as EXPO_PUBLIC_PREVIEW_URL.',
    );
  }
  const directory = resolve('.dev/previews');
  const server = createPreviewReceiver({
    token: process.env.EXPO_PUBLIC_PREVIEW_TOKEN,
    directory,
    onSaved: (path) =>
      console.log(
        `${path.endsWith('.json') ? 'Timings' : 'Preview'} saved: ${path}`,
      ),
  });
  server.on('error', (error) => {
    console.error(
      `Preview receiver could not start: ${error.code ?? error.message}. Check the LAN IP and port in .env.local.`,
    );
    process.exitCode = 1;
  });
  server.listen(Number(url.port), url.hostname, () => {
    console.log(`Preview receiver ready at ${url.origin}`);
    console.log(`Latest image: ${resolve(directory, 'latest.png')}`);
  });
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => {
      server.close();
      server.closeAllConnections();
    });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
