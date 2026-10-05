export type PreviewTransport = (
  url: string,
  options: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal: AbortSignal;
  },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
export async function uploadPreview(
  png: string,
  receiver: string,
  token: string,
  transport: PreviewTransport,
  signal: AbortSignal,
) {
  let response;
  try {
    response = await transport(`${receiver.replace(/\/$/, '')}/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ png }),
      signal,
    });
  } catch {
    throw new Error(
      signal.aborted
        ? 'The preview upload timed out. The image is kept for Retry.'
        : 'Could not reach the preview receiver. Check that it is running and the phone and computer are on the same network. The image is kept for Retry.',
    );
  }
  if (!response.ok) {
    const message =
      response.status === 401
        ? 'The pairing tokens do not match. Restart the receiver and fully reload Expo Go after updating .env.local.'
        : response.status === 413
          ? 'This image exceeds the receiver’s 12 MB upload limit.'
          : response.status === 429
            ? 'Another preview is being saved. Wait a moment and retry.'
            : `The receiver could not save the preview (HTTP ${response.status}).`;
    throw new Error(message);
  }
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error('The receiver returned an invalid save confirmation.');
  }
  if (
    !result ||
    typeof result !== 'object' ||
    !('saved' in result) ||
    result.saved !== true
  )
    throw new Error('The receiver did not confirm that the image was saved.');
}
