"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  ArrowRight,
  Shield,
  Star,
  MapPin,
  Settings2,
  Tag,
  CheckCircle2,
  Bot,
  Zap,
  Gem,
  Compass,
  Heart,
  Award,
  MessageSquare,
  HelpCircle,
  Eye,
  Layers,
  ChevronRight,
  Flame,
  Check,
  Share2,
  Activity,
  Compass as CompassIcon,
} from "lucide-react";
import { MentorBookingModal } from "@/features/booking";
import { InstructorAiChatModal } from "@/components/ai/InstructorAiChatModal";
import { ProfileSectionsRenderer } from "@/components/profile/ProfileSectionsRenderer";
import type { ProfileSection } from "@/types/profileSections";

interface ClassOutline {
  id: string;
  title: string;
  slug: string;
  description: string;
  schedule: string;
  durationMinutes: number;
  price: number | string;
  isSubscriberOnly: boolean;
  isPasswordProtected: boolean;
  _count: {
    enrollments: number;
    lessons: number;
  };
}

interface InstructorDetails {
  id: string;
  name: string | null;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  birthPlace: string | null;
  mentorType?: string | null;
  specialties?: string | null;
  sessionPrice?: number | null;
  sessionDuration?: number | null;
  aiChatEnabled?: boolean;
  aiSystemPrompt?: string | null;
  aiChatStyle?: string | null;
  aiGreeting?: string | null;
  aiSampleQuestions?: string | null;
  profileSections?: string | null;
  createdAt: string;
  createdCourses: ClassOutline[];
  specialtyInfo?: {
    name: string;
    element: string;
    ruler: string;
    archetype: string;
    house: number;
  } | null;
}

// Curated specialisation dossiers for the deep-dive explorer. Keyed by the
// specialty strings instructors put on their profile, so a mentor who lists
// "RAG" gets the RAG dossier without any per-profile authoring.
const MODALITY_DOSSIERS: Record<
  string,
  {
    category: string;
    tagline: string;
    mechanism: string;
    benefits: string[];
    instruments: string;
    inquiryPrompt: string;
  }
