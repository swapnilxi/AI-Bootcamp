/**
 * Seeds the AI Bootcamp platform.
 *
 * The curriculum itself lives in src/content/curriculum.ts so the catalogue
 * pages and this seed never disagree. This file only turns that data into rows,
 * in dependency order: skills → paths → courses → modules → lessons → practice
 * → labs → projects → bootcamp → mentorship → accounts.
 *
 * Idempotent: every write is an upsert keyed on a natural unique column, so
 * running it twice is safe.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  SKILLS,
  PATHS,
  COURSES,
  LABS,
  PROJECTS,
  PRACTICE,
  BOOTCAMP,
  MENTOR_OFFERINGS,
} from "../src/content/curriculum";

const prisma = new PrismaClient();

/** Everyone in the seed shares this password; it is a development fixture. */
const DEV_PASSWORD = "Bootcamp123!";

async function seedAccounts() {
  const password = await bcrypt.hash(DEV_PASSWORD, 10);

  const people = [
    {
      email: "admin@aibootcamp.dev",
      name: "Platform Admin",
      role: "SUPER_ADMIN" as const,
      bio: "Runs the platform.",
      specialties: "Platform",
    },
    {
      email: "arun@aibootcamp.dev",
      name: "Arun Chauhan",
      role: "INSTRUCTOR" as const,
      avatarUrl: "/instructors/arun-chauhan.svg",
      bio: "Principal AI Architect & Staff Engineer. Specializes in Enterprise RAG, LLM Orchestration, and Production AI Engineering.",
      specialties: "Enterprise RAG, Production AI Systems, Retrieval Evaluation",
      aiGreeting: "Ask me anything about production AI architecture, enterprise retrieval, or LLM engineering at scale.",
      aiSampleQuestions: "How do I design production RAG?|How to evaluate retrieval precision?|How do we prevent hallucinations?",
    },
    {
      email: "swapnil@aibootcamp.dev",
      name: "Swapnil Gupta",
      role: "INSTRUCTOR" as const,
      avatarUrl: "/instructors/swapnil-gupta.svg",
      bio: "Lead Agent Systems Engineer. Specializes in Autonomous AI Agents, Multi-Agent Coordination, and Tool-Calling Workflows.",
      specialties: "Autonomous AI Agents, Multi-Agent Systems, Tool Design, Memory",
      aiGreeting: "Bring me your multi-agent architecture or workflow challenges and we'll engineer rock-solid execution loops.",
      aiSampleQuestions: "How to manage state in multi-agent loops?|Which framework for autonomous workflows?|How to prevent agent deadlocks?",
    },
    {
      email: "shresth@aibootcamp.dev",
      name: "Shresth Sahai",
      role: "INSTRUCTOR" as const,
      avatarUrl: "/instructors/shresth-sahai.svg",
      bio: "Applied Machine Learning Lead & Deep Learning Specialist. Specializes in Foundation Models, Fine-Tuning, and Neural Architectures.",
      specialties: "Deep Learning, Foundation Models, Fine-Tuning, Neural Architectures",
      aiGreeting: "Foundations, model fine-tuning, and neural architectures welcome. Let's build intuition from first principles.",
      aiSampleQuestions: "When should I fine-tune vs RAG?|How to avoid overfitting in small datasets?|How do transformers allocate attention?",
    },
    {
      email: "learner@aibootcamp.dev",
      name: "Sam Rivera",
      role: "USER" as const,
      bio: "Backend engineer moving into AI engineering.",
      specialties: null,
    },
    {
      email: "test@test.com",
      name: "Dev Tester",
      role: "SUPER_ADMIN" as const,
      bio: "Development and testing account with full super-admin access.",
      specialties: "Full-Stack AI Engineering, Architecture, Testing",
      password: "test1234",
    },
  ];

  const users = [];
  for (const p of people) {
    const accountPassword = "password" in p && p.password ? await bcrypt.hash(p.password, 10) : password;
    const avatarUrl = "avatarUrl" in p ? (p as any).avatarUrl : null;
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        name: p.name,
        role: p.role,
        bio: p.bio,
        specialties: p.specialties,
        password: accountPassword,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      create: {
        email: p.email,
        name: p.name,
        password: accountPassword,
        role: p.role,
        bio: p.bio,
        specialties: p.specialties,
        avatarUrl,
        approvalStatus: "APPROVED",
        aiChatEnabled: true,
        aiGreeting: "aiGreeting" in p ? p.aiGreeting : null,
        aiSampleQuestions: "aiSampleQuestions" in p ? p.aiSampleQuestions : null,
      },
    });
    users.push(user);
  }
  console.log(`  ${users.length} accounts`);
  return users;
}

