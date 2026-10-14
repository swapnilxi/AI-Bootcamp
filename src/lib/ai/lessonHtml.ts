import { z } from "zod/v4";
import { generateStructured } from "./structured";
import type { ResolvedCredential } from "./credentials";
import { BRAND_VOICE } from "./prompts";
import { LESSON_TOKENS_CSS, INTERACTIVE_STYLES, type InteractivityOptions, type LessonContext } from "@/lib/lessons/shared";

export type { LessonVariants, LessonContext } from "@/lib/lessons/shared";

const StandaloneLesson = z.object({
  html: z
    .string()
    .describe(
      "A complete standalone HTML document (<!doctype html> through </html>) for an interactive lesson: inline <style> and <script> only, no external resources, renders in a sandboxed offline iframe."
    ),
});

const FragmentContent = z.object({
  title: z.string(),
  summary: z.string().describe("One sentence describing what this view covers."),
  html: z
    .string()
    .describe("Semantic HTML only (h2/h3, p, ul/li, strong, code) — no <html>/<head>/<body> wrapper, no inline styles, no scripts."),
});

const Breakdown = z.object({
  chunks: z
    .array(z.object({ title: z.string(), html: z.string().describe("Semantic HTML for this chunk, 2-4 sentences or a short list.") }))
    .describe("5-8 micro-chunks, ordered for rapid review"),
});

const Visual = z.object({
  visualType: z.enum(["Architecture Diagram", "Interactive Simulation", "Flowchart & Process", "Data & Metric Visualization", "State Machine"]),
  title: z.string(),
  explanation: z.string().describe("2-3 sentences explaining the visual, the mental model, and how to interact with it."),
  html: z
    .string()
    .describe(
      'A self-contained <div class="lms-visualizer">...</div> using only inline CSS, SVG, canvas and vanilla JS — zero external dependencies, runs sandboxed.'
    ),
});

/** Thrown when the model's response was cut off before producing a complete HTML document (usually hit the token ceiling). */
export class TruncatedGenerationError extends Error {
  constructor() {
    super("The generated lesson was cut off before it finished. Try again, or narrow the topic.");
  }
}

function assertCompleteHtml(html: string): string {
  if (!/<\/html\s*>\s*$/i.test(html.trim())) {
    throw new TruncatedGenerationError();
  }
  return html;
}

function lessonSystemPreamble(ctx: LessonContext): string {
  const track = ctx.projectTrack;
  return `${BRAND_VOICE}

You are writing an interactive, standalone lesson for ${ctx.domainLabel}: ${ctx.domainDescription}.
${ctx.guidance ? `Guidance: ${ctx.guidance}\n` : ""}${
    track
      ? `This lesson is ${track.positionLabel} of an implementation roadmap for the project "${track.projectName}". Scope it to what a learner can implement and verify in about one ~2-hour session, ending with a concrete artifact. Structure around: Goal, Prerequisites, Implementation, Validation, and a "Done When" checklist. The learner's goal for this step: ${track.focus}`
      : ""
  }`;
}

const STYLE_DIRECTION: Record<string, string> = {
  standard: "Editorial lesson: explanation first, interactive checks near the end.",
  guided: "Guided practice: after every concept, give the learner a small exercise to complete before moving on. Never go more than ~2 short paragraphs without something to click, type or answer.",
  handson: "Hands-on lab: minimal theory, then step-by-step tasks the learner performs in the page (editable code, runnable snippets, results shown instantly). Each step has a hint and a reveal-solution button.",
  story: "Scenario-driven: open with a realistic situation and have the learner make decisions that branch the story. Teach each concept at the moment the scenario needs it, and end with a debrief of the choices made.",
};

const ELEMENT_DIRECTION: Record<string, string> = {
  quiz: "Knowledge checks: 3+ multiple-choice questions, instant right/wrong feedback, an explanation for every answer, a running score.",
  fillBlank: "Fill-in-the-blank: input fields inside a sentence or code line, a Check button, per-blank feedback, and a Show answer option.",
  ordering: "Order-the-steps: items the learner reorders with up/down buttons (must work by keyboard and touch, not only drag), a Check button, and feedback on which positions are wrong.",
  matching: "Match-pairs: two columns; click one item then its partner; correct pairs lock in, wrong pairs shake and reset.",
  playground: "Code playground: an editable <textarea> of starter code, a Run button that evaluates it with vanilla JS in the page (use try/catch, show output or errors in an output panel), and a Reset button.",
  simulation: "Live simulation: sliders/toggles/inputs that update an inline SVG or canvas visual and a numeric readout in real time, with a one-line 'what to notice' caption.",
  scenario: "Branching scenario: a decision with 2-3 choices; each reveals a consequence and the next decision; track the path and finish with a summary of what each choice teaches.",
  flashcards: "Flashcards: click-to-flip cards for key terms, 'Got it' / 'Review again' buttons, and a tally; review-again cards return to the deck.",
  reflection: "Reflection prompts: a free-text box, then a 'Compare with an expert answer' button that reveals a model answer.",
  checklist: "Done-when checklist: checkboxes; when all are ticked, show a congratulatory completion message.",
};

/** Appends creator-chosen interactivity requirements to the lesson system prompt. */
function interactivityDirection(options?: InteractivityOptions): string {
  if (!options) return "";
  const style = INTERACTIVE_STYLES.find((s) => s.key === options.style);
  const els = options.elements.map((k) => `- ${ELEMENT_DIRECTION[k]}`).join("\n");
  return `