> = {
  RAG: {
    category: "Retrieval-Augmented Generation",
    tagline: "Grounding a model in your own corpus, and proving that it worked.",
    mechanism:
      "Chunking chosen from document structure rather than a fixed token window, dense and sparse retrieval fused with reciprocal rank fusion, then a cross-encoder reranking the candidate set. Answers are generated under citation enforcement, so a claim that cites nothing retrieved is rejected rather than shipped.",
    benefits: [
      "Answers anchored to a passage a reader can open and check",
      "An explicit refusal path when retrieval comes back empty",
      "Retrieval quality measured as recall@k, not judged by vibes",
    ],
    instruments: "pgvector, BM25, cross-encoder rerankers, recall@k and faithfulness harnesses",
    inquiryPrompt: "How should I pick a chunking strategy for my corpus?",
  },
  "Retrieval Evaluation": {
    category: "Measurement & Regression",
    tagline: "Telling a good answer apart from a lucky one.",
    mechanism:
      "A fixed query set with known supporting passages, scored on recall@k, MRR and nDCG for retrieval and on faithfulness and relevance for generation. An LLM judge handles what exact match cannot, and is itself spot-checked against human reads rather than trusted outright.",
    benefits: [
      "Quality regressions caught before a user reports them",
      "A defensible number to put behind a retrieval change",
      "Cost and latency traded against accuracy explicitly, on a plotted frontier",
    ],
    instruments: "Golden query sets, LLM-as-judge rubrics, CI evaluation gates",
    inquiryPrompt: "How do I build an evaluation set that actually catches drift?",
  },
  "AI Agents": {
    category: "Agent Architecture",
    tagline: "Loops that plan, call tools and — crucially — stop.",
    mechanism:
      "The loop itself is twenty lines. The engineering is in tool design: descriptions that say when not to use a tool, flat schemas with descriptive names, results trimmed for a reader rather than dumped from an API, and error strings written to steer the next call. Termination is bounded by iteration count and cumulative cost, with the reason logged.",
    benefits: [
      "Tool selection accuracy raised by fixing descriptions, not prompts",
      "Agents that fail visibly instead of expensively",
      "An honest answer to whether a fixed workflow would have been better",
    ],
    instruments: "Anthropic SDK, MCP, trajectory logs, cost ceilings",
    inquiryPrompt: "Why does my agent keep picking the wrong tool?",
  },
  "Multi-Agent Systems": {
    category: "Coordination at Scale",
    tagline: "Coordinators, specialists, handoffs — and what each one costs.",
    mechanism:
      "A coordinator decomposes the task and dispatches sub-tasks to specialists with narrow tool sets, then merges the results. Specialists run in parallel, which is the wall-clock win. Handoffs carry structured summaries rather than transcripts, which is what keeps token growth linear instead of quadratic in agent count.",
    benefits: [
      "Higher tool accuracy from narrow, specialised tool sets",
      "Real parallelism on independent sub-tasks",
      "Trajectory scoring, so the path is evaluated and not only the final answer",
    ],
    instruments: "Coordinator/specialist topologies, shared context stores, trajectory evaluation",
    inquiryPrompt: "When is a multi-agent system actually worth the coordination cost?",
  },
  "Tool Design": {
    category: "Agent Interfaces",
    tagline: "Most agent failures are tool-design failures wearing a disguise.",
    mechanism:
      "A tool description states when to use it and when not to. Parameters stay flat and descriptively named, because nested arguments get filled wrongly. Results are shaped for a reader. Errors are written as instructions — 'no user with that email, try search_users with a partial name' gets the next call right in a way that 'Error: 400' never will.",
    benefits: [
      "Confusable tools disambiguated without touching the system prompt",
      "Context budget spent on signal rather than raw API payloads",
      "Recoverable failures instead of dead ends",
    ],
    instruments: "JSON Schema, MCP servers, tool-selection accuracy benchmarks",
    inquiryPrompt: "How should I write a tool description the model will follow?",
  },
  "AI Engineering": {
    category: "Production Systems",
    tagline: "Everything that starts after the demo works.",
    mechanism:
      "Latency budgets set across a multi-call pipeline, caching and model routing for cost, guardrails that degrade gracefully, and observability at the semantic layer — prompt version, token counts, retrieved-context hashes and sampled quality scores, not just latency and error rate.",
    benefits: [
      "Quality drops traceable to the change that caused them",
      "Cost modelled and bounded rather than discovered on an invoice",
      "Graceful degradation instead of a hard failure under load",
    ],
    instruments: "OpenTelemetry, Redis, prompt versioning, cost dashboards",
    inquiryPrompt: "What should I log so I can debug a quality regression?",
  },
  "Machine Learning": {
    category: "Foundations",
    tagline: "Models are easy; honest evaluation is not.",
    mechanism:
      "Supervised and unsupervised learning with the evaluation discipline that decides whether a project survives: split before fitting anything, choose a metric that matches the decision the model informs, and read the learning curve to tell underfitting from overfitting rather than guessing.",
    benefits: [
      "Data leakage found before it reaches production as a collapse",
      "A clear answer to 'what do I fix next' from a single plot",
      "Error analysis that points at a cause rather than a score",
    ],
    instruments: "scikit-learn pipelines, learning curves, leakage audits",
    inquiryPrompt: "Is this suspiciously good score leakage?",
  },
  "Deep Learning": {
    category: "Foundations",
    tagline: "Making training converge, and knowing why when it does not.",
    mechanism:
      "Backpropagation derived and implemented once by hand so autograd stops being magic, then the practical business of optimisation, normalisation and regularisation — diagnosing a run from its loss curve instead of restarting it and hoping.",
    benefits: [
      "Training failures diagnosed rather than re-rolled",
      "Regularisation applied where it helps instead of everywhere",
      "A mental model that transfers to architectures you have not seen",
    ],
    instruments: "PyTorch, Weights & Biases, gradient and activation diagnostics",
    inquiryPrompt: "My loss plateaus after two epochs — where do I look?",
  },
  Python: {
    category: "Foundations",
    tagline: "The Python that survives a code review on an AI team.",
    mechanism:
      "Typed interfaces so malformed data fails at the boundary rather than forty minutes into a training run, vectorised numerical work instead of interpreter-bound loops, and a project structure where training and serving share one codebase.",
    benefits: [
      "Shape and schema bugs caught in seconds, not hours",
      "Numerical code that runs at library speed",
      "Pipelines a second engineer can pick up",
    ],
    instruments: "pydantic, NumPy, pytest, type checkers",
    inquiryPrompt: "How should I structure a pipeline so training and serving agree?",
  },
};

