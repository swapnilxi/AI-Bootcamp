import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * The learner snapshot behind the progress dashboard and the AI Tutor.
 *
 * The dashboard has to answer one question immediately — "where am I and what
 * should I do next?" — so this module computes both halves: the standing
 * (skills, streak, counts) and a single recommended next action derived from
 * it, rather than leaving the page to assemble a verdict out of loose numbers.
 */

export type SkillState = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "MASTERED";

export interface SkillNode {
  slug: string;
  name: string;
  description: string;
  category: string;
  state: SkillState;
  masteryPct: number;
  requires: string[];
}

export interface NextAction {
  /** Why this is being recommended, in the learner's terms. */
  reason: string;
  label: string;
  href: string;
  kind: "practice" | "lesson" | "project" | "lab" | "path";
}

export interface LearnerSnapshot {
  signedIn: boolean;
  name: string | null;
  streakDays: number;
  xp: number;
  path: { slug: string; title: string; outcome: string; estimatedWeeks: number } | null;
  pathProgressPct: number;
  skills: SkillNode[];
  mastered: number;
  inProgress: number;
  /** In-progress skills under 50% mastery — what the dashboard calls weak areas. */
  weakAreas: SkillNode[];
  currentSkill: SkillNode | null;
  nextSkill: SkillNode | null;
  lessonsCompleted: number;
  practiceAttempted: number;
  practiceAccuracy: number;
  projectsStarted: number;
  projectsCompleted: number;
  nextAction: NextAction;
}

/** The snapshot shown to a signed-out visitor: an invitation, not an empty state. */
function signedOutSnapshot(skills: SkillNode[]): LearnerSnapshot {
  return {
    signedIn: false,
    name: null,
    streakDays: 0,
    xp: 0,
    path: null,
    pathProgressPct: 0,
    skills,
    mastered: 0,
    inProgress: 0,
    weakAreas: [],
    currentSkill: null,
    nextSkill: skills[0] ?? null,
    lessonsCompleted: 0,
    practiceAttempted: 0,
    practiceAccuracy: 0,
    projectsStarted: 0,
    projectsCompleted: 0,
    nextAction: {
      reason: "You have not started a path yet.",
      label: "Choose a learning path",
      href: "/paths",
      kind: "path",
    },
  };
}

/**
 * Picks the one thing the learner should do next.
 *
 * The order encodes a teaching opinion: shore up a weak area before adding new
 * material, finish what is already open before starting something new, and only
 * then move forward. Each branch names its own reason so the dashboard can show
 * the learner why, not just what.
 */
function chooseNextAction(
  weakAreas: SkillNode[],
  current: SkillNode | null,
  next: SkillNode | null,
  projectsStarted: number
): NextAction {
  const weakest = weakAreas[0];
  if (weakest) {
    return {
      reason: `You are moving through ${weakest.name} but only ${weakest.masteryPct}% of it has stuck.`,
      label: `Practise ${weakest.name}`,
      href: `/practice?skill=${weakest.slug}`,
      kind: "practice",
    };
  }
  if (current) {
    return {
      reason: `${current.name} is in progress at ${current.masteryPct}%.`,
      label: `Continue ${current.name}`,
      href: `/learn?skill=${current.slug}`,
      kind: "lesson",
    };
  }
  if (projectsStarted === 0) {
    return {
      reason: "Your foundations are solid. Reading further will teach you less than building will.",
      label: "Start a project",
      href: "/projects",
      kind: "project",
    };
  }
  if (next) {
    return {
      reason: `${next.name} is unlocked and is the next step on your path.`,
      label: `Start ${next.name}`,
      href: `/learn?skill=${next.slug}`,
      kind: "lesson",
    };
  }
  return {
    reason: "You have cleared the path. The capstone is what turns it into a portfolio.",
    label: "Build the capstone",
    href: "/projects",
    kind: "project",
  };
}

export async function getLearnerSnapshot(userId: string | undefined): Promise<LearnerSnapshot> {
  const allSkills = await prisma.skill.findMany({
    orderBy: { order: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      category: true,
      requires: { select: { prerequisite: { select: { slug: true } } } },
    },
  });

  const baseSkills: SkillNode[] = allSkills.map((s) => ({
    slug: s.slug,
    name: s.name,
    description: s.description,
    category: s.category,
    // Without a learner, only the roots read as open.
    state: s.requires.length === 0 ? "AVAILABLE" : "LOCKED",
    masteryPct: 0,
    requires: s.requires.map((r) => r.prerequisite.slug),
  }));

  if (!userId) return signedOutSnapshot(baseSkills);

  const [user, lessonsCompleted, attempts, correct, submissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        streakDays: true,
        xp: true,
        activePath: { select: { slug: true, title: true, outcome: true, estimatedWeeks: true } },
        skills: { select: { masteryPct: true, state: true, skill: { select: { slug: true } } } },
      },
    }),
    prisma.lessonProgress.count({ where: { userId } }),
    prisma.practiceAttempt.count({ where: { userId } }),
    prisma.practiceAttempt.count({ where: { userId, isCorrect: true } }),
    prisma.projectSubmission.findMany({ where: { userId }, select: { stage: true, submittedAt: true } }),
  ]);

  if (!user) return signedOutSnapshot(baseSkills);

  const standing = new Map(user.skills.map((s) => [s.skill.slug, s]));
  const skills: SkillNode[] = baseSkills.map((s) => {
    const own = standing.get(s.slug);
    return own ? { ...s, state: own.state as SkillState, masteryPct: own.masteryPct } : s;
  });

  const mastered = skills.filter((s) => s.state === "MASTERED");
  const inProgress = skills.filter((s) => s.state === "IN_PROGRESS");
  const weakAreas = inProgress.filter((s) => s.masteryPct < 50).sort((a, b) => a.masteryPct - b.masteryPct);

  // "Current" is the in-progress skill closest to done; "next" is the first
  // thing that has opened up but has not been touched.
  const currentSkill = [...inProgress].sort((a, b) => b.masteryPct - a.masteryPct)[0] ?? null;
  const nextSkill = skills.find((s) => s.state === "AVAILABLE" && s.masteryPct === 0) ?? null;

  const projectsStarted = submissions.length;
  const projectsCompleted = submissions.filter(
    (s) => s.stage === "DEPLOYMENT" && s.submittedAt !== null
  ).length;

  return {
    signedIn: true,
    name: user.name,
    streakDays: user.streakDays,
    xp: user.xp,
    path: user.activePath,
    pathProgressPct: skills.length ? Math.round((mastered.length / skills.length) * 100) : 0,
    skills,
    mastered: mastered.length,
    inProgress: inProgress.length,
    weakAreas,
    currentSkill,
    nextSkill,
    lessonsCompleted,
    practiceAttempted: attempts,
    practiceAccuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
    projectsStarted,
    projectsCompleted,
    nextAction: chooseNextAction(weakAreas, currentSkill, nextSkill, projectsStarted),
  };
}
