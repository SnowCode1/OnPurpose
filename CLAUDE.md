# Working on OnPurpose

@AGENTS.md

Read [PROJECT_GOALS.md](PROJECT_GOALS.md) before product or architecture work.

Keep this file as the Claude entry point; shared rules belong in AGENTS.md so
Claude and other coding assistants follow the same project goals. The import
above loads AGENTS.md automatically into every Claude Code session.

The client sometimes duplicates prompts. Follow the duplicate-message rule in
AGENTS.md: ignore an already-handled duplicate or acknowledge it minimally; do
not repeat work unless the user explicitly requests a retry.
