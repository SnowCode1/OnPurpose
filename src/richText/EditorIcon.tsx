import { editorIconPaths, type EditorIconName } from '../editorIconPaths';

export function EditorIcon({ name }: { name: EditorIconName }) {
  return (
    <svg
      className="editor-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {editorIconPaths[name].map((path, index) => (
        <path key={index} {...path} />
      ))}
    </svg>
  );
}