INTERACTIVITY BRIEF (this overrides the default structure where they conflict):
Format — ${style?.label}: ${STYLE_DIRECTION[options.style]}
${els ? `Include ALL of these interactive elements, woven into the lesson where they teach best (not dumped at the end):\n${els}\n` : ""}${options.notes ? `Creator's note: ${options.notes}\n` : ""}
Interaction rules:
- Everything runs offline in a sandboxed iframe with vanilla JS only. Do NOT use localStorage, cookies, fetch or any network; keep state in memory.
- Add a slim sticky progress bar at the top ("3 of 7 activities done") that updates as the learner completes activities.
- Every activity gives immediate, specific feedback (what was right/wrong and why), lets the learner retry, and is fully keyboard accessible with visible focus states and aria-live feedback regions.
- Use the provided CSS variables for all colors (success/danger for feedback) so light and dark mode both work.
- Keep each activity compact so the whole document still finishes within the output budget.`;
}

/** Prompt 4: the full standalone interactive lesson ("Read" view). */
export async function runLessonRead(credential: ResolvedCredential, ctx: LessonContext, interactivity?: InteractivityOptions): Promise<string> {
  const result = await generateStructured({
    credential,
    schema: StandaloneLesson,
    effort: "high",
    maxTokens: 20000,
    system: `${lessonSystemPreamble(ctx)}

Restrained, editorial, content-first design. Embed this exact :root custom-property block inside your <style>:
${LESSON_TOKENS_CSS}

Structure: header with read time, 3-4 learning objectives, core concepts with analogies, an inline SVG/CSS diagram where it clarifies something, deep dive into edge cases and trade-offs, syntax-highlighted code with a working copy button, a 2+ question interactive quiz with instant feedback, and a closing summary or checklist. Content max-width ~800px, centered.

Budget discipline: you have a finite output budget and MUST finish the document — an unfinished document is worse than a shorter complete one. Keep every code example to at most 10-15 lines (a representative fragment, not a full file or type definitions). If the topic is broad, cover fewer sub-points well rather than many shallowly. Always end with the closing </html> tag.${interactivityDirection(interactivity)}`,
    prompt: `Write the interactive lesson "${ctx.title}".

<source_material>
${ctx.sourceText}
</source_material>

The result must run standalone, offline, with no network calls.`,
  });
  return assertCompleteHtml(result.html);
}

/** Prompt 8: in-place reviser, used by both the "Update" (AI instruction) and "Edit" (direct save) actions. */
export async function runLessonRevise(credential: ResolvedCredential, instruction: string, currentHtml: string): Promise<string> {
  const result = await generateStructured({
    credential,
    schema: StandaloneLesson,
    effort: "medium",
    maxTokens: 20000,
    system: `${BRAND_VOICE}

