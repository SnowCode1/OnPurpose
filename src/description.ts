import MarkdownIt from 'markdown-it/browser';

export const MAX_DESCRIPTION_LENGTH = 20000;
export function normalizeDescription(value: string): string | undefined {
  return value.trim() ? value.replace(/\r\n?/g, '\n') : undefined;
}
export function validDescription(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= MAX_DESCRIPTION_LENGTH
  );
}
// Remote resources never load merely by reading a note. Links open on a tap.
export function descriptionLink(value: string): string | null {
  const trimmed = value.trim();
  if (
    /\s/.test(trimmed) ||
    [...trimmed].some((character) => character.charCodeAt(0) < 32)
  )
    return null;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed)?.[1]?.toLowerCase();
  if (
    !scheme ||
    ['javascript', 'vbscript', 'data', 'file', 'content', 'intent'].includes(
      scheme,
    )
  )
    return null;
  if (
    (scheme === 'http' || scheme === 'https') &&
    !/^https?:\/\/[^/\s]+/i.test(trimmed)
  )
    return null;
  return trimmed;
}
const parser = new MarkdownIt({ html: false, linkify: true, breaks: true });
parser.validateLink = (value: string) => descriptionLink(value) !== null;
parser.disable(['table']);
export const parseDescription = (text: string) => parser.parse(text, {});
export type DescriptionToken = ReturnType<typeof parseDescription>[number];
export function descriptionSummary(text: string): string {
  return parseDescription(text)
    .filter((token) => token.type === 'inline')
    .map((token) =>
      (token.children ?? [])
        .map((child) =>
          child.type === 'text' ||
          child.type === 'code_inline' ||
          child.type === 'image'
            ? child.content
            : child.type === 'softbreak' || child.type === 'hardbreak'
              ? ' '
              : '',
        )
        .join(''),
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function descriptionPreview(text: string, expanded: boolean) {
  const tokens = parseDescription(text);
  if (expanded) return { tokens, truncated: false };
  // Keep complete blocks (and complete lists) so collapsing preserves Markdown.
  let end = 0,
    depth = 0,
    blocks = 0;
  for (let index = 0; index < tokens.length; index++) {
    depth += tokens[index].nesting;
    if (
      depth === 0 &&
      (tokens[index].nesting === -1 || tokens[index].nesting === 0)
    ) {
      blocks++;
      if (blocks <= 2) end = index + 1;
      else break;
    }
  }
  const selected = tokens.slice(0, end || tokens.length);
  const contentLength = selected.reduce(
    (sum, token) => sum + token.content.length,
    0,
  );
  // A long single paragraph/list must also stay bounded on the stats page.
  return {
    tokens: selected,
    truncated: end < tokens.length || contentLength > 360,
  };
}
export function insertDescriptionMarkup(
  text: string,
  selection: { start: number; end: number },
  kind: 'bold' | 'list' | 'link',
) {
  const start = Math.max(0, Math.min(text.length, selection.start));
  const end = Math.max(start, Math.min(text.length, selection.end));
  const selected = text.slice(start, end);
  const insertion =
    kind === 'bold'
      ? `**${selected || 'text'}**`
      : kind === 'list'
        ? `${start > 0 && text[start - 1] !== '\n' ? '\n' : ''}- ${selected || 'item'}`
        : `[${selected || 'link title'}](https://)`;
  const cursorStart =
    kind === 'bold'
      ? start + 2
      : kind === 'link'
        ? start + (selected || 'link title').length + 3
        : start + insertion.length - (selected || 'item').length;
  const cursorEnd =
    kind === 'link'
      ? cursorStart + 8
      : cursorStart + (selected || (kind === 'bold' ? 'text' : 'item')).length;
  return {
    text: text.slice(0, start) + insertion + text.slice(end),
    selection: { start: cursorStart, end: cursorEnd },
  };
}