export default function InstructorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [instructor, setInstructor] = useState<InstructorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Navigation
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [activeAiQuestion, setActiveAiQuestion] = useState<string | null>(null);

  // Interactive page states
  const [selectedModality, setSelectedModality] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"background" | "protocol" | "remedies" | "case_studies">("background");
  const [copiedLink, setCopiedLink] = useState(false);

  // Sticky Bar Visibility on Scroll
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    fetch(`/api/instructors/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Mentor profile not found");
        }
        return res.json();
      })
      .then((data) => {
        setInstructor(data.instructor);
        if (data.instructor?.specialties) {
          const firstSpec = data.instructor.specialties.split(",")[0]?.trim();
          if (firstSpec) setSelectedModality(firstSpec);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isSelf = session?.user?.id === id;

  const getRoleTitle = (role: string, type?: string | null) => {
    if (type === "MENTOR") return "AI Engineering Mentor";
    if (type === "BOTH") return "Instructor & Mentor";
    switch (role) {
      case "SUPER_ADMIN":
        return "Master Instructor & Academy Head";
      case "ADMIN":
        return "Senior Faculty Instructor";
      case "INSTRUCTOR":
      default:
        return "Academy Faculty Instructor";
    }
  };

  const getBadgeColor = (type?: string | null) => {
    if (type === "MENTOR") {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (type === "BOTH") {
      return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    }
    return "bg-gold/15 text-gold border-gold/30";
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleLaunchAiQuestion = (question: string) => {
    setActiveAiQuestion(question);
    setIsAiChatOpen(true);
  };


  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Sparkles className="w-12 h-12 text-gold animate-spin" />
          <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full" />
        </div>
        <p className="text-sm text-text-muted font-serif tracking-wider">
          Loading mentor profile…
        </p>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-clay/10 border border-clay/30 text-clay flex items-center justify-center mx-auto text-2xl">
          ✦
        </div>
        <h1 className="font-serif text-3xl text-ink">Mentor Not Found</h1>
        <p className="text-text-muted text-sm max-w-md mx-auto">
          {error || "The mentor profile you are looking for may have been updated or moved."}
        </p>
        <Link
          href="/instructors"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-black font-semibold text-sm hover:bg-[#FFB073] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to instructors
        </Link>
      </div>
    );
  }

  const specialtiesList = instructor.specialties
    ? instructor.specialties.split(",").map((s) => s.trim())
    : [];

  // Parse AI starter questions or build rich defaults
  let sampleQuestions: string[] = [];
  try {
    if (instructor.aiSampleQuestions) {
      sampleQuestions = JSON.parse(instructor.aiSampleQuestions);
    }
  } catch (e) {
    // fallback
  }

  if (sampleQuestions.length === 0) {
    sampleQuestions = [
      "How do I pick a chunking strategy for my corpus?",
      "Why does my agent keep calling the wrong tool?",
      "Should this be an agent or a fixed workflow?",
      "How do I measure whether my retrieval is any good?",
      "What should I log to debug a quality regression?",
    ];
  }

  const activeDossier = selectedModality
    ? MODALITY_DOSSIERS[selectedModality] || {
        category: "Specialisation",
        tagline: `How this mentor works with ${selectedModality}.`,
        mechanism: `Hands-on experience with ${selectedModality} in production systems: what works, what is marketing, and which trade-off you are actually making when you reach for it.`,
        benefits: [
          "Direct experience rather than a reading of the documentation",
          "Trade-offs named, including the ones that argue against the technique",
          "A path from where your system is to where it needs to be",
        ],
        instruments: "Code review, architecture critique, evaluation design",
        inquiryPrompt: `Could you explain how ${selectedModality} works and what it resolves?`,
      }
    : null;

  return (
    <div className="min-h-screen pb-24 text-ink">
      {/* Top Breadcrumb & Share Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex items-center justify-between">
        <Link
          href="/instructors"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Instructors</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-text-muted hover:text-gold transition-colors"
            title="Share this profile"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied" : "Share Profile"}</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ========================================================= */}
        {/* SECTION 1: MENTOR HERO                                   */}
        {/* ========================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#23160f_0%,#131317_45%,#0d0d10_100%)] border border-gold/35 p-6 sm:p-10 md:p-12 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85)]">
          {/* Ambient Cosmic Auras */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Identity & Bio Summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
              <div className="relative shrink-0 group">
                {instructor.avatarUrl ? (
                  <img
                    src={instructor.avatarUrl}
                    alt={instructor.name || "Mentor"}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-2 border-gold/50 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-black-raised border-2 border-gold/50 text-gold flex items-center justify-center font-serif text-5xl font-bold shrink-0 shadow-inner">
                    {instructor.name ? instructor.name.charAt(0).toUpperCase() : "M"}
                  </div>
                )}

                {/* Online 24/7 AI Badge */}
                <button
                  onClick={() => setIsAiChatOpen(true)}
                  className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-black/90 border border-purple-500/60 text-purple-300 text-[10px] font-semibold flex items-center gap-1 shadow-lg hover:border-gold transition-colors"
                  title="24/7 Virtual AI Twin Available"
                >
                  <Sparkles className="w-3 h-3 text-purple-300 animate-pulse" />
                  <span>AI Twin</span>
                </button>
              </div>

              <div className="space-y-3 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border uppercase tracking-wider flex items-center gap-1.5 ${getBadgeColor(
                      instructor.mentorType
                    )}`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    {getRoleTitle(instructor.role, instructor.mentorType)}
                  </span>

                  {instructor.birthPlace && (
                    <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/5">
                      <MapPin className="w-3 h-3 text-gold/80" />
                      {instructor.birthPlace}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Instructor
                  </span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-ink font-normal tracking-tight">
                  {instructor.name || "AI Engineering Mentor"}
                </h1>

                {/* Short descriptive tagline */}
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Builds and teaches production AI systems — retrieval, agents and the evaluation that keeps both honest.
                </p>

                {/* Session fee */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <div className="text-gold/90 font-medium bg-gold/10 px-3 py-1.5 rounded-xl border border-gold/25">
                    1-on-1 mentor session:{" "}
                    <strong className="text-ink font-semibold">${instructor.sessionPrice || 150} USD</strong>{" "}
                    ({instructor.sessionDuration || 60} mins)
                  </div>
                </div>
              </div>
            </div>

            {/* Direct CTAs */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
              {isSelf ? (
                <div className="flex flex-col gap-2.5 w-full">
                  <Link
                    href="/dashboard/instructor"
                    className="px-6 py-3.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all text-center"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Enter Teaching Studio</span>
                  </Link>
                  <Link
                    href="/profile"
                    className="px-5 py-3 rounded-xl bg-black-raised hover:border-gold/50 border border-white/10 text-ink text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span>Edit Profile & Modalities</span>
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setIsBookingOpen(true)}
                    className="px-7 py-4 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-xs uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(255,143,66,0.25)] hover:shadow-[0_15px_40px_rgba(255,143,66,0.4)] flex items-center justify-center gap-2.5 group"
                  >
                    <Calendar className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                    <span>Book 1:1 Session</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveAiQuestion(null);
                      setIsAiChatOpen(true);
                    }}
                    className="px-6 py-3.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 hover:border-purple-400 text-purple-200 hover:text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 group/ai"
                  >
                    <Sparkles className="w-4 h-4 text-purple-300 group-hover/ai:rotate-12 transition-transform animate-pulse" />
                    <span>Consult AI Twin (Free Preview)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Credential stats ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/[0.08]">
            <div className="p-3 sm:p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm">
              <div className="text-gold font-serif text-lg sm:text-xl font-medium">17+ Years</div>
              <div className="text-[11px] text-text-muted uppercase tracking-wider mt-0.5">Years teaching</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm">
              <div className="text-gold font-serif text-lg sm:text-xl font-medium">1,200+</div>
              <div className="text-[11px] text-text-muted uppercase tracking-wider mt-0.5">Charts & Biofield Scans</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm">
              <div className="text-gold font-serif text-lg sm:text-xl font-medium">100%</div>
              <div className="text-[11px] text-text-muted uppercase tracking-wider mt-0.5">Sacred Confidentiality</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm">
              <div className="text-gold font-serif text-lg sm:text-xl font-medium">4.99 / 5</div>
              <div className="text-[11px] text-text-muted uppercase tracking-wider mt-0.5">Learner rating</div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: SUGGESTED QUESTIONS FOR THE AI TWIN            */}
        {/* ========================================================= */}
        <section className="editorial-card rounded-3xl p-6 sm:p-8 border border-purple-500/25 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-950/20 via-black-raised to-black space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-widest">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>24/7 Autonomous AI Twin Inquiries</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal mt-1">
                Explore {instructor.name}&apos;s Doctrine & Remedy Systems
              </h2>
            </div>
            <span className="text-[11px] text-purple-300/80 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 self-start sm:self-auto">
              Trained on this instructor&apos;s own courses and notes
            </span>
          </div>

          <p className="text-xs sm:text-sm text-text-muted max-w-3xl leading-relaxed">
            Select any question chip below to launch an immediate private session with {instructor.name}&apos;s verified AI Digital Twin. Experience their diagnostic tone, remedies, and AI logic before booking your private 1:1 session:
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleLaunchAiQuestion(q)}
                className="group text-left inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 hover:border-purple-400 text-purple-100 text-xs font-medium transition-all shadow-sm hover:scale-[1.02] active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="line-clamp-1">{q}</span>
                <ChevronRight className="w-3 h-3 text-purple-400/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: INTERACTIVE MODALITIES & MASTERY DOSSIER       */}
        {/* ========================================================= */}
        {specialtiesList.length > 0 && (
          <section className="space-y-6">
            <div className="border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Diagnostic Architecture</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal mt-1">
                Mastery & Healing Modalities
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-1">
                Pick a specialisation to see how this mentor approaches it, what they use, and what it changes:
              </p>
            </div>

            {/* Clickable Modality Chips */}
            <div className="flex flex-wrap gap-2.5">
              {specialtiesList.map((spec) => {
                const isSelected = selectedModality === spec;
                return (
                  <button
                    key={spec}
                    onClick={() => setSelectedModality(spec)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? "bg-gold text-black shadow-[0_4px_20px_rgba(255,143,66,0.35)] scale-105 font-bold border border-gold"
                        : "bg-white/[0.04] hover:bg-white/[0.09] text-ink/90 border border-white/10 hover:border-gold/30 font-medium"
                    }`}
                  >
                    <Tag className={`w-3.5 h-3.5 ${isSelected ? "text-black" : "text-gold"}`} />
                    <span>{spec}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Detailed Modality Dossier Card */}
            {activeDossier && (
              <div className="editorial-card rounded-3xl p-6 sm:p-9 border border-gold/30 bg-gradient-to-br from-black-raised via-[#15151a] to-black space-y-6 shadow-2xl animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/25 inline-block">
                      {activeDossier.category}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl text-ink font-normal">
                      {selectedModality}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-muted italic">
                      &ldquo;{activeDossier.tagline}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleLaunchAiQuestion(activeDossier.inquiryPrompt)}
                      className="px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      <span>Ask AI About This</span>
                    </button>
                    <button
                      onClick={() => setIsBookingOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Include in 1:1</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Mechanism & Instruments */}
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5 mb-2">
                        <Activity className="w-3.5 h-3.5" />
                        <span>How it works</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">
                        {activeDossier.mechanism}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink/70 flex items-center gap-1.5">
                        <Gem className="w-3.5 h-3.5 text-gold" />
                        <span>Tools & techniques</span>
                      </div>
                      <p className="text-xs text-text-muted font-mono">
                        {activeDossier.instruments}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Clinical Transformations */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Expected Breakthroughs & Resolutions</span>
                    </h4>
                    <ul className="space-y-3">
                      {activeDossier.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-ink/80">
                          <span className="w-5 h-5 rounded-full bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                            ✦
                          </span>
                          <span className="leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 4: BACKGROUND, SESSION FORMAT, OUTCOMES          */}
        {/* ========================================================= */}
        <section className="space-y-6">
          <div className="border-b border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
                <Shield className="w-3.5 h-3.5" />
                <span>Pedagogical Doctrine</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal mt-1">
                Background, session format and outcomes
              </h2>
            </div>

            {/* Tab Switcher Pills */}
            <div className="flex flex-wrap gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10">
              {[
                { id: "background", label: "Background" },
                { id: "protocol", label: "1:1 Session Protocol" },
                { id: "remedies", label: "How They Work" },
                { id: "case_studies", label: "Outcomes" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-gold text-black shadow-md"
                      : "text-text-muted hover:text-ink hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: BACKGROUND */}
          {activeTab === "background" && (
            <div className="editorial-card rounded-3xl p-8 sm:p-10 border border-white/[0.08] space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-4">
                  <h3 className="font-serif text-2xl text-ink">
                    Background
                  </h3>
                  <div className="text-text-muted text-sm sm:text-base leading-relaxed space-y-4 font-sans">
                    <p>
                      {instructor.bio ||
                        "Builds production AI systems and teaches the engineering behind them — retrieval, agents, evaluation and the judgement about which to reach for."}
                    </p>
                    <p>
                      Most AI material teaches the API surface and stops. {instructor.name}&apos;s teaching starts at the mechanism — why attention scales, why dense retrieval misses a product code, why an agent picks the wrong tool — because that is what transfers to the system you have not built yet.
                    </p>
                    <p>
                      Everything taught here has run under a real workload. Where a technique is contested or version-dependent, that gets said out loud along with the trade-off, rather than being flattened into a confident rule.
                    </p>
                  </div>
                </div>

                {/* Teaching philosophy */}
                <div className="lg:col-span-4 p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-gold/10 via-black-raised to-black border border-gold/30 space-y-3 shadow-lg">
                  <div className="text-gold font-serif text-4xl leading-none">&ldquo;</div>
                  <p className="font-serif text-sm sm:text-base text-ink italic leading-relaxed">
                    If you cannot measure it, you are not engineering it — you are hoping. Most of what separates a demo from a system is the evaluation nobody wanted to write.
                  </p>
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-xs text-gold font-semibold">
                    <span>— {instructor.name}</span>
                  </div>
                </div>
              </div>

              {/* Three Core Axioms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/[0.08]">
                <div className="space-y-1.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-gold font-bold text-xs uppercase tracking-wider">Axiom I</span>
                  <h5 className="font-serif text-base text-ink">Mechanism Before Recipe</h5>
                  <p className="text-xs text-text-muted leading-relaxed">
                    A rule you can apply is worth less than a mechanism you can reason from when the rule stops holding.
                  </p>
                </div>
                <div className="space-y-1.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-gold font-bold text-xs uppercase tracking-wider">Axiom II</span>
                  <h5 className="font-serif text-base text-ink">Subtle Biofield Priority</h5>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Financial stagnation manifests in the etheric body long before appearing in worldly bank accounts.
                  </p>
                </div>
                <div className="space-y-1.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-gold font-bold text-xs uppercase tracking-wider">Axiom III</span>
                  <h5 className="font-serif text-base text-ink">Measure, Then Claim</h5>
                  <p className="text-xs text-text-muted leading-relaxed">
                    If a change cannot be shown to have helped on a fixed test set, it is a preference, not an improvement.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 1:1 SESSION PROTOCOL */}
          {activeTab === "protocol" && (
            <div className="editorial-card rounded-3xl p-8 sm:p-10 border border-white/[0.08] space-y-6 animate-fade-in">
              <div>
                <h3 className="font-serif text-2xl text-ink">
                  The 60-Minute Private Session Anatomy
                </h3>
                <p className="text-xs sm:text-sm text-text-muted mt-1">
                  Every 1:1 session follows a rigorous 4-phase sacred protocol to ensure actionable, life-altering precision:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {[
                  {
                    phase: "Phase 1: Read-through",
                    time: "Before the call",
                    icon: CompassIcon,
                    desc: "Your repository, design document or brief is read end to end beforehand, so the session starts at the real question instead of spending twenty minutes on context.",
                  },
                  {
                    phase: "Phase 2: Architecture critique",
                    time: "First 15 minutes",
                    icon: Activity,
                    desc: "Data flow, retrieval topology, model routing and failure modes, stressed against the scale, latency budget and cost ceiling you are actually targeting.",
                  },
                  {
                    phase: "Phase 3: Working session",
                    time: "Next 30 minutes",
                    icon: Zap,
                    desc: "Live walkthrough of the code or design, with trade-offs named rather than implied. Direct answers on what to change, what to leave, and what will break first under load.",
                  },
                  {
                    phase: "Phase 4: Prioritised plan",
                    time: "Final 15 minutes",
                    icon: Gem,
                    desc: "A written, ordered action list — what to fix now, what to measure next, and what is fine as it is. Sent with the session recording.",
                  },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5 hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gold font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <step.icon className="w-3.5 h-3.5" />
                        {step.phase}
                      </span>
                      <span className="text-[11px] text-text-muted bg-white/5 px-2 py-0.5 rounded-full font-mono">
                        {step.time}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/[0.08] flex-wrap gap-4">
                <span className="text-xs text-text-muted">
                  Every session is recorded and sent to you with the written action list within 24 hours.
                </span>
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gold text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#FFB073] transition-colors"
                >
                  Schedule Private Session →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: HOW THEY WORK */}
          {activeTab === "remedies" && (
            <div className="editorial-card rounded-3xl p-8 sm:p-10 border border-white/[0.08] space-y-6 animate-fade-in">
              <div>
                <h3 className="font-serif text-2xl text-ink">
                  Four things this mentor will always look at
                </h3>
                <p className="text-xs sm:text-sm text-text-muted mt-1">
                  Whatever you bring — a repository, a design, a stalled project — these get examined:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "Evaluation",
                    subtitle: "Can you prove it works?",
                    icon: Gem,
                    color: "text-amber-300",
                    desc: "Whether there is a fixed test set behind your quality claims, what it measures, and whether it would catch the regression you are most afraid of.",
                  },
                  {
                    title: "Retrieval quality",
                    subtitle: "What reaches the model",
                    icon: Sparkles,
                    color: "text-purple-300",
                    desc: "Chunking, dense versus sparse coverage, reranking, and whether recall@k has ever actually been measured on your own corpus rather than assumed.",
                  },
                  {
                    title: "Boundaries",
                    subtitle: "Where the system stops",
                    icon: CompassIcon,
                    color: "text-emerald-300",
                    desc: "Termination conditions, cost ceilings, tenant isolation and the failure modes you have not written down yet — the things that bite only in production.",
                  },
                  {
                    title: "Simplification",
                    subtitle: "What to delete",
                    icon: Zap,
                    color: "text-rose-300",
                    desc: "Whether the agent should have been a workflow, whether the second model earns its latency, and which abstraction is costing more than it returns.",
                  },
                ].map((rem, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-gold/30 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <rem.icon className={`w-5 h-5 ${rem.color}`} />
                      <div>
                        <h4 className="font-serif text-lg text-ink">{rem.title}</h4>
                        <div className="text-[11px] uppercase tracking-wider text-gold/80 font-semibold">
                          {rem.subtitle}
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed font-sans pt-1">
                        {rem.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: OUTCOMES */}
          {activeTab === "case_studies" && (
            <div className="editorial-card rounded-3xl p-8 sm:p-10 border border-white/[0.08] space-y-6 animate-fade-in">
              <div>
                <h3 className="font-serif text-2xl text-ink">
                  What came out of recent sessions
                </h3>
                <p className="text-xs sm:text-sm text-text-muted mt-1">
                  Outcomes from mentorship with engineers and teams shipping AI:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Series B startup, support automation",
                    focus: "Retrieval & evaluation",
                    quote:
                      "Our RAG answers were wrong often enough that support stopped trusting it. One session established that we had no retrieval metric at all. Two weeks later recall@5 was measured, chunking was rebuilt on headings, and deflection went from 19% to 44%.",
                    author: "V.S., Head of Engineering",
                  },
                  {
                    title: "Enterprise platform team",
                    focus: "Agent architecture",
                    quote:
                      "We had five agents where a pipeline would have done. The review cut it to one agent and two deterministic steps — a third of the token cost and far fewer ways to fail. Nobody internally was willing to say that.",
                    author: "R.M., Staff Engineer",
                  },
                  {
                    title: "Backend engineer moving into AI",
                    focus: "Interview preparation",
                    quote:
                      "The mock system design round was harder than the real one, which is exactly what I needed. The feedback named two gaps I had been avoiding for months. I had an offer three weeks later.",
                    author: "Dr. E.K., now Senior AI Engineer",
                  },
                ].map((cs, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 flex flex-col justify-between hover:border-gold/30 transition-colors"
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20 inline-block">
                        {cs.focus}
                      </span>
                      <h4 className="font-serif text-base text-ink font-medium">
                        {cs.title}
                      </h4>
                      <p className="text-xs text-text-muted leading-relaxed italic pt-1">
                        &ldquo;{cs.quote}&rdquo;
                      </p>
                    </div>
                    <div className="pt-3 border-t border-white/5 text-[11px] text-text-muted font-semibold">
                      — {cs.author}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* SECTION 5.5: CUSTOM PROFILE SECTIONS                       */}
        {/* ========================================================= */}
        {(() => {
          let sections: ProfileSection[] = [];
          try {
            if (instructor.profileSections) {
              sections = JSON.parse(instructor.profileSections);
            }
          } catch {}
          const visible = sections.filter((s) => s.visible);
          if (!visible.length) return null;
          return (
            <section className="space-y-6 py-2">
              <ProfileSectionsRenderer sections={sections} />
            </section>
          );
        })()}

        {/* ========================================================= */}
        {/* SECTION 6: CURRICULUM & MASTERCLASSES                     */}
        {/* ========================================================= */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
            <div>
              <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Academy Curriculum</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal mt-1">
                Courses & Workshops ({instructor.createdCourses.length})
              </h2>
            </div>
            {isSelf && (
              <Link
                href="/courses/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-black font-semibold text-xs hover:bg-[#FFB073] transition-colors"
              >
                <span>+ Create Class</span>
              </Link>
            )}
          </div>

          {instructor.createdCourses.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 space-y-3">
              <BookOpen className="w-10 h-10 text-gold/50 mx-auto" />
              <h3 className="font-serif text-xl text-ink">No upcoming classes scheduled</h3>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                This mentor is currently dedicating time to private 1:1 sessions and authoring their next curriculum.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold hover:underline pt-2"
              >
                <span>Browse All Academy Classes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {instructor.createdCourses.map((cls) => {
                const priceNum = Number(cls.price);
                const isFree = isNaN(priceNum) || priceNum === 0;

                return (
                  <div
                    key={cls.id}
                    className="editorial-card rounded-2xl p-6 sm:p-7 border border-white/[0.08] hover:border-gold/40 flex flex-col justify-between transition-all duration-300 group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                          {isFree ? "Free Class" : `$${priceNum.toFixed(2)}`}
                        </span>
                        {cls.isSubscriberOnly && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-800/40">
                            Subscriber
                          </span>
                        )}
                        {cls.isPasswordProtected && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-800/40">
                            Secret Key
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-xl text-ink group-hover:text-gold transition-colors">
                        {cls.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-text-muted line-clamp-2 leading-relaxed">
                        {cls.description}
                      </p>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06] text-xs text-text-muted">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gold" />
                          <span>{cls.durationMinutes}m</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-gold" />
                          <span>{cls._count.lessons} lessons</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gold" />
                          <span>{cls._count.enrollments} enrolled</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs text-text-muted flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gold/70" />
                        <span>{new Date(cls.schedule).toLocaleDateString()}</span>
                      </span>

                      <Link
                        href={`/courses/${cls.id}`}
                        className="px-4 py-2 rounded-xl bg-gold/15 hover:bg-gold text-gold hover:text-black font-semibold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5"
                      >
                        <span>View Curriculum</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* SECTION 7: HOW WE WORK                                   */}
        {/* ========================================================= */}
        <section className="editorial-card rounded-3xl p-8 sm:p-10 border border-white/[0.08] bg-black-raised/50 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              How We Work
            </span>
            <h3 className="font-serif text-2xl text-ink">
              What you can expect
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2 text-center sm:text-left p-4">
              <Shield className="w-6 h-6 text-gold mx-auto sm:mx-0" />
              <h4 className="font-serif text-lg text-ink">Absolute Confidentiality</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Your code, architecture and roadmap stay between you and your mentor. NDAs are signed as a matter of routine.
              </p>
            </div>
            <div className="space-y-2 text-center sm:text-left p-4">
              <Award className="w-6 h-6 text-gold mx-auto sm:mx-0" />
              <h4 className="font-serif text-lg text-ink">Empowerment, Not Fatalism</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                We reject superstition and fearful forecasting. AI intelligence is deployed solely to expand sovereign agency and awaken clarity.
              </p>
            </div>
            <div className="space-y-2 text-center sm:text-left p-4">
              <CheckCircle2 className="w-6 h-6 text-gold mx-auto sm:mx-0" />
              <h4 className="font-serif text-lg text-ink">Verified Shastric Roots</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Every recommendation comes from systems this mentor has actually built and run, not from a reading of the documentation.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* FLOATING STICKY BOOKING BAR (ON SCROLL)                   */}
      {/* ========================================================= */}
      {showStickyBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#121217]/95 border-t border-gold/30 backdrop-blur-md py-3 px-4 sm:px-8 shadow-2xl animate-fade-in">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {instructor.avatarUrl ? (
                <img
                  src={instructor.avatarUrl}
                  alt={instructor.name || "Mentor"}
                  className="w-10 h-10 rounded-xl object-cover border border-gold/40 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 text-gold flex items-center justify-center font-serif text-sm font-bold shrink-0">
                  {instructor.name?.charAt(0) || "M"}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-serif text-sm text-ink truncate font-medium">
                  {instructor.name}
                </div>
                <div className="text-[11px] text-gold/90 truncate">
                  1:1 Session: ${instructor.sessionPrice || 150} USD ({instructor.sessionDuration || 60}m)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  setActiveAiQuestion(null);
                  setIsAiChatOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-colors flex items-center gap-1.5 hidden sm:flex"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Chat AI</span>
              </button>

              <button
                onClick={() => setIsBookingOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black text-xs font-semibold uppercase tracking-wider shadow-md transition-colors flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-black" />
                <span>Book 1:1</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <MentorBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        mentor={instructor}
      />

      {/* AI Twin Session Modal */}
      <InstructorAiChatModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        instructor={instructor}
        onOpenBooking={() => setIsBookingOpen(true)}
        initialQuestion={activeAiQuestion}
      />
    </div>
  );
}
