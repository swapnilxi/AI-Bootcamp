/**
 * Homepage copy and static data. Edit text here; the section components in
 * src/components/home/ only handle layout and motion.
 */
import type { IconName } from "@/components/ui/Icon";

export const WHATSAPP_INQUIRY_URL =
  "https://wa.me/15551234567?text=Hello%2C%20I%27d%20like%20to%20ask%20about%20the%20AI%20Engineer%20bootcamp";

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */
export const HERO = {
  eyebrow: "AI Engineering School",
  /** Words rise in one at a time; the accent word gets the shimmer. */
  headlineWords: ["Learn", "AI.", "Build", "AI."],
  headlineAccent: "Ship AI.",
  lede:
    "A project-driven path from Python and machine learning through generative AI, RAG and agents to production AI engineering. Every stage ends in something that runs.",
  primaryCta: { href: "/paths", label: "Choose your path" },
  secondaryCta: { href: "/projects", label: "See the projects" },
  stats: [
    { value: 12, suffix: " weeks", label: "To job-ready" },
    { value: 40, suffix: "+", label: "Projects & labs" },
    { text: "AI tutor", label: "Knows where you are" },
  ] as HeroStat[],
};

export type HeroStat = { label: string } & ({ value: number; suffix?: string } | { text: string });

/* ------------------------------------------------------------------ */
/* Skills marquee & positioning statement                              */
/* ------------------------------------------------------------------ */
export const DISCIPLINES = [
  "Machine Learning",
  "Deep Learning",
  "Transformers",
  "Generative AI",
  "RAG & Retrieval",
  "AI Agents",
  "Multi-Agent Systems",
  "AI Evaluation",
  "Production AI",
  "AI Architecture",
];

/** `*word*` renders as an accented italic. */
export const MANIFESTO =
  "Not another course platform. You do not learn AI by *watching* — you learn it by building systems that fail, measuring why, and fixing them until they *ship*.";
export const MANIFESTO_TAGLINE = "Learn · Practise · Build · Evaluate · Ship";

/* ------------------------------------------------------------------ */
/* Learning paths (fallback when the database is unavailable)          */
/* ------------------------------------------------------------------ */
export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  price: number;
  durationMinutes: number;
  category: string;
  iconName: IconName;
}

export const SERVICES_HEADING = {
  eyebrow: "Learning Paths",
  title: "Pick the journey, not the course",
  subtitle:
    "Each path sequences courses, labs, practice and projects into one route with a stated outcome. You always know what comes next, and why it comes next.",
};

export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: "def-1",
    slug: "ai-engineer",
    title: "AI Engineer",
    shortDesc:
      "The full journey: Python and mathematics, machine learning, deep learning, generative AI, RAG, agents and production engineering — ending in a deployed capstone.",
    price: 0,
    durationMinutes: 0,
    category: "PATH",
    iconName: "path",
  },
  {
    id: "def-2",
    slug: "genai-specialist",
    title: "Generative AI Specialist",
    shortDesc:
      "For engineers who already write code: LLM mechanics, prompting, structured output, hybrid retrieval, reranking and the evaluation that keeps it honest.",
    price: 0,
    durationMinutes: 0,
    category: "PATH",
    iconName: "career",
  },
  {
    id: "def-3",
    slug: "agent-engineer",
    title: "AI Agent Engineer",
    shortDesc:
      "Agent architecture end to end: the loop, tool design, memory, planning, multi-agent coordination, and trajectory evaluation for systems loose in production.",
    price: 0,
    durationMinutes: 0,
    category: "PATH",
    iconName: "network",
  },
];

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */
export const PROCESS_HEADING = {
  eyebrow: "How It Works",
  title: "Learn, practise, build, ship",
  subtitle:
    "A loop rather than a playlist. Each pass through it leaves you with something that runs and a measurement that says how well.",
};

export const PROCESS_STEPS = [
  {
    title: "Learn the mechanism",
    body: "Lessons state their objective, their cost in time, and what you should walk away with. Concepts arrive with the example and the failure mode, not just the definition.",
  },
  {
    title: "Practise until it sticks",
    body: "Adaptive practice reads your skill graph and aims at your weak areas. Concept, scenario, debugging and architecture questions — not recall drills.",
  },
  {
    title: "Experiment in the labs",
    body: "Change one variable in the LLM, RAG, Agent, Vision or Evaluation lab and watch the number move. Intuition you cannot get from reading.",
  },
  {
    title: "Build and ship it",
    body: "Real projects with a brief, an architecture and a staged task list. The AI tutor reviews your work and hints — it will not hand you the answer.",
  },
];

/* ------------------------------------------------------------------ */
/* About the school                                                    */
/* ------------------------------------------------------------------ */
export const LINEAGE = {
  eyebrow: "The Approach",
  titleStart: "Built by people who",
  titleAccent: "ship",
  titleEnd: "this for a living",
  paragraphs: [
    "The curriculum is written by engineers who run retrieval systems, agent platforms and evaluation harnesses in production. What you learn here is what survived contact with a real workload.",
    "There is no passive track. Every lesson has a knowledge check, every concept has a lab, every module has something to build, and every path ends in a capstone you can put in front of a hiring panel.",
  ],
  cta: { href: "/bootcamp", label: "See the 12-week bootcamp" },
};

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */
export const TESTIMONIALS_HEADING = {
  eyebrow: "Learner Outcomes",
  title: "What changed for them",
  subtitle: "Engineers who arrived able to call an API and left able to design the system around it.",
};

export const TESTIMONIALS = [
  {
    quote:
      "I had shipped three LLM features before this and could not have told you why any of them worked. The RAG evaluation module was the first time anyone showed me how to measure retrieval instead of eyeballing it.",
    attribution: "Backend Engineer, fintech",
  },
  {
    quote:
      "The agent track is honest in a way most material is not — it spends as much time on when not to use an agent as on how to build one. That judgement is what got me through the system design round.",
    attribution: "Senior Engineer, now AI Platform",
  },
  {
    quote:
      "Weak-area practice found a hole in my understanding of chunking that I would never have gone looking for. Two days of drills and my recall@5 went up eleven points on a real corpus.",
    attribution: "ML Engineer, healthcare",
  },
];

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */
export const FAQ_HEADING = {
  eyebrow: "Questions",
  title: "Before you start",
  subtitle: "What the platform expects of you, and what it gives back.",
};

export const HOME_FAQS = [
  {
    question: "Do I need a machine learning background?",
    answer:
      "No. The AI Engineer path starts at Python and the mathematics models actually use, and builds from there. If you already write code professionally, the Generative AI Specialist path skips the foundations and starts at LLMs.",
  },
  {
    question: "How much of this is video?",
    answer:
      "Very little. Lessons are written, with runnable code and diagrams, because you can search text and copy code out of it. The interactive surfaces — labs, practice, projects and the AI tutor — are where most of the time goes.",
  },
  {
    question: "What does the AI tutor actually do?",
    answer:
      "It knows which lesson, lab or project you are on and what you have struggled with before, so it pitches explanations at your level. Inside coding work it gives progressive hints and reviews what you wrote — it will not hand over a finished solution, because that is the part you are here to learn.",
  },
  {
    question: "What do I have at the end?",
    answer:
      "A deployed capstone — retrieval, a tool-calling agent layer, an evaluation suite, authentication, observability and a frontend — plus the smaller projects behind it. Work you can walk a hiring panel through, not a certificate.",
  },
];
