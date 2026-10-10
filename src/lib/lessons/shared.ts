/**
 * Client-safe pieces of the interactive-lesson experience: types and the HTML
 * wrapper. No AI SDK or Prisma imports here, so client components (the
 * lesson viewer) can import this directly without bundling server code.
 */

export interface LessonVariants {
  easyRead?: { html: string; summary: string; updatedAt: string };
  deeper?: { html: string; summary: string; updatedAt: string };
  breakdown?: { chunks: { title: string; html: string }[]; updatedAt: string };
  visual?: { visualType: string; title: string; explanation: string; html: string; updatedAt: string };
}

export interface LessonContext {
  title: string;
  domainLabel: string;
  domainDescription: string;
  guidance?: string;
  sourceText: string;
  projectTrack?: {
    projectName: string;
    positionLabel: string;
    focus: string;
  };
}

/** The design system every generated or wrapped lesson document shares. */
export const LESSON_TOKENS_CSS = `:root {
  color-scheme: light dark;
  --bg: #f7f3ec; --surface: #fffaf2; --surface-2: #efe7d9;
  --text: #24201b; --text-muted: #71695f;
  --border: rgba(64, 55, 45, 0.14); --border-strong: rgba(64, 55, 45, 0.22);
  --primary: #5b5bd6; --primary-soft: rgba(91, 91, 214, 0.1);
  --secondary: #127c7a; --secondary-soft: rgba(18, 124, 122, 0.1);
  --accent: #b36b17; --accent-soft: rgba(179, 107, 23, 0.12);
  --success: #14845f; --success-soft: rgba(20, 132, 95, 0.12);
  --danger: #c24151; --danger-soft: rgba(194, 65, 81, 0.12);
  --code-bg: #1c1a17; --code-text: #f2ede2; --code-border: rgba(255, 255, 255, 0.08);
  --shadow: 0 1px 2px rgba(36, 32, 27, 0.05), 0 12px 28px -14px rgba(36, 32, 27, 0.2);
  --radius: 14px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #17140f; --surface: #201c16; --surface-2: #2a251d;
    --text: #f4efe7; --text-muted: #b3a696;
    --border: rgba(255, 246, 235, 0.1); --border-strong: rgba(255, 246, 235, 0.16);
    --primary: #9694f5; --primary-soft: rgba(150, 148, 245, 0.14);
    --secondary: #5fc6bd; --secondary-soft: rgba(95, 198, 189, 0.12);
    --accent: #f1ad55; --accent-soft: rgba(241, 173, 85, 0.14);
    --success: #54c79a; --success-soft: rgba(84, 199, 154, 0.14);
    --danger: #fb7185; --danger-soft: rgba(251, 113, 133, 0.14);
    --code-bg: #14110d; --code-text: #f2ede2; --code-border: rgba(255, 255, 255, 0.07);
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 14px 32px -16px rgba(0, 0, 0, 0.6);
  }
}
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.lesson-wrap { max-width: 780px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
h2 { font-size: 1.3rem; margin: 1.75rem 0 0.75rem; }
h3 { font-size: 1.05rem; margin: 1.4rem 0 0.6rem; }
p { margin: 0 0 0.9rem; }
ul, ol { padding-left: 1.3rem; }
li { margin-bottom: 0.4rem; }
strong { color: var(--text); }
code { background: var(--code-bg); color: var(--code-text); border: 1px solid var(--code-border); border-radius: 5px; padding: 0.15em 0.4em; font-size: 0.9em; }
.lms-visualizer, .lms-easy-read, .lms-deeper { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1.5rem; box-shadow: var(--shadow); }`;

/** Wraps a semantic-HTML fragment (easy-read, deeper, breakdown chunk, visual widget) into a standalone document for a sandboxed iframe. */
export function wrapLessonFragment(fragment: string, title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>${LESSON_TOKENS_CSS}</style>
</head>
<body>
<div class="lesson-wrap">${fragment}</div>
</body>
</html>`;
}