async function seedSkills() {
  // Two passes: every node must exist before any edge can reference it.
  const bySlug = new Map<string, string>();
  for (const [i, s] of SKILLS.entries()) {
    const skill = await prisma.skill.upsert({
      where: { slug: s.slug },
      update: { name: s.name, description: s.description, category: s.category, order: i },
      create: { slug: s.slug, name: s.name, description: s.description, category: s.category, order: i },
    });
    bySlug.set(s.slug, skill.id);
  }

  let edges = 0;
  for (const s of SKILLS) {
    for (const reqSlug of s.requires) {
      const skillId = bySlug.get(s.slug)!;
      const prerequisiteId = bySlug.get(reqSlug);
      if (!prerequisiteId) continue;
      await prisma.skillPrerequisite.upsert({
        where: { skillId_prerequisiteId: { skillId, prerequisiteId } },
        update: {},
        create: { skillId, prerequisiteId },
      });
      edges++;
    }
  }
  console.log(`  ${bySlug.size} skills, ${edges} graph edges`);
  return bySlug;
}

async function seedPaths() {
  const bySlug = new Map<string, string>();
  for (const [i, p] of PATHS.entries()) {
    const path = await prisma.learningPath.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        tagline: p.tagline,
        description: p.description,
        outcome: p.outcome,
        difficulty: p.difficulty,
        estimatedWeeks: p.estimatedWeeks,
        iconName: p.iconName,
        order: i,
      },
      create: {
        slug: p.slug,
        title: p.title,
        tagline: p.tagline,
        description: p.description,
        outcome: p.outcome,
        difficulty: p.difficulty,
        estimatedWeeks: p.estimatedWeeks,
        iconName: p.iconName,
        order: i,
        status: "PUBLISHED",
      },
    });
    bySlug.set(p.slug, path.id);

    // Milestones are replaced wholesale: they have no natural key and are
    // fully derived from the curriculum file.
    await prisma.pathMilestone.deleteMany({ where: { pathId: path.id } });
    await prisma.pathMilestone.createMany({
      data: p.milestones.map((m, order) => ({ pathId: path.id, title: m.title, summary: m.summary, order })),
    });
  }
  console.log(`  ${bySlug.size} learning paths`);
  return bySlug;
}

async function seedCourses(
  pathIds: Map<string, string>,
  skillIds: Map<string, string>,
  instructorIds: string[]
) {
  const bySlug = new Map<string, string>();
  let moduleCount = 0;
  let lessonCount = 0;

  for (const [i, c] of COURSES.entries()) {
    const instructorId = instructorIds[i % instructorIds.length];
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        description: c.description,
        content: c.content,
        kind: c.kind,
        difficulty: c.difficulty,
        estimatedHours: c.estimatedHours,
        objectives: c.objectives,
        technologies: c.technologies,
        prerequisites: c.prerequisites,
        order: i,
        pathId: pathIds.get(c.pathSlug) ?? null,
      },
      create: {
        slug: c.slug,
        title: c.title,
        description: c.description,
        content: c.content,
        kind: c.kind,
        difficulty: c.difficulty,
        estimatedHours: c.estimatedHours,
        objectives: c.objectives,
        technologies: c.technologies,
        prerequisites: c.prerequisites,
        order: i,
        pathId: pathIds.get(c.pathSlug) ?? null,
        instructorId,
        // Courses are self-paced; `schedule` is retained from the booking-era
        // model and simply marks when the course went live.
        schedule: new Date(),
        price: 0,
        isPublished: true,
        approvalStatus: "APPROVED",
      },
    });
    bySlug.set(c.slug, course.id);

    for (const slug of c.skills) {
      const skillId = skillIds.get(slug);
      if (!skillId) continue;
      await prisma.courseSkill.upsert({
        where: { courseId_skillId: { courseId: course.id, skillId } },
        update: {},
        create: { courseId: course.id, skillId },
      });
    }

    // Modules and lessons are rebuilt from the curriculum file each run.
    await prisma.module.deleteMany({ where: { courseId: course.id } });
    await prisma.lesson.deleteMany({ where: { courseId: course.id } });

    let lessonOrder = 0;
    for (const [mi, m] of c.modules.entries()) {
      const mod = await prisma.module.create({
        data: { courseId: course.id, title: m.title, summary: m.summary, order: mi },
      });
      moduleCount++;

      for (const l of m.lessons) {
        const lesson = await prisma.lesson.create({
          data: {
            courseId: course.id,
            moduleId: mod.id,
            title: l.title,
            summary: l.summary,
            objective: l.objective,
            content: l.content,
            difficulty: l.difficulty,
            estimatedMinutes: l.estimatedMinutes,
            durationMinutes: l.estimatedMinutes,
            keyTakeaways: l.keyTakeaways,
            commonMistakes: l.commonMistakes,
            codeExample: l.codeExample ?? null,
            order: lessonOrder++,
            isPreview: lessonOrder === 1,
            approvalStatus: "APPROVED",
          },
        });
        lessonCount++;

        for (const slug of l.skills) {
          const skillId = skillIds.get(slug);
          if (!skillId) continue;
          await prisma.lessonSkill.create({ data: { lessonId: lesson.id, skillId } });
        }
      }
    }
  }
  console.log(`  ${bySlug.size} courses, ${moduleCount} modules, ${lessonCount} lessons`);
  return bySlug;
}