You are updating an existing interactive HTML lesson according to the learner's instruction. Apply the instruction and change as little else as possible: keep every section, diagram, quiz, script and style the instruction does not touch, exactly as it is. Keep the same visual design, CSS variables and self-contained structure — no external CDNs, scripts must still run in a sandboxed iframe.

Budget discipline: you must reproduce the whole document plus the change within your output budget — an unfinished document is worse than skipping a nice-to-have. If the instruction would make the document too long to finish, trim existing code examples to their essentials rather than leaving the document incomplete. Always end with the closing </html> tag.`,
    prompt: `<instruction>
${instruction}
</instruction>

<current_html>
${currentHtml}
</current_html>`,
  });
  return assertCompleteHtml(result.html);
}

/** Prompt 6: Easy Read. */
export async function runLessonEasyRead(credential: ResolvedCredential, title: string, sourceHtml: string) {
  return generateStructured({
    credential,
    schema: FragmentContent,
    effort: "medium",
    maxTokens: 4000,
    system: `${BRAND_VOICE}

You are an expert technical editor who makes dense material fast to read without removing or dumbing down the substance. Start with a "Key Takeaways" list of 3-6 short bullets, then short sections with bold headings, 1-3 sentence paragraphs, bullet lists over dense prose, and bold key terms. Preserve every distinct technical fact, number and example — restructure, don't summarize away detail.`,
    prompt: `Lesson title: ${title}

<lesson_html>
${sourceHtml}
</lesson_html>`,
  });
}

/** Prompt 7: Explain Deeper. */
export async function runLessonDeeper(credential: ResolvedCredential, title: string, sourceHtml: string) {
  return generateStructured({
    credential,
    schema: FragmentContent,
    effort: "high",
    maxTokens: 4000,
    system: `${BRAND_VOICE}

You write "go deeper" extensions for technical lessons — the reader already understands the lesson below, so extend it with what an intro lesson leaves out: edge cases and failure modes, underlying mechanics or math, production trade-offs, common misconceptions, and connections to more advanced topics. Do not re-explain the basics. Every sentence should teach something new.`,
    prompt: `Lesson title: ${title}

<lesson_html treat="already known">
${sourceHtml}
</lesson_html>`,
  });
}

/** High-signal breakdown: condenses a lesson into 5-8 micro-chunks for rapid review (also powers the Swipe view). */
export async function runLessonBreakdown(credential: ResolvedCredential, title: string, sourceHtml: string) {
  return generateStructured({
    credential,
    schema: Breakdown,
    effort: "medium",
    maxTokens: 3000,
    system: `${BRAND_VOICE}

You condense technical lessons into a small number of high-signal micro-chunks for rapid review or flashcard-style study. Each chunk should be a single, self-contained idea with a short, specific title. Preserve the most important facts, numbers and distinctions — cut everything else.`,
    prompt: `Lesson title: ${title}

<lesson_html>
${sourceHtml}
</lesson_html>`,
  });
}

/** Prompt 5: interactive visual widget. */
export async function runLessonVisualize(credential: ResolvedCredential, ctx: LessonContext, sourceHtml: string) {
  return generateStructured({
    credential,
    schema: Visual,
    effort: "high",
    maxTokens: 4000,
    system: `${BRAND_VOICE}

You are a visual educator and interactive systems engineer. Autonomously choose the best visual medium for this topic (architecture/topology diagram, step-by-step algorithm simulator, loss-landscape or gradient-step canvas, packet/state-machine traversal, or a branching timeline), using only pure HTML, CSS, inline SVG and HTML5 canvas with vanilla JS — zero external dependencies, runs sandboxed. Pick mid-tone colors visible against both dark and light backgrounds.`,
    prompt: `Lesson: ${ctx.title}
Domain: ${ctx.domainLabel}

<lesson_html>
${sourceHtml}
</lesson_html>`,
  });
}