async function seedPractice(skillIds: Map<string, string>) {
  // The practice bank has no natural key, so it is rebuilt each run. Attempts
  // cascade from questions, which is correct for a seed: a reseeded bank has no
  // meaningful history.
  await prisma.practiceAttempt.deleteMany({});
  await prisma.practiceQuestion.deleteMany({});

  for (const q of PRACTICE) {
    await prisma.practiceQuestion.create({
      data: {
        kind: q.kind,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        hint: q.hint ?? null,
        skillId: skillIds.get(q.skillSlug) ?? null,
      },
    });
  }
  console.log(`  ${PRACTICE.length} practice questions`);
}

async function seedLabs() {
  for (const [i, l] of LABS.entries()) {
    await prisma.lab.upsert({
      where: { slug: l.slug },
      update: {
        title: l.title,
        kind: l.kind,
        summary: l.summary,
        description: l.description,
        difficulty: l.difficulty,
        estimatedMinutes: l.estimatedMinutes,
        objectives: l.objectives,
        steps: l.steps,
        parameters: l.parameters,
        order: i,
      },
      create: {
        slug: l.slug,
        title: l.title,
        kind: l.kind,
        summary: l.summary,
        description: l.description,
        difficulty: l.difficulty,
        estimatedMinutes: l.estimatedMinutes,
        objectives: l.objectives,
        steps: l.steps,
        parameters: l.parameters,
        order: i,
        status: "PUBLISHED",
      },
    });
  }
  console.log(`  ${LABS.length} labs`);
}

async function seedProjects(pathIds: Map<string, string>) {
  const bySlug = new Map<string, string>();
  for (const [i, p] of PROJECTS.entries()) {
    const project = await prisma.project.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        summary: p.summary,
        difficulty: p.difficulty,
        problemStatement: p.problemStatement,
        businessContext: p.businessContext,
        architecture: p.architecture,
        requirements: p.requirements,
        techStack: p.techStack,
        tasks: p.tasks,
        estimatedHours: p.estimatedHours,
        isCapstone: p.isCapstone,
        order: i,
        pathId: p.pathSlug ? pathIds.get(p.pathSlug) ?? null : null,
      },
      create: {
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        difficulty: p.difficulty,
        problemStatement: p.problemStatement,
        businessContext: p.businessContext,
        architecture: p.architecture,
        requirements: p.requirements,
        techStack: p.techStack,
        tasks: p.tasks,
        estimatedHours: p.estimatedHours,
        isCapstone: p.isCapstone,
        order: i,
        status: "PUBLISHED",
        pathId: p.pathSlug ? pathIds.get(p.pathSlug) ?? null : null,
      },
    });
    bySlug.set(p.slug, project.id);
  }
  console.log(`  ${bySlug.size} projects`);
  return bySlug;
}

async function seedBootcamp(
  pathIds: Map<string, string>,
  courseIds: Map<string, string>,
  projectIds: Map<string, string>
) {
  const camp = await prisma.bootcamp.upsert({
    where: { slug: BOOTCAMP.slug },
    update: {
      title: BOOTCAMP.title,
      summary: BOOTCAMP.summary,
      description: BOOTCAMP.description,
      durationWeeks: BOOTCAMP.durationWeeks,
      pathId: pathIds.get(BOOTCAMP.pathSlug) ?? null,
    },
    create: {
      slug: BOOTCAMP.slug,
      title: BOOTCAMP.title,
      summary: BOOTCAMP.summary,
      description: BOOTCAMP.description,
      durationWeeks: BOOTCAMP.durationWeeks,
      difficulty: "INTERMEDIATE",
      status: "PUBLISHED",
      pathId: pathIds.get(BOOTCAMP.pathSlug) ?? null,
    },
  });

  for (const w of BOOTCAMP.weeks) {
    await prisma.bootcampWeek.upsert({
      where: { bootcampId_weekNumber: { bootcampId: camp.id, weekNumber: w.weekNumber } },
      update: {
        title: w.title,
        summary: w.summary,
        goals: w.goals,
        milestone: w.milestone,
        courseId: w.courseSlug ? courseIds.get(w.courseSlug) ?? null : null,
        projectId: w.projectSlug ? projectIds.get(w.projectSlug) ?? null : null,
      },
      create: {
        bootcampId: camp.id,
        weekNumber: w.weekNumber,
        title: w.title,
        summary: w.summary,
        goals: w.goals,
        milestone: w.milestone,
        courseId: w.courseSlug ? courseIds.get(w.courseSlug) ?? null : null,
        projectId: w.projectSlug ? projectIds.get(w.projectSlug) ?? null : null,
      },
    });
  }
  console.log(`  1 bootcamp, ${BOOTCAMP.weeks.length} weeks`);
}

async function seedMentorship() {
  for (const o of MENTOR_OFFERINGS) {
    await prisma.service.upsert({
      where: { slug: o.slug },
      update: {
        title: o.title,
        shortDesc: o.shortDesc,
        fullDescription: o.fullDescription,
        durationMinutes: o.durationMinutes,
        price: o.price,
        category: o.category,
        whatIncluded: o.whatIncluded,
        whoIsThisFor: o.whoIsThisFor,
        preparationTips: o.preparationTips,
      },
      create: {
        slug: o.slug,
        title: o.title,
        shortDesc: o.shortDesc,
        fullDescription: o.fullDescription,
        durationMinutes: o.durationMinutes,
        price: o.price,
        category: o.category,
        isActive: true,
        whatIncluded: o.whatIncluded,
        whoIsThisFor: o.whoIsThisFor,
        preparationTips: o.preparationTips,
      },
    });
  }

  // Weekday availability for mentor sessions.
  const existing = await prisma.availabilitySlot.count();
  if (existing === 0) {
    await prisma.availabilitySlot.createMany({
      data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        dayOfWeek,
        startTime: "10:00",
        endTime: "18:00",
        slotDuration: 60,
        isActive: true,
      })),
    });
  }
  console.log(`  ${MENTOR_OFFERINGS.length} mentorship offerings`);
}

/** Gives the demo learner a believable position partway through the path. */
async function seedLearnerProgress(
  learnerId: string,
  pathIds: Map<string, string>,
  skillIds: Map<string, string>
) {
  const pathId = pathIds.get("ai-engineer");
  if (!pathId) return;

  await prisma.pathEnrollment.upsert({
    where: { userId_pathId: { userId: learnerId, pathId } },
    update: {},
    create: { userId: learnerId, pathId },
  });
  await prisma.user.update({
    where: { id: learnerId },
    data: { activePathId: pathId, streakDays: 9, xp: 1840, lastActiveOn: new Date() },
  });

  // Mastered through generative AI, mid-way through RAG, agents not yet open —
  // which is what makes the dashboard's "weak area" recommendation meaningful.
  const standing: [string, "MASTERED" | "IN_PROGRESS" | "AVAILABLE" | "LOCKED", number][] = [
    ["python-for-ai", "MASTERED", 100],
    ["math-for-ml", "MASTERED", 92],
    ["machine-learning", "MASTERED", 88],
    ["deep-learning", "MASTERED", 81],
    ["nlp", "MASTERED", 78],
    ["transformers", "MASTERED", 76],
    ["llms", "MASTERED", 84],
    ["prompt-engineering", "MASTERED", 90],
    ["rag", "IN_PROGRESS", 64],
    ["retrieval-evaluation", "IN_PROGRESS", 31],
    ["computer-vision", "AVAILABLE", 0],
    ["ai-agents", "AVAILABLE", 0],
    ["multi-agent-systems", "LOCKED", 0],
    ["ai-evaluation", "LOCKED", 0],
    ["ai-engineering", "LOCKED", 0],
    ["ai-architecture", "LOCKED", 0],
  ];

  for (const [slug, state, masteryPct] of standing) {
    const skillId = skillIds.get(slug);
    if (!skillId) continue;
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId: learnerId, skillId } },
      update: { state, masteryPct },
      create: { userId: learnerId, skillId, state, masteryPct },
    });
  }
  console.log(`  learner progress for ${standing.length} skills`);
}

async function main() {
  console.log("Seeding AI Bootcamp…");

  const users = await seedAccounts();
  const instructors = users.filter((u) => u.role === "INSTRUCTOR");
  const learner = users.find((u) => u.email === "learner@aibootcamp.dev");

  const skillIds = await seedSkills();
  const pathIds = await seedPaths();
  const courseIds = await seedCourses(
    pathIds,
    skillIds,
    instructors.map((i) => i.id)
  );
  await seedPractice(skillIds);
  await seedLabs();
  const projectIds = await seedProjects(pathIds);
  await seedBootcamp(pathIds, courseIds, projectIds);
  await seedMentorship();
  if (learner) await seedLearnerProgress(learner.id, pathIds, skillIds);

  console.log(`\nDone. Sign in with any seeded email and the password: ${DEV_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
