/**
 * The AI curriculum, as plain data.
 *
 * This file is the single source of truth for the seed (prisma/seed.ts) and for
 * the static fallbacks the catalogue pages render when the database is
 * unavailable. Editing the curriculum means editing this file; nothing else
 * hard-codes a course, lab or project.
 */

export type DifficultyName = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRODUCTION";
export type LabKindName = "LLM" | "RAG" | "AGENT" | "MULTI_AGENT" | "VISION" | "EVALUATION";
export type CourseKindName =
  | "FOUNDATION"
  | "TECHNICAL"
  | "DEEP_DIVE"
  | "PROJECT"
  | "CRASH"
  | "INTERVIEW"
  | "ARCHITECTURE"
  | "CAREER";

/* ------------------------------------------------------------------ */
/* Skill graph                                                         */
/*  Nodes are listed in dependency order; `requires` names the slugs a  */
/*  node depends on, which is what the graph draws its edges from.      */
/* ------------------------------------------------------------------ */
export interface SkillSeed {
  slug: string;
  name: string;
  description: string;
  category: "Core" | "ML" | "GenAI" | "Agents" | "Engineering";
  requires: string[];
}

export const SKILLS: SkillSeed[] = [
  {
    slug: "python-for-ai",
    name: "Python for AI",
    description: "Typed, tested Python: data structures, async, packaging, and the numerical stack.",
    category: "Core",
    requires: [],
  },
  {
    slug: "math-for-ml",
    name: "Mathematics for ML",
    description: "Linear algebra, calculus and probability, only as far as models actually use them.",
    category: "Core",
    requires: [],
  },
  {
    slug: "machine-learning",
    name: "Machine Learning",
    description: "Supervised and unsupervised learning, feature engineering, and honest evaluation.",
    category: "ML",
    requires: ["python-for-ai", "math-for-ml"],
  },
  {
    slug: "deep-learning",
    name: "Deep Learning",
    description: "Backpropagation, optimisation, regularisation, and training networks that converge.",
    category: "ML",
    requires: ["machine-learning"],
  },
  {
    slug: "computer-vision",
    name: "Computer Vision",
    description: "Convolutions, detection, segmentation and modern vision transformers.",
    category: "ML",
    requires: ["deep-learning"],
  },
  {
    slug: "nlp",
    name: "Natural Language Processing",
    description: "Tokenisation, embeddings, attention, and the path from n-grams to transformers.",
    category: "ML",
    requires: ["deep-learning"],
  },
  {
    slug: "transformers",
    name: "Transformers",
    description: "Self-attention, positional encoding, and why the architecture scales.",
    category: "GenAI",
    requires: ["nlp"],
  },
  {
    slug: "llms",
    name: "Large Language Models",
    description: "Pretraining, instruction tuning, context windows, sampling and tool use.",
    category: "GenAI",
    requires: ["transformers"],
  },
  {
    slug: "prompt-engineering",
    name: "Prompt Engineering",
    description: "System prompts, structured output, few-shot design and failure analysis.",
    category: "GenAI",
    requires: ["llms"],
  },
  {
    slug: "rag",
    name: "Retrieval-Augmented Generation",
    description: "Chunking, embeddings, vector and hybrid search, reranking, and grounded answers.",
    category: "GenAI",
    requires: ["llms"],
  },
  {
    slug: "retrieval-evaluation",
    name: "Retrieval Evaluation",
    description: "Recall@k, MRR, nDCG, faithfulness and the difference between a good answer and a lucky one.",
    category: "GenAI",
    requires: ["rag"],
  },
  {
    slug: "ai-agents",
    name: "AI Agents",
    description: "Tool calling, memory, planning loops, and knowing when an agent is the wrong answer.",
    category: "Agents",
    requires: ["prompt-engineering", "rag"],
  },
  {
    slug: "multi-agent-systems",
    name: "Multi-Agent Systems",
    description: "Coordinators, specialists, handoffs, shared context and termination conditions.",
    category: "Agents",
    requires: ["ai-agents"],
  },
  {
    slug: "ai-evaluation",
    name: "AI Evaluation",
    description: "Offline and online evals, LLM-as-judge, regression suites, cost and latency budgets.",
    category: "Engineering",
    requires: ["ai-agents"],
  },
  {
    slug: "ai-engineering",
    name: "AI Engineering",
    description: "Serving, caching, streaming, observability, guardrails and cost control in production.",
    category: "Engineering",
    requires: ["ai-evaluation"],
  },
  {
    slug: "ai-architecture",
    name: "AI Architecture",
    description: "Designing AI systems at scale: data flow, retrieval topology, model routing, failure modes.",
    category: "Engineering",
    requires: ["ai-engineering", "multi-agent-systems"],
  },
];

/* ------------------------------------------------------------------ */
/* Learning paths                                                      */
/* ------------------------------------------------------------------ */
export interface PathSeed {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  outcome: string;
  difficulty: DifficultyName;
  estimatedWeeks: number;
  iconName: string;
  milestones: { title: string; summary: string }[];
}

export const PATHS: PathSeed[] = [
  {
    slug: "ai-engineer",
    title: "AI Engineer",
    tagline: "Learn AI. Build AI. Ship AI.",
    description:
      "The full journey from Python and mathematics through machine learning, deep learning and generative AI to RAG, agents and production AI engineering. Every stage ends in something that runs.",
    outcome:
      "Design, build, evaluate and deploy a production AI application — retrieval, tool-calling agents, evaluation harness, observability and all.",
    difficulty: "BEGINNER",
    estimatedWeeks: 12,
    iconName: "path",
    milestones: [
      { title: "Foundations hold", summary: "Python, the numerical stack and the mathematics models actually use." },
      { title: "First model shipped", summary: "A trained, evaluated model with an honest error analysis behind it." },
      { title: "Generative systems", summary: "LLM applications with structured output and grounded retrieval." },
      { title: "Agents that act", summary: "Tool-calling agents and multi-agent workflows with real termination conditions." },
      { title: "Production capstone", summary: "A deployed AI application with evaluation, guardrails and cost control." },
    ],
  },
  {
    slug: "genai-specialist",
    title: "Generative AI Specialist",
    tagline: "From prompt to production RAG.",
    description:
      "A focused track for engineers who already write code and want depth in LLMs, prompting, retrieval and evaluation without re-deriving backpropagation first.",
    outcome:
      "Build and evaluate grounded LLM systems: structured output, hybrid retrieval, reranking and a regression suite that catches drift.",
    difficulty: "INTERMEDIATE",
    estimatedWeeks: 8,
    iconName: "spark",
    milestones: [
      { title: "LLM fluency", summary: "Context, sampling, structured output and tool calling under control." },
      { title: "Retrieval that holds up", summary: "Chunking, hybrid search and reranking measured, not guessed." },
      { title: "Evaluated, not hoped", summary: "Faithfulness, relevance and latency tracked across releases." },
    ],
  },
  {
    slug: "agent-engineer",
    title: "AI Agent Engineer",
    tagline: "Systems that plan, call tools and hand off.",
    description:
      "Agent architecture end to end: the loop, tool design, memory, planning, multi-agent coordination, and the evaluation that keeps an agent honest once it is loose in production.",
    outcome:
      "Ship a multi-agent system with a coordinator, specialist agents, shared context, handoffs and a working evaluation harness.",
    difficulty: "ADVANCED",
    estimatedWeeks: 10,
    iconName: "agent",
    milestones: [
      { title: "The loop", summary: "A single agent with tools, memory and a termination condition that holds." },
      { title: "Coordination", summary: "Specialists, handoffs and shared context across a team of agents." },
      { title: "Agent evaluation", summary: "Trajectory scoring, cost ceilings and failure-mode regression tests." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Courses                                                             */
/* ------------------------------------------------------------------ */
export interface LessonSeed {
  title: string;
  summary: string;
  objective: string;
  content: string;
  difficulty: DifficultyName;
  estimatedMinutes: number;
  keyTakeaways: string[];
  commonMistakes: string[];
  codeExample?: string;
  skills: string[];
}

export interface ModuleSeed {
  title: string;
  summary: string;
  lessons: LessonSeed[];
}

export interface CourseSeed {
  slug: string;
  title: string;
  description: string;
  content: string;
  kind: CourseKindName;
  difficulty: DifficultyName;
  estimatedHours: number;
  pathSlug: string;
  objectives: string[];
  technologies: string[];
  prerequisites: string[];
  skills: string[];
  modules: ModuleSeed[];
}

export const COURSES: CourseSeed[] = [
  {
    slug: "python-for-ai",
    title: "Python for AI",
    description:
      "The Python an AI engineer actually writes: typed, tested, async where it matters, and fluent in the numerical stack.",
    content:
      "A working foundation rather than a language tour. You will write the kind of Python that survives a code review on an AI team — typed interfaces, tested transforms, and NumPy that does not loop when it should vectorise.",
    kind: "FOUNDATION",
    difficulty: "BEGINNER",
    estimatedHours: 8,
    pathSlug: "ai-engineer",
    objectives: [
      "Write typed Python that a team can maintain",
      "Vectorise numerical work instead of looping",
      "Structure a project so training and serving share one codebase",
    ],
    technologies: ["Python", "NumPy", "pandas", "pytest", "pydantic"],
    prerequisites: ["Basic programming in any language"],
    skills: ["python-for-ai"],
    modules: [
      {
        title: "Foundations",
        summary: "The language features that matter for AI work, and the ones that do not.",
        lessons: [
          {
            title: "Types, Dataclasses and Pydantic",
            summary: "Make the shape of your data explicit so errors surface at the boundary, not in training.",
            objective: "Model an AI pipeline's inputs and outputs with types that fail loudly and early.",
            content:
              "Untyped Python is where AI pipelines go to die quietly. A malformed record flows through three transforms and surfaces as a shape mismatch in a loss function, forty minutes into a training run.\n\nThe fix is to make shape explicit at the boundary. `dataclass` gives you a typed record with almost no ceremony. Pydantic goes further and validates at construction, which is what you want wherever data arrives from outside your process — an API response, a JSONL file, a model's structured output.\n\nThe rule of thumb: dataclasses for data you created, Pydantic for data you received.",
            difficulty: "BEGINNER",
            estimatedMinutes: 18,
            keyTakeaways: [
              "Validate at the boundary; trust the interior",
              "Dataclasses for internal records, Pydantic for external input",
              "A type error at parse time costs seconds; the same error in a training loop costs an hour",
            ],
            commonMistakes: [
              "Passing raw dicts between pipeline stages and discovering the schema by debugging",
              "Validating the same record repeatedly in every function instead of once at the edge",
            ],
            codeExample:
              "from pydantic import BaseModel, Field\n\nclass Document(BaseModel):\n    id: str\n    text: str = Field(min_length=1)\n    source: str\n    tokens: int | None = None\n\n# Fails here, with a readable message — not 300 lines later.\ndoc = Document.model_validate(raw_json)",
            skills: ["python-for-ai"],
          },
          {
            title: "Vectorisation and the NumPy Mental Model",
            summary: "Why the loop you just wrote is 200× slower than the array operation that replaces it.",
            objective: "Recognise loop-shaped code and rewrite it as array operations.",
            content:
              "NumPy is not 'Python lists but faster'. It is a different execution model: you describe an operation over a whole array and it runs in compiled code, once, over contiguous memory.\n\nThe cost of a Python loop is not arithmetic, it is interpreter overhead per element — attribute lookups, bounds checks, boxing. Vectorising removes the per-element interpreter cost entirely.\n\nBroadcasting is the part people skip and then fight for months. The rule is mechanical: align shapes from the right, and a dimension is compatible if it matches or is 1.",
            difficulty: "BEGINNER",
            estimatedMinutes: 22,
            keyTakeaways: [
              "A Python loop over an array is almost always the wrong answer",
              "Broadcasting aligns from the rightmost dimension",
              "Shape bugs are easier to find than slow code — assert shapes early",
            ],
            commonMistakes: [
              "Using `np.append` in a loop, which reallocates the whole array every iteration",
              "Relying on broadcasting silently doing the right thing instead of asserting the shape you expect",
            ],
            codeExample:
              "import numpy as np\n\n# Cosine similarity of one query against 100k documents.\nq = query_vec / np.linalg.norm(query_vec)          # (768,)\nD = doc_matrix / np.linalg.norm(doc_matrix, axis=1, keepdims=True)  # (100000, 768)\nscores = D @ q                                     # (100000,) — one call\n\nassert scores.shape == (D.shape[0],)",
            skills: ["python-for-ai"],
          },
        ],
      },
    ],
  },
  {
    slug: "machine-learning-foundations",
    title: "Machine Learning Foundations",
    description:
      "Supervised and unsupervised learning with the evaluation discipline that separates a working model from a lucky one.",
    content:
      "Models are easy; honest evaluation is not. This course spends as much time on leakage, baselines and error analysis as on fitting, because that is where real projects actually fail.",
    kind: "TECHNICAL",
    difficulty: "BEGINNER",
    estimatedHours: 12,
    pathSlug: "ai-engineer",
    objectives: [
      "Train and tune supervised models without leaking the test set",
      "Choose a metric that matches the decision the model informs",
      "Run an error analysis that tells you what to fix next",
    ],
    technologies: ["scikit-learn", "pandas", "NumPy", "matplotlib"],
    prerequisites: ["Python for AI"],
    skills: ["machine-learning", "math-for-ml"],
    modules: [
      {
        title: "Learning and Generalisation",
        summary: "Why a model that fits the training set perfectly is usually worthless.",
        lessons: [
          {
            title: "The Bias–Variance Trade-off, Concretely",
            summary: "Underfitting and overfitting as two measurable failure modes, not a diagram.",
            objective: "Diagnose whether a model is underfitting or overfitting from its learning curve alone.",
            content:
              "Bias and variance are usually taught as a picture of darts on a board, which is memorable and useless at the keyboard.\n\nThe operational version: plot training error and validation error against training-set size. If both are high and close together, you are underfitting — the model cannot represent the pattern, so more data will not help. If training error is low and validation error is much higher, you are overfitting — the model memorised, so more data or more regularisation will help.\n\nThis single plot tells you which lever to reach for, which is the whole point.",
            difficulty: "BEGINNER",
            estimatedMinutes: 20,
            keyTakeaways: [
              "High train error + high val error → underfit; more data will not save you",
              "Low train error + high val error → overfit; more data or regularisation will",
              "The learning curve answers 'what do I do next' faster than any single score",
            ],
            commonMistakes: [
              "Adding model capacity to fix a variance problem, which makes it worse",
              "Reading a single accuracy number and concluding nothing about which failure mode you are in",
            ],
            skills: ["machine-learning"],
          },
          {
            title: "Data Leakage: The Bug That Flatters You",
            summary: "Every suspiciously good result deserves a leakage hunt before it deserves a celebration.",
            objective: "Identify and eliminate the four common leakage paths in a tabular pipeline.",
            content:
              "Leakage is when information that will not exist at prediction time leaks into training. It produces excellent offline numbers and a model that collapses in production, which makes it the most expensive bug in applied ML.\n\nFour paths cover most of it. Fitting a scaler or imputer on the full dataset before splitting. Target encoding computed across folds. Time-series split randomly, so the model trains on the future. And a feature that is downstream of the label — an `account_closed_date` predicting churn.\n\nThe defence is mechanical: split first, fit every transform inside the training fold only, and for each feature ask when its value is actually known.",
            difficulty: "INTERMEDIATE",
            estimatedMinutes: 24,
            keyTakeaways: [
              "Split before you fit anything, including scalers and imputers",
              "For time series, split by time — never at random",
              "For every feature, ask: would I know this at prediction time?",
            ],
            commonMistakes: [
              "Calling `fit_transform` on the whole dataset and splitting afterwards",
              "Treating an unusually high score as success rather than as a symptom",
            ],
            codeExample:
              "from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.model_selection import cross_val_score\n\n# The scaler is fitted inside each fold, so no test statistics leak in.\npipe = Pipeline([(\"scale\", StandardScaler()), (\"clf\", model)])\nscores = cross_val_score(pipe, X, y, cv=5)",
            skills: ["machine-learning"],
          },
        ],
      },
    ],
  },
  {
    slug: "deep-learning",
    title: "Deep Learning",
    description:
      "Backpropagation, optimisation and regularisation — enough to train a network that converges and know why when it does not.",
    content:
      "Built around the training loop. You will implement backpropagation once by hand so the framework stops being magic, then spend the rest of the course on the practical business of making training converge.",
    kind: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    estimatedHours: 14,
    pathSlug: "ai-engineer",
    objectives: [
      "Derive and implement backpropagation for a small network",
      "Diagnose a training run from its loss curve",
      "Apply regularisation and normalisation where they actually help",
    ],
    technologies: ["PyTorch", "NumPy", "Weights & Biases"],
    prerequisites: ["Machine Learning Foundations"],
    skills: ["deep-learning"],
    modules: [
      {
        title: "The Training Loop",
        summary: "Forward, loss, backward, step — and everything that goes wrong in between.",
        lessons: [
          {
            title: "Backpropagation From Scratch",
            summary: "One manual implementation, after which autograd stops being mysterious.",
            objective: "Implement forward and backward passes for a two-layer network without a framework.",
            content:
              "Backpropagation is the chain rule applied to a computation graph, bookkept carefully. Writing it once by hand is worth more than reading it ten times.\n\nThe forward pass stores what the backward pass needs. The backward pass walks the graph in reverse, multiplying local gradients. Every framework's autograd is this, generalised and optimised.\n\nThe insight people miss: gradients flow backwards through the same structure the activations flowed forward through. If the forward pass is a chain of matrix multiplies, the backward pass is a chain of transposed matrix multiplies.",
            difficulty: "INTERMEDIATE",
            estimatedMinutes: 35,
            keyTakeaways: [
              "Autograd is the chain rule plus bookkeeping — nothing more",
              "The forward pass must cache what the backward pass consumes",
              "A transposed weight matrix is how the gradient travels back a layer",
            ],
            commonMistakes: [
              "Forgetting to zero gradients between steps, so they silently accumulate",
              "Mixing up the batch dimension and summing gradients along the wrong axis",
            ],
            codeExample:
              "# Backward pass for z = W @ x + b, given dL/dz\ndW = dz @ x.T            # (out, in)\ndb = dz.sum(axis=1)      # (out,)\ndx = W.T @ dz            # (in,) — the gradient continues backwards",
            skills: ["deep-learning"],
          },
        ],
      },
    ],
  },
  {
    slug: "generative-ai-llms",
    title: "Generative AI & LLMs",
    description:
      "How large language models work, and how to drive them: context, sampling, structured output and tool calling.",
    content:
      "The course that turns an API key into engineering. Attention and pretraining first, so the behaviour you see at the API has a mechanism behind it, then the practical craft of prompting, structured output and tool use.",
    kind: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    estimatedHours: 12,
    pathSlug: "ai-engineer",
    objectives: [
      "Explain self-attention and why transformers scale",
      "Get reliable structured output from a model",
      "Design a tool interface a model can actually call correctly",
    ],
    technologies: ["Anthropic API", "Claude", "Python", "pydantic", "JSON Schema"],
    prerequisites: ["Deep Learning"],
    skills: ["transformers", "llms", "prompt-engineering"],
    modules: [
      {
        title: "Mechanism",
        summary: "Attention, context and sampling — the three things that explain most model behaviour.",
        lessons: [
          {
            title: "Self-Attention, Step by Step",
            summary: "Queries, keys and values as a soft lookup table the model learns to query.",
            objective: "Trace a single attention head end to end and explain what each projection is for.",
            content:
              "Attention is a differentiable lookup. Every token emits a query (what am I looking for), a key (what do I offer) and a value (what I will contribute if chosen).\n\nScores are query·key, scaled by the square root of the head dimension to keep the softmax out of its saturated region. Softmax turns scores into weights. The output is the weighted sum of values.\n\nThat is the whole mechanism. Multi-head attention runs several of these in parallel with different projections, so one head can track syntax while another tracks coreference. The scaling factor is the part most people forget, and without it, gradients vanish as dimension grows.",
            difficulty: "INTERMEDIATE",
            estimatedMinutes: 30,
            keyTakeaways: [
              "Attention is a soft, learned lookup over the sequence",
              "The √d scaling keeps softmax gradients alive as head dimension grows",
              "Heads specialise because their projections differ, not because anything forces them to",
            ],
            commonMistakes: [
              "Dropping the √d scaling and wondering why deep models stop training",
              "Reading attention weights as explanations — they are a routing mechanism, not a rationale",
            ],
            codeExample:
              "import torch, math\n\ndef attention(Q, K, V, mask=None):\n    d_k = Q.size(-1)\n    scores = Q @ K.transpose(-2, -1) / math.sqrt(d_k)\n    if mask is not None:\n        scores = scores.masked_fill(mask == 0, float(\"-inf\"))\n    return torch.softmax(scores, dim=-1) @ V",
            skills: ["transformers", "llms"],
          },
          {
            title: "Structured Output That Does Not Break",
            summary: "Getting JSON out of a model reliably enough to put a parser behind it.",
            objective: "Design a schema and prompt that produce parseable output on the first attempt.",
            content:
              "Asking a model for JSON and hoping is not an architecture. Three things make structured output reliable.\n\nFirst, use the provider's structured-output or tool-calling facility rather than prose instructions — constrained decoding beats pleading. Second, keep the schema shallow and name fields descriptively; a model fills `customer_sentiment` more reliably than `field3`. Third, always parse defensively and have a retry path that feeds the parse error back to the model.\n\nThe failure mode to design against is not malformed JSON, which is rare with constrained decoding. It is well-formed JSON with a plausible, wrong value — which is why schema validation and business-rule validation are different jobs.",
            difficulty: "INTERMEDIATE",
            estimatedMinutes: 25,
            keyTakeaways: [
              "Use tool calling or structured output, not prose instructions, to constrain shape",
              "Descriptive field names measurably improve fill accuracy",
              "Schema-valid does not mean correct — validate business rules separately",
            ],
            commonMistakes: [
              "Regex-extracting JSON from prose instead of using the structured-output API",
              "Treating a successful parse as a successful answer",
            ],
            skills: ["prompt-engineering", "llms"],
          },
        ],
      },
    ],
  },
  {
    slug: "rag-systems",
    title: "RAG Systems",
    description:
      "Retrieval-augmented generation that holds up: chunking, embeddings, hybrid search, reranking and measured quality.",
    content:
      "Most RAG demos work and most RAG systems do not. The difference is retrieval quality, and retrieval quality is measurable. This course builds the pipeline and the evaluation harness together.",
    kind: "DEEP_DIVE",
    difficulty: "INTERMEDIATE",
    estimatedHours: 14,
    pathSlug: "ai-engineer",
    objectives: [
      "Choose a chunking strategy from the document structure, not from a blog post",
      "Combine dense and sparse retrieval and know when each wins",
      "Measure retrieval with recall@k and answers with faithfulness",
    ],
    technologies: ["Claude", "pgvector", "BM25", "sentence-transformers", "Python"],
    prerequisites: ["Generative AI & LLMs"],
    skills: ["rag", "retrieval-evaluation"],
    modules: [
      {
        title: "Retrieval",
        summary: "Everything upstream of the model, which is where RAG quality is actually decided.",
        lessons: [
          {
            title: "Chunking Is a Retrieval Decision",
            summary: "Chunk size trades recall against precision, and the document structure should pick for you.",
            objective: "Select a chunking strategy for a given corpus and justify it against the retrieval metric.",
            content:
              "Chunking is usually treated as preprocessing. It is actually the first retrieval decision, and often the most consequential.\n\nSmall chunks embed precisely — the vector represents one idea, so similarity is meaningful — but they fragment context, and the model receives a passage that answers half the question. Large chunks preserve context but their embedding is an average of several ideas, so it matches everything weakly and nothing strongly.\n\nThe structure of the corpus should decide. Prose with headings chunks on headings. Code chunks on function boundaries. Tables do not chunk at all — they get summarised and indexed by their summary, with the full table retrieved alongside.",
            difficulty: "INTERMEDIATE",
            estimatedMinutes: 28,
            keyTakeaways: [
              "Small chunks: precise embeddings, fragmented context",
              "Large chunks: intact context, diluted embeddings",
              "Chunk on the document's own structure before reaching for a fixed token count",
            ],
            commonMistakes: [
              "Copying a 512-token fixed window across every corpus regardless of structure",
              "Chunking without overlap, so answers that straddle a boundary become unreachable",
            ],
            skills: ["rag"],
          },
          {
            title: "Hybrid Search and Reranking",
            summary: "Dense retrieval misses exact terms; sparse retrieval misses paraphrase. Use both, then rerank.",
            objective: "Build a hybrid retriever with reciprocal rank fusion and a cross-encoder reranker.",
            content:
              "Dense retrieval matches meaning, which is why it finds a paraphrase and misses a product code. Sparse retrieval (BM25) matches terms, which is why it finds the product code and misses the paraphrase. Production systems run both.\n\nFusing them is simpler than it sounds. Reciprocal rank fusion ignores the incomparable scores and uses rank alone: each document scores the sum of 1/(k + rank) across retrievers. It needs no tuning and is hard to beat.\n\nReranking then fixes what fusion cannot. A cross-encoder reads query and document together rather than embedding them separately, which is far more accurate and far too slow for the whole corpus — so it reranks the top 50 into the top 5.",
            difficulty: "ADVANCED",
            estimatedMinutes: 32,
            keyTakeaways: [
              "Dense finds meaning, sparse finds exact terms — production needs both",
              "Reciprocal rank fusion combines retrievers without score calibration",
              "A cross-encoder reranker is the highest-leverage addition to most RAG pipelines",
            ],
            commonMistakes: [
              "Normalising and averaging raw scores from different retrievers, which are not comparable",
              "Reranking the whole corpus instead of a candidate set, then wondering about latency",
            ],
            codeExample:
              "def rrf(rankings: list[list[str]], k: int = 60) -> list[str]:\n    \"\"\"Reciprocal rank fusion: rank-based, so scores need no calibration.\"\"\"\n    scores: dict[str, float] = {}\n    for ranking in rankings:\n        for rank, doc_id in enumerate(ranking, start=1):\n            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)\n    return sorted(scores, key=scores.get, reverse=True)",
            skills: ["rag", "retrieval-evaluation"],
          },
        ],
      },
    ],
  },
  {
    slug: "ai-agents",
    title: "AI Agents",
    description:
      "The agent loop, tool design, memory and planning — plus the judgement to know when a workflow beats an agent.",
    content:
      "Agents are a control-flow pattern, not a product category. This course builds one from first principles, then spends real time on tool design and termination, which is where agents fail in practice.",
    kind: "DEEP_DIVE",
    difficulty: "ADVANCED",
    estimatedHours: 16,
    pathSlug: "ai-engineer",
    objectives: [
      "Implement an agent loop with tool calling and a termination condition",
      "Design tool interfaces a model uses correctly without coaxing",
      "Decide between a fixed workflow and an agent on evidence",
    ],
    technologies: ["Claude", "Anthropic SDK", "Python", "MCP"],
    prerequisites: ["RAG Systems"],
    skills: ["ai-agents"],
    modules: [
      {
        title: "The Loop",
        summary: "Plan, call, observe, repeat — and stop.",
        lessons: [
          {
            title: "Anatomy of an Agent Loop",
            summary: "Twenty lines of control flow around a model that can call tools.",
            objective: "Write an agent loop with tool dispatch, result feedback and a bounded termination condition.",
            content:
              "An agent is a loop. The model receives the conversation plus tool definitions, and either returns a final answer or requests a tool call. If it requests a call, you execute it, append the result, and loop.\n\nThat is genuinely all of it. The engineering is not in the loop — it is in everything around it: what tools exist, how their results are shaped, and when you stop.\n\nTermination deserves more care than it usually gets. A loop bounded only by 'the model said it is done' will occasionally not finish. Bound it by iteration count and by cumulative token or dollar cost, and surface which bound was hit so a stuck agent is visible rather than merely expensive.",
            difficulty: "ADVANCED",
            estimatedMinutes: 30,
            keyTakeaways: [
              "The agent loop is trivial; tool design and termination are not",
              "Always bound iterations and cost, not just the model's own judgement",
              "Log which termination condition fired — it is your main debugging signal",
            ],
            commonMistakes: [
              "Looping until the model stops asking for tools, with no ceiling",
              "Returning raw API payloads as tool results, burning context on noise",
            ],
            codeExample:
              "def run_agent(client, messages, tools, max_steps=10, max_cost=1.00):\n    cost = 0.0\n    for step in range(max_steps):\n        resp = client.messages.create(model=MODEL, messages=messages, tools=tools)\n        cost += estimate_cost(resp)\n        if cost > max_cost:\n            return Stopped(reason=\"cost\", step=step)\n        if resp.stop_reason != \"tool_use\":\n            return Done(resp)\n        messages.append({\"role\": \"assistant\", \"content\": resp.content})\n        messages.append({\"role\": \"user\", \"content\": dispatch(resp)})\n    return Stopped(reason=\"max_steps\", step=max_steps)",
            skills: ["ai-agents"],
          },
          {
            title: "Designing Tools a Model Can Use",
            summary: "Most agent failures are tool-design failures wearing a disguise.",
            objective: "Write a tool definition whose description, schema and errors steer correct use.",
            content:
              "When an agent misbehaves, the instinct is to rewrite the system prompt. Usually the tool is at fault.\n\nA good tool has a description that says when to use it and when not to. It has a flat parameter schema with descriptive names, because deeply nested arguments get filled wrongly. It returns results shaped for a reader, not for a machine — a trimmed, relevant payload beats the full API response, which simply burns context.\n\nAnd its errors are instructions. `Error: 400` teaches a model nothing. `No user found with that email. Try search_users with a partial name instead.` gets the next call right. Error messages are part of the interface.",
            difficulty: "ADVANCED",
            estimatedMinutes: 26,
            keyTakeaways: [
              "Tool descriptions should state when NOT to use the tool",
              "Flat schemas with descriptive names beat nested ones",
              "Error strings are prompts — write them to steer the next call",
            ],
            commonMistakes: [
              "Exposing an existing REST endpoint unchanged as a tool",
              "Returning entire API responses and exhausting the context window",
            ],
            skills: ["ai-agents"],
          },
        ],
      },
    ],
  },
  {
    slug: "multi-agent-systems",
    title: "Multi-Agent Systems",
    description:
      "Coordinators, specialists, handoffs and shared context — and an honest account of when one agent would have been enough.",
    content:
      "Multi-agent systems trade simplicity for parallelism and specialisation. This course covers the topologies that work, the coordination costs that bite, and how to evaluate a system whose output is a trajectory rather than a string.",
    kind: "ARCHITECTURE",
    difficulty: "ADVANCED",
    estimatedHours: 14,
    pathSlug: "agent-engineer",
    objectives: [
      "Choose a topology — coordinator, pipeline or blackboard — on the evidence",
      "Pass context between agents without quadratic token growth",
      "Evaluate a multi-agent trajectory, not just its final answer",
    ],
    technologies: ["Claude", "Anthropic SDK", "Python", "MCP"],
    prerequisites: ["AI Agents"],
    skills: ["multi-agent-systems"],
    modules: [
      {
        title: "Coordination",
        summary: "The patterns, and what each one costs.",
        lessons: [
          {
            title: "Coordinator and Specialists",
            summary: "One agent that decomposes and delegates, several that do one thing well.",
            objective: "Implement a coordinator that fans work out to specialists and merges their results.",
            content:
              "The most useful multi-agent topology is also the simplest. A coordinator decomposes the task and dispatches sub-tasks to specialists; each specialist has a narrow tool set and a narrow brief; the coordinator merges the results.\n\nIt wins for two reasons. Specialists have small, relevant tool sets, so tool selection accuracy goes up. And independent sub-tasks run in parallel, so wall-clock time goes down.\n\nIt costs context. Every handoff re-states the problem, so naive implementations grow tokens quadratically with agent count. The discipline is to pass summaries, not transcripts — each specialist receives the brief it needs and returns a result, not its reasoning.",
            difficulty: "ADVANCED",
            estimatedMinutes: 30,
            keyTakeaways: [
              "Narrow tool sets make specialists more accurate than one generalist",
              "Parallel sub-tasks are the main wall-clock win",
              "Pass summaries between agents; transcripts grow cost quadratically",
            ],
            commonMistakes: [
              "Forwarding the full conversation to every specialist",
              "Using multiple agents where a fixed pipeline would have been cheaper and more reliable",
            ],
            skills: ["multi-agent-systems"],
          },
        ],
      },
    ],
  },
  {
    slug: "production-ai-engineering",
    title: "Production AI Engineering",
    description:
      "Serving, streaming, caching, observability, guardrails and cost control — the work that starts after the demo.",
    content:
      "Everything between a notebook that works and a system on call. Latency budgets, cache strategy, structured logging of model calls, guardrails, graceful degradation and the cost model that keeps finance calm.",
    kind: "TECHNICAL",
    difficulty: "PRODUCTION",
    estimatedHours: 16,
    pathSlug: "ai-engineer",
    objectives: [
      "Set and defend a latency budget across a multi-call pipeline",
      "Instrument model calls so a regression is visible before a user reports it",
      "Control cost with caching, routing and token discipline",
    ],
    technologies: ["Claude", "Redis", "OpenTelemetry", "PostgreSQL", "Docker"],
    prerequisites: ["AI Agents"],
    skills: ["ai-engineering", "ai-evaluation"],
    modules: [
      {
        title: "Running It",
        summary: "Observability, cost and the failure modes that only appear under load.",
        lessons: [
          {
            title: "Observability for LLM Systems",
            summary: "What to log so that 'the answers got worse' becomes a debuggable claim.",
            objective: "Instrument a pipeline so quality regressions are traceable to a change.",
            content:
              "Traditional observability tracks latency, errors and throughput. An LLM system can be green on all three while producing steadily worse answers.\n\nSo log the semantic layer too. For every model call: prompt version, model id, token counts in and out, latency, cost, tool calls made, and a stable hash of the retrieved context. Then sample outputs and score them continuously, rather than only at release.\n\nPrompt version is the one people skip and regret. Without it, 'quality dropped on Tuesday' cannot be tied to the prompt edit that shipped on Tuesday, and you are reduced to guessing.",
            difficulty: "PRODUCTION",
            estimatedMinutes: 28,
            keyTakeaways: [
              "Green latency and error rates tell you nothing about answer quality",
              "Version prompts and log the version with every call",
              "Sample and score continuously — release-time evaluation finds drift too late",
            ],
            commonMistakes: [
              "Logging only the final answer, so a bad retrieval is indistinguishable from a bad generation",
              "Treating prompts as config rather than as versioned, reviewable code",
            ],
            skills: ["ai-engineering"],
          },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* AI Labs                                                             */
/* ------------------------------------------------------------------ */
export interface LabSeed {
  slug: string;
  title: string;
  kind: LabKindName;
  summary: string;
  description: string;
  difficulty: DifficultyName;
  estimatedMinutes: number;
  objectives: string[];
  steps: { title: string; detail: string }[];
  /** Knobs the lab exposes. The lab UI renders controls from this. */
  parameters: { name: string; label: string; type: "slider" | "select" | "text"; min?: number; max?: number; step?: number; options?: string[]; default: string | number }[];
}

export const LABS: LabSeed[] = [
  {
    slug: "llm-lab",
    title: "LLM Lab",
    kind: "LLM",
    summary: "Turn the knobs on a live model and watch the output distribution move.",
    description:
      "Temperature, top-p, system prompts and structured output, with the same prompt re-run as you change one variable at a time. The point is to build intuition for which knob does what before you tune one in production.",
    difficulty: "BEGINNER",
    estimatedMinutes: 25,
    objectives: [
      "Predict the effect of temperature before changing it",
      "Write a system prompt that changes behaviour, not just tone",
      "Force structured output and observe where it fails",
    ],
    steps: [
      { title: "Baseline", detail: "Run the default prompt three times at temperature 0 and confirm the output is stable." },
      { title: "Raise temperature", detail: "Re-run at 1.0. Note where variation appears — usually word choice before structure." },
      { title: "Add a system prompt", detail: "Constrain the persona and format. Observe how much of the variation disappears." },
      { title: "Force a schema", detail: "Switch on structured output and try to break it with an ambiguous input." },
    ],
    parameters: [
      { name: "temperature", label: "Temperature", type: "slider", min: 0, max: 1, step: 0.1, default: 0.7 },
      { name: "maxTokens", label: "Max tokens", type: "slider", min: 64, max: 2048, step: 64, default: 512 },
      { name: "systemPrompt", label: "System prompt", type: "text", default: "You are a precise technical assistant." },
    ],
  },
  {
    slug: "rag-lab",
    title: "RAG Lab",
    kind: "RAG",
    summary: "Chunk, embed, retrieve and rerank over a real corpus, measuring each change.",
    description:
      "The full retrieval pipeline with every stage exposed. Change chunk size and watch recall@5 move; switch dense to hybrid and see which queries flip; add a reranker and measure what it buys.",
    difficulty: "INTERMEDIATE",
    estimatedMinutes: 40,
    objectives: [
      "Measure the effect of chunk size on recall@k",
      "Identify queries where sparse retrieval beats dense",
      "Quantify what reranking adds over raw retrieval",
    ],
    steps: [
      { title: "Chunk", detail: "Index the corpus at 256, 512 and 1024 tokens. Record recall@5 for each." },
      { title: "Retrieve densely", detail: "Run the query set through embedding search and inspect the misses." },
      { title: "Add sparse", detail: "Enable BM25 and fuse with RRF. Find the queries that only sparse retrieval gets." },
      { title: "Rerank", detail: "Add a cross-encoder over the top 50 and re-measure." },
    ],
    parameters: [
      { name: "chunkSize", label: "Chunk size (tokens)", type: "slider", min: 128, max: 1024, step: 128, default: 512 },
      { name: "overlap", label: "Overlap (tokens)", type: "slider", min: 0, max: 256, step: 32, default: 64 },
      { name: "topK", label: "Top K", type: "slider", min: 1, max: 20, step: 1, default: 5 },
      { name: "strategy", label: "Retrieval", type: "select", options: ["dense", "sparse", "hybrid"], default: "hybrid" },
    ],
  },
  {
    slug: "agent-lab",
    title: "Agent Lab",
    kind: "AGENT",
    summary: "Build an agent loop, give it tools, and watch every step of its trajectory.",
    description:
      "A single-agent sandbox with full trace visibility. Add and remove tools, change their descriptions, and see how tool selection accuracy responds — the fastest way to learn that tool design is the real lever.",
    difficulty: "ADVANCED",
    estimatedMinutes: 45,
    objectives: [
      "Trace an agent's decisions step by step",
      "Improve tool selection by editing descriptions alone",
      "Set termination bounds and observe which one fires",
    ],
    steps: [
      { title: "One tool", detail: "Give the agent a single tool and a task that needs it. Read the full trace." },
      { title: "Add a confusable tool", detail: "Add a second, similar tool. Watch selection accuracy drop." },
      { title: "Fix the descriptions", detail: "Rewrite both descriptions to say when NOT to use each. Re-measure." },
      { title: "Bound the loop", detail: "Set max steps and a cost ceiling, then give it an unsolvable task." },
    ],
    parameters: [
      { name: "maxSteps", label: "Max steps", type: "slider", min: 1, max: 20, step: 1, default: 8 },
      { name: "temperature", label: "Temperature", type: "slider", min: 0, max: 1, step: 0.1, default: 0.3 },
      { name: "toolSet", label: "Tool set", type: "select", options: ["minimal", "standard", "confusable"], default: "standard" },
    ],
  },
  {
    slug: "multi-agent-lab",
    title: "Multi-Agent Lab",
    kind: "MULTI_AGENT",
    summary: "A coordinator, a set of specialists, and the handoffs between them.",
    description:
      "Run the same task through one generalist agent and through a coordinator with specialists, and compare accuracy, latency and token cost. The comparison is usually more surprising than the architecture.",
    difficulty: "ADVANCED",
    estimatedMinutes: 50,
    objectives: [
      "Compare single-agent and multi-agent cost on the same task",
      "Observe context growth across handoffs",
      "Find the task shape where coordination actually pays",
    ],
    steps: [
      { title: "Single agent baseline", detail: "Run the task with one agent and record accuracy, latency and tokens." },
      { title: "Split into specialists", detail: "Decompose into three specialists under a coordinator. Re-run." },
      { title: "Measure the handoff tax", detail: "Compare total tokens. Note how much is re-stated context." },
      { title: "Summarise instead", detail: "Pass summaries rather than transcripts and re-measure." },
    ],
    parameters: [
      { name: "specialists", label: "Specialists", type: "slider", min: 1, max: 5, step: 1, default: 3 },
      { name: "handoff", label: "Handoff payload", type: "select", options: ["transcript", "summary"], default: "summary" },
    ],
  },
  {
    slug: "vision-lab",
    title: "Vision Lab",
    kind: "VISION",
    summary: "Classification, detection, segmentation and OCR on your own images.",
    description:
      "Upload an image and run it through four model families, with the intermediate representations shown. Useful for building intuition about what each task actually produces and where each one fails.",
    difficulty: "INTERMEDIATE",
    estimatedMinutes: 35,
    objectives: [
      "Distinguish classification, detection and segmentation outputs",
      "Find the input conditions that break each model",
      "Read a confidence distribution rather than only the top label",
    ],
    steps: [
      { title: "Classify", detail: "Run classification and inspect the full confidence distribution, not just the argmax." },
      { title: "Detect", detail: "Run detection and vary the confidence threshold. Watch precision and recall trade." },
      { title: "Segment", detail: "Produce a mask and find the boundary conditions it handles badly." },
      { title: "OCR", detail: "Run text extraction on a low-contrast or rotated image." },
    ],
    parameters: [
      { name: "task", label: "Task", type: "select", options: ["classification", "detection", "segmentation", "ocr"], default: "detection" },
      { name: "threshold", label: "Confidence threshold", type: "slider", min: 0, max: 1, step: 0.05, default: 0.5 },
    ],
  },
  {
    slug: "evaluation-lab",
    title: "AI Evaluation Lab",
    kind: "EVALUATION",
    summary: "Score a system on accuracy, hallucination, relevance, faithfulness, latency and cost.",
    description:
      "An evaluation harness over a fixed test set. Change the system under test and watch six metrics move together — including the ones that move in the wrong direction when you optimise a single number.",
    difficulty: "PRODUCTION",
    estimatedMinutes: 45,
    objectives: [
      "Build a regression suite that catches quality drift",
      "Use an LLM judge without trusting it blindly",
      "Trade accuracy against latency and cost explicitly",
    ],
    steps: [
      { title: "Fix a test set", detail: "Assemble 50 cases with known-good answers. This is the whole foundation." },
      { title: "Score automatically", detail: "Run exact-match and embedding similarity. Note where both disagree with you." },
      { title: "Add a judge", detail: "Score faithfulness with an LLM judge, then spot-check the judge against your own reads." },
      { title: "Plot the frontier", detail: "Vary model and top-k; plot accuracy against cost and latency." },
    ],
    parameters: [
      { name: "metric", label: "Primary metric", type: "select", options: ["accuracy", "faithfulness", "relevance", "latency", "cost"], default: "faithfulness" },
      { name: "sampleSize", label: "Test cases", type: "slider", min: 10, max: 200, step: 10, default: 50 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */
export interface ProjectSeed {
  slug: string;
  title: string;
  summary: string;
  difficulty: DifficultyName;
  problemStatement: string;
  businessContext: string;
  architecture: string;
  requirements: string[];
  techStack: string[];
  tasks: { title: string; detail: string; stage: string }[];
  estimatedHours: number;
  isCapstone: boolean;
  pathSlug?: string;
}

export const PROJECTS: ProjectSeed[] = [
  {
    slug: "ai-chatbot",
    title: "AI Chatbot with Memory",
    summary: "A streaming chat application with conversation memory, system prompts and structured tool output.",
    difficulty: "BEGINNER",
    problemStatement:
      "Build a chat interface backed by an LLM that holds a coherent multi-turn conversation, streams tokens as they arrive, and can call a small set of tools when the conversation needs real data.",
    businessContext:
      "Internal support teams answer the same questions repeatedly. A chatbot that holds context across a conversation and can look up order status removes the most common tier-one load.",
    architecture:
      "Next.js frontend with a streaming route handler → Anthropic Messages API with tool definitions → tool dispatch layer → a small persistence layer for conversation history. Streaming uses server-sent events so the first token appears in well under a second.",
    requirements: [
      "Streaming token-by-token responses",
      "Conversation memory across turns, persisted",
      "At least two working tools",
      "Graceful handling of API errors and rate limits",
    ],
    techStack: ["Next.js", "TypeScript", "Anthropic API", "PostgreSQL"],
    tasks: [
      { title: "Define the conversation model", detail: "Thread and message schema, with role and token accounting.", stage: "REQUIREMENTS" },
      { title: "Design the streaming contract", detail: "Decide the SSE event shape before writing the handler.", stage: "ARCHITECTURE" },
      { title: "Build the streaming route", detail: "Stream from the Messages API through to the client.", stage: "IMPLEMENTATION" },
      { title: "Add tool calling", detail: "Two tools, with descriptions that say when not to use them.", stage: "IMPLEMENTATION" },
      { title: "Test the failure paths", detail: "Rate limits, timeouts, malformed tool arguments.", stage: "TESTING" },
      { title: "Deploy", detail: "Ship it with request logging and a cost ceiling.", stage: "DEPLOYMENT" },
    ],
    estimatedHours: 10,
    isCapstone: false,
    pathSlug: "ai-engineer",
  },
  {
    slug: "rag-knowledge-assistant",
    title: "RAG Knowledge Assistant",
    summary: "A grounded question-answering system over a document corpus, with citations and a measured retrieval pipeline.",
    difficulty: "INTERMEDIATE",
    problemStatement:
      "Build an assistant that answers questions from a document corpus, cites the passages it used, and declines to answer when retrieval returns nothing relevant.",
    businessContext:
      "A company's policies, runbooks and specifications live across hundreds of documents. People ask colleagues instead of searching, because search does not answer questions. Grounded QA with citations replaces both.",
    architecture:
      "Ingestion pipeline (parse → chunk → embed → index) → hybrid retriever (dense + BM25, fused with RRF) → cross-encoder reranker → generation with citation enforcement → evaluation harness over a fixed query set.",
    requirements: [
      "Hybrid retrieval with rank fusion",
      "Cross-encoder reranking of the candidate set",
      "Citations that resolve to the exact retrieved passage",
      "An explicit refusal path when retrieval is empty",
      "recall@5 and faithfulness measured over a fixed query set",
    ],
    techStack: ["Python", "pgvector", "BM25", "Claude", "FastAPI"],
    tasks: [
      { title: "Assemble an evaluation set", detail: "40 questions with known supporting passages. Do this first.", stage: "REQUIREMENTS" },
      { title: "Design the index", detail: "Chunking strategy chosen from the corpus structure.", stage: "ARCHITECTURE" },
      { title: "Build ingestion", detail: "Parse, chunk, embed and index, idempotently.", stage: "IMPLEMENTATION" },
      { title: "Build hybrid retrieval", detail: "Dense + sparse, fused with RRF, then reranked.", stage: "IMPLEMENTATION" },
      { title: "Enforce citations", detail: "Reject generations that cite passages not in the retrieved set.", stage: "IMPLEMENTATION" },
      { title: "Measure", detail: "recall@5 and faithfulness against the evaluation set.", stage: "TESTING" },
      { title: "Deploy with monitoring", detail: "Log retrieval hashes and sampled quality scores.", stage: "DEPLOYMENT" },
    ],
    estimatedHours: 20,
    isCapstone: false,
    pathSlug: "ai-engineer",
  },
  {
    slug: "multi-agent-research-system",
    title: "Multi-Agent Research System",
    summary: "A coordinator that decomposes a research question, dispatches specialists in parallel, and synthesises a cited report.",
    difficulty: "ADVANCED",
    problemStatement:
      "Build a system that takes an open research question, breaks it into sub-questions, researches each in parallel with specialist agents, and produces a synthesised report with sources.",
    businessContext:
      "Analyst teams spend days on market and technology scans that are mostly parallel search and synthesis. The bottleneck is breadth, which is exactly what parallel agents buy.",
    architecture:
      "Coordinator agent (decompose → dispatch → merge) → N specialist research agents with search and fetch tools, running concurrently → synthesis pass with citation enforcement → trajectory logging for every agent. Handoffs carry summaries, not transcripts, to keep token growth linear.",
    requirements: [
      "Coordinator that decomposes and dispatches",
      "Specialists running genuinely in parallel",
      "Summary-based handoffs, not transcript forwarding",
      "Per-agent and total cost ceilings",
      "Full trajectory logs for debugging",
    ],
    techStack: ["Python", "Claude", "Anthropic SDK", "asyncio", "PostgreSQL"],
    tasks: [
      { title: "Define the decomposition contract", detail: "What a sub-question looks like and how results merge.", stage: "REQUIREMENTS" },
      { title: "Choose the topology", detail: "Coordinator vs pipeline, justified against the task shape.", stage: "ARCHITECTURE" },
      { title: "Build the specialist", detail: "One agent, narrow tools, returns a structured summary.", stage: "IMPLEMENTATION" },
      { title: "Build the coordinator", detail: "Decompose, fan out concurrently, merge.", stage: "IMPLEMENTATION" },
      { title: "Bound the cost", detail: "Per-agent and global ceilings, with the reason logged.", stage: "IMPLEMENTATION" },
      { title: "Evaluate trajectories", detail: "Score the path taken, not only the final report.", stage: "TESTING" },
      { title: "Deploy", detail: "Ship with trajectory logs and a cost dashboard.", stage: "DEPLOYMENT" },
    ],
    estimatedHours: 30,
    isCapstone: false,
    pathSlug: "agent-engineer",
  },
  {
    slug: "enterprise-rag-platform",
    title: "Enterprise RAG Platform",
    summary: "Capstone: a production, multi-tenant RAG platform with agents, evaluation, auth and observability.",
    difficulty: "PRODUCTION",
    problemStatement:
      "Build a production-grade AI application that combines retrieval, tool-calling agents, evaluation, authentication, persistence, observability and a deployed frontend. This is the portfolio piece.",
    businessContext:
      "An organisation needs grounded answers over its own documents, isolated per team, with an audit trail of what was asked and what was retrieved — and a quality bar that can be demonstrated, not asserted.",
    architecture:
      "Next.js frontend → authenticated API → per-tenant retrieval over an isolated index → agent layer with tool calling → generation with citation enforcement → evaluation harness running on every deploy → OpenTelemetry traces and a cost dashboard. Multi-tenancy is enforced at the index level, not by filtering after retrieval.",
    requirements: [
      "LLM generation with enforced citations",
      "Hybrid retrieval with reranking",
      "Tool-calling agent layer",
      "Evaluation suite gating deploys",
      "Authentication and per-tenant isolation",
      "Persistence, observability and a cost ceiling",
      "A deployed, usable frontend",
    ],
    techStack: ["Next.js", "TypeScript", "Python", "Claude", "pgvector", "PostgreSQL", "OpenTelemetry", "Docker"],
    tasks: [
      { title: "Write the requirements", detail: "Including the quality bar the evaluation suite must enforce.", stage: "REQUIREMENTS" },
      { title: "Design for multi-tenancy", detail: "Isolation at the index level, with the threat model written down.", stage: "ARCHITECTURE" },
      { title: "Build retrieval", detail: "Hybrid, reranked, per-tenant.", stage: "IMPLEMENTATION" },
      { title: "Build the agent layer", detail: "Tools, bounds, trajectory logging.", stage: "IMPLEMENTATION" },
      { title: "Build auth and persistence", detail: "Sessions, tenants, audit trail.", stage: "IMPLEMENTATION" },
      { title: "Gate deploys on evaluation", detail: "The suite runs in CI and can fail the build.", stage: "TESTING" },
      { title: "Instrument and deploy", detail: "Traces, cost dashboard, graceful degradation.", stage: "DEPLOYMENT" },
    ],
    estimatedHours: 60,
    isCapstone: true,
    pathSlug: "ai-engineer",
  },
  {
    slug: "pdf-ai-assistant",
    title: "PDF AI Assistant",
    summary: "Upload a PDF, ask questions about it, get answers anchored to page and paragraph.",
    difficulty: "BEGINNER",
    problemStatement:
      "Build an assistant that ingests a PDF, extracts its text and structure, and answers questions with references back to the exact page.",
    businessContext:
      "Contracts, papers and reports arrive as PDFs that nobody reads end to end. Answering questions against one, with page citations, is the smallest useful version of document intelligence.",
    architecture:
      "Upload → PDF parse with layout retention → structure-aware chunking → embed and index → retrieve → generate with page-anchored citations.",
    requirements: [
      "PDF parsing that preserves page and heading structure",
      "Answers anchored to a page number",
      "Handles a scanned PDF via OCR fallback",
    ],
    techStack: ["Python", "PyMuPDF", "Claude", "FastAPI"],
    tasks: [
      { title: "Decide the citation granularity", detail: "Page, paragraph or both.", stage: "REQUIREMENTS" },
      { title: "Design the parse pipeline", detail: "Including the OCR fallback path.", stage: "ARCHITECTURE" },
      { title: "Build parse and chunk", detail: "Chunk on headings, keep page numbers attached.", stage: "IMPLEMENTATION" },
      { title: "Build retrieval and QA", detail: "Retrieve, generate, cite.", stage: "IMPLEMENTATION" },
      { title: "Test on a scanned document", detail: "Confirm the OCR path works end to end.", stage: "TESTING" },
      { title: "Deploy", detail: "With an upload size limit and a cost ceiling.", stage: "DEPLOYMENT" },
    ],
    estimatedHours: 12,
    isCapstone: false,
    pathSlug: "ai-engineer",
  },
  {
    slug: "ai-coding-assistant",
    title: "AI Coding Assistant",
    summary: "A repository-aware assistant that explains code, proposes diffs and writes tests.",
    difficulty: "ADVANCED",
    problemStatement:
      "Build an assistant that indexes a codebase, answers questions about it with file and line references, and proposes changes as reviewable diffs rather than rewritten files.",
    businessContext:
      "Onboarding to an unfamiliar codebase is the slowest part of joining a team. A repository-aware assistant that cites real files compresses weeks into days.",
    architecture:
      "Repository indexer (AST-aware chunking on function and class boundaries) → hybrid retrieval → agent with read, search and diff tools → diff proposal with test generation. Chunking on syntax boundaries rather than token windows is what makes the citations usable.",
    requirements: [
      "AST-aware chunking on function and class boundaries",
      "Answers citing file and line",
      "Changes proposed as unified diffs",
      "Generated tests that actually run",
    ],
    techStack: ["Python", "tree-sitter", "Claude", "pgvector"],
    tasks: [
      { title: "Scope the languages", detail: "Which grammars the indexer must support.", stage: "REQUIREMENTS" },
      { title: "Design the index", detail: "AST chunking plus a symbol table.", stage: "ARCHITECTURE" },
      { title: "Build the indexer", detail: "Incremental, so a commit does not reindex everything.", stage: "IMPLEMENTATION" },
      { title: "Build the agent tools", detail: "read_file, search_symbol, propose_diff.", stage: "IMPLEMENTATION" },
      { title: "Verify generated tests run", detail: "Execute them in a sandbox before showing them.", stage: "TESTING" },
      { title: "Deploy", detail: "With repository-scoped access control.", stage: "DEPLOYMENT" },
    ],
    estimatedHours: 35,
    isCapstone: false,
    pathSlug: "agent-engineer",
  },
];

/* ------------------------------------------------------------------ */
/* Practice bank                                                       */
/* ------------------------------------------------------------------ */
export interface PracticeSeed {
  kind: "CONCEPT" | "SCENARIO" | "CODING" | "ARCHITECTURE" | "DEBUGGING" | "DESIGN" | "INTERVIEW" | "CASE_STUDY";
  difficulty: DifficultyName;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  hint?: string;
  skillSlug: string;
}

export const PRACTICE: PracticeSeed[] = [
  {
    kind: "CONCEPT",
    difficulty: "BEGINNER",
    prompt: "A model scores 0.99 on your held-out test set, far above anything published for this task. What is the first thing to check?",
    options: [
      "Whether the model is overfitting and needs regularisation",
      "Whether information from the test set leaked into training",
      "Whether the learning rate was too high",
      "Whether the test set is too small to be meaningful",
    ],
    answer: "Whether information from the test set leaked into training",
    explanation:
      "A score far above the state of the art is a leakage signal before it is anything else. Overfitting shows as a gap between train and test, not as a high test score. Check the usual paths: transforms fitted before the split, target encoding across folds, time series split randomly, or a feature that is downstream of the label.",
    hint: "Overfitting makes test scores worse, not better.",
    skillSlug: "machine-learning",
  },
  {
    kind: "CONCEPT",
    difficulty: "INTERMEDIATE",
    prompt: "In scaled dot-product attention, why are the scores divided by the square root of the head dimension?",
    options: [
      "To normalise the output to unit length",
      "To keep the softmax out of its saturated region as dimension grows",
      "To reduce the computational cost of the matrix multiplication",
      "To make the attention weights sum to one",
    ],
    answer: "To keep the softmax out of its saturated region as dimension grows",
    explanation:
      "The dot product of two random vectors of dimension d has variance proportional to d. Without scaling, scores grow with dimension, softmax saturates, and its gradient vanishes — so deep models stop training. Softmax already guarantees the weights sum to one; that is not what the scaling is for.",
    hint: "Think about what happens to softmax gradients when its inputs get large.",
    skillSlug: "transformers",
  },
  {
    kind: "SCENARIO",
    difficulty: "INTERMEDIATE",
    prompt:
      "Your RAG system answers conceptual questions well but fails whenever a user asks about a specific product code like 'SKU-4471-B'. What is the most likely cause?",
    options: [
      "The chunk size is too large",
      "The system uses dense retrieval only, which matches meaning rather than exact terms",
      "The generation temperature is too high",
      "The reranker is misconfigured",
    ],
    answer: "The system uses dense retrieval only, which matches meaning rather than exact terms",
    explanation:
      "Embeddings represent meaning, and an arbitrary identifier has no meaning to embed — so dense retrieval cannot find it reliably. This is the canonical case for hybrid search: BM25 matches the exact token, dense retrieval handles the paraphrase, and rank fusion combines them.",
    hint: "What does an embedding of a random alphanumeric string actually represent?",
    skillSlug: "rag",
  },
  {
    kind: "CONCEPT",
    difficulty: "ADVANCED",
    prompt: "Why does reciprocal rank fusion combine retrievers without needing score normalisation?",
    options: [
      "It normalises scores internally using min-max scaling",
      "It uses only the rank position, discarding the raw scores entirely",
      "It requires all retrievers to output probabilities",
      "It trains a small model to calibrate the scores",
    ],
    answer: "It uses only the rank position, discarding the raw scores entirely",
    explanation:
      "RRF scores each document as the sum of 1/(k + rank) across retrievers. Because only rank enters the formula, BM25's unbounded scores and cosine similarity's [-1, 1] range never have to be made comparable. That is exactly why it is so hard to beat without tuning.",
    skillSlug: "rag",
  },
  {
    kind: "DEBUGGING",
    difficulty: "ADVANCED",
    prompt:
      "An agent with two similar tools — search_users and find_customer — picks the wrong one about 40% of the time. What is the highest-leverage fix?",
    options: [
      "Lower the temperature to make selection more deterministic",
      "Rewrite both tool descriptions to state when NOT to use each",
      "Add more examples to the system prompt",
      "Merge the two tools into one",
    ],
    answer: "Rewrite both tool descriptions to state when NOT to use each",
    explanation:
      "Tool selection errors are almost always tool-design errors. A description that only says what a tool does leaves the boundary between two similar tools undefined. Stating the negative case — 'use this for internal staff accounts, not for customers; for customers use find_customer' — draws the boundary explicitly. Merging is sometimes right too, but description repair is cheaper and tells you whether merging is actually needed.",
    hint: "The model is not confused about what the tools do. It is confused about which case it is in.",
    skillSlug: "ai-agents",
  },
  {
    kind: "ARCHITECTURE",
    difficulty: "PRODUCTION",
    prompt:
      "You are designing retrieval for an enterprise RAG platform serving 40 tenants over 10 million documents. How should tenant isolation be enforced?",
    options: [
      "Retrieve across the whole corpus, then filter results by tenant",
      "Partition the index per tenant and route the query to that partition",
      "Add the tenant id to each chunk's text before embedding",
      "Rely on the generation prompt to ignore other tenants' documents",
    ],
    answer: "Partition the index per tenant and route the query to that partition",
    explanation:
      "Filtering after retrieval means another tenant's documents were retrieved — a data boundary crossed before the filter runs, and a top-k budget spent on results that will be discarded. Partitioning enforces isolation structurally and keeps recall intact. Embedding the tenant id in the text makes isolation a similarity accident, and prompt-level isolation is not isolation at all.",
    skillSlug: "ai-architecture",
  },
  {
    kind: "CONCEPT",
    difficulty: "INTERMEDIATE",
    prompt: "Your multi-agent system's token cost grows roughly quadratically with the number of specialists. What is the usual cause?",
    options: [
      "Each specialist uses a larger model than necessary",
      "The full conversation transcript is forwarded to every specialist on each handoff",
      "The coordinator retries failed specialists too aggressively",
      "Embeddings are recomputed for each agent",
    ],
    answer: "The full conversation transcript is forwarded to every specialist on each handoff",
    explanation:
      "If every handoff carries the accumulated transcript, each of N agents reads roughly N agents' worth of context, so total tokens scale with N². Passing a structured summary instead — the brief in, the result out — keeps growth linear and usually improves accuracy too, since specialists stop being distracted by other agents' reasoning.",
    skillSlug: "multi-agent-systems",
  },
  {
    kind: "CONCEPT",
    difficulty: "PRODUCTION",
    prompt:
      "Your LLM pipeline's dashboards show normal latency, zero errors and steady throughput, yet users report that answers have got worse. What was most likely missing from your instrumentation?",
    options: [
      "Distributed tracing across services",
      "Prompt version logging and continuous output sampling",
      "CPU and memory metrics on the inference nodes",
      "Rate limit headers from the model provider",
    ],
    answer: "Prompt version logging and continuous output sampling",
    explanation:
      "Latency, errors and throughput are blind to answer quality — a pipeline can be perfectly healthy and steadily wrong. You need the semantic layer: prompt version on every call, retrieved-context hashes, and sampled outputs scored continuously. Without the prompt version in particular, a quality drop cannot be tied back to the prompt change that caused it.",
    skillSlug: "ai-engineering",
  },
];

/* ------------------------------------------------------------------ */
/* Bootcamp                                                            */
/* ------------------------------------------------------------------ */
export interface BootcampWeekSeed {
  weekNumber: number;
  title: string;
  summary: string;
  goals: string[];
  milestone: string;
  courseSlug?: string;
  projectSlug?: string;
}

export const BOOTCAMP = {
  slug: "ai-engineer-12-week",
  title: "12-Week AI Engineer Bootcamp",
  summary: "A cohort-paced run through the AI Engineer path, ending in a deployed production capstone.",
  description:
    "Twelve weeks, each with learning goals, lessons, labs, an assignment and a milestone. The pace is deliberate: one concept area per week, built on the week before, with a capstone that takes the last two.",
  durationWeeks: 12,
  pathSlug: "ai-engineer",
  weeks: [
    { weekNumber: 1, title: "Python & AI Foundations", summary: "Typed Python, the numerical stack, and project structure that survives contact with a team.", goals: ["Write typed, tested Python", "Vectorise numerical work", "Structure a project for training and serving"], milestone: "A tested data pipeline module", courseSlug: "python-for-ai" },
    { weekNumber: 2, title: "Machine Learning", summary: "Supervised learning, honest evaluation, and the leakage hunt.", goals: ["Train and tune without leaking", "Pick a metric that matches the decision", "Run an error analysis"], milestone: "A trained model with an error analysis", courseSlug: "machine-learning-foundations" },
    { weekNumber: 3, title: "Deep Learning", summary: "Backpropagation by hand, then the practical business of making training converge.", goals: ["Implement backprop from scratch", "Diagnose a loss curve", "Apply regularisation where it helps"], milestone: "A network trained to convergence", courseSlug: "deep-learning" },
    { weekNumber: 4, title: "Computer Vision", summary: "Convolutions, detection and segmentation, with a working inference pipeline.", goals: ["Understand convolution and pooling", "Run detection and segmentation", "Evaluate with IoU and mAP"], milestone: "An image pipeline with measured accuracy" },
    { weekNumber: 5, title: "NLP", summary: "Tokenisation, embeddings and attention — the road into transformers.", goals: ["Understand tokenisation trade-offs", "Use embeddings for similarity", "Read an attention map correctly"], milestone: "A semantic search prototype" },
    { weekNumber: 6, title: "Generative AI", summary: "LLM mechanics, prompting, structured output and tool calling.", goals: ["Explain self-attention", "Get reliable structured output", "Design a callable tool"], milestone: "A streaming chat application", courseSlug: "generative-ai-llms", projectSlug: "ai-chatbot" },
    { weekNumber: 7, title: "RAG", summary: "Chunking, hybrid retrieval, reranking, and measuring all of it.", goals: ["Choose chunking from corpus structure", "Build hybrid retrieval", "Measure recall@k and faithfulness"], milestone: "A RAG pipeline with a measured baseline", courseSlug: "rag-systems", projectSlug: "rag-knowledge-assistant" },
    { weekNumber: 8, title: "AI Agents", summary: "The loop, tool design, memory and termination.", goals: ["Implement an agent loop", "Design tools a model uses correctly", "Bound iterations and cost"], milestone: "A tool-calling agent with trajectory logs", courseSlug: "ai-agents" },
    { weekNumber: 9, title: "Multi-Agent Systems", summary: "Coordinators, specialists, handoffs and shared context.", goals: ["Pick a topology on evidence", "Keep handoff cost linear", "Evaluate a trajectory"], milestone: "A coordinator with three specialists", courseSlug: "multi-agent-systems", projectSlug: "multi-agent-research-system" },
    { weekNumber: 10, title: "AI Engineering", summary: "Serving, streaming, caching, guardrails and cost control.", goals: ["Set a latency budget", "Cache effectively", "Add guardrails that degrade gracefully"], milestone: "A served pipeline within its latency budget", courseSlug: "production-ai-engineering" },
    { weekNumber: 11, title: "Production AI", summary: "Observability, evaluation in CI, and the cost model.", goals: ["Instrument the semantic layer", "Gate deploys on evaluation", "Model and control cost"], milestone: "An evaluation suite gating the build" },
    { weekNumber: 12, title: "Capstone", summary: "A deployed, evaluated, production-grade AI application.", goals: ["Ship end to end", "Prove quality with evaluation", "Present the architecture"], milestone: "A deployed capstone and portfolio write-up", projectSlug: "enterprise-rag-platform" },
  ] as BootcampWeekSeed[],
};

/* ------------------------------------------------------------------ */
/* Mentorship offerings (repurposed consultations)                     */
/* ------------------------------------------------------------------ */
export const MENTOR_OFFERINGS = [
  {
    slug: "code-review",
    title: "AI Code Review",
    shortDesc: "A senior AI engineer reads your project end to end and tells you what a reviewer on a real team would say.",
    fullDescription:
      "Bring a repository. We go through architecture, prompt and tool design, retrieval quality, evaluation coverage and the parts that will break under load. You leave with a prioritised list, not a vague impression.",
    durationMinutes: 60,
    price: 120,
    category: "CodeReview",
    whatIncluded: ["Full repository read before the session", "Live walkthrough with trade-offs named", "A written, prioritised action list", "Session recording"],
    whoIsThisFor: ["Learners finishing a project or capstone", "Engineers shipping their first production AI system"],
    preparationTips: "Send the repository link and the one question you most want answered at least 24 hours ahead.",
  },
  {
    slug: "mock-interview",
    title: "AI Engineering Mock Interview",
    shortDesc: "A real interview loop — coding, system design and GenAI depth — with direct feedback afterwards.",
    fullDescription:
      "A full interview in the format you are actually facing: an AI/ML coding round, an LLM or RAG depth round, or an AI system design round. Scored against the rubric a hiring panel would use, with the gaps named plainly.",
    durationMinutes: 75,
    price: 150,
    category: "Interview",
    whatIncluded: ["A realistic interview round", "Scoring against a real rubric", "Specific, actionable feedback", "A follow-up study plan"],
    whoIsThisFor: ["Learners preparing for AI engineering interviews", "Engineers moving into an AI-focused role"],
    preparationTips: "Tell us the role and company type you are targeting so the round matches it.",
  },
  {
    slug: "architecture-review",
    title: "AI Architecture Review",
    shortDesc: "Bring a design. We stress it against scale, cost, latency, failure modes and the evaluation you will need.",
    fullDescription:
      "A working session on a system you are about to build or have just built. We cover retrieval topology, model routing, caching, multi-tenancy, observability and cost, and name the failure modes before production does.",
    durationMinutes: 90,
    price: 200,
    category: "Architecture",
    whatIncluded: ["Design read ahead of the session", "Live architecture critique", "A written risk and cost summary", "Session recording"],
    whoIsThisFor: ["Teams designing a production AI system", "Engineers presenting an architecture internally"],
    preparationTips: "Send a diagram and your expected scale, latency budget and cost ceiling in advance.",
  },
  {
    slug: "career-coaching",
    title: "AI Career Coaching",
    shortDesc: "Portfolio, positioning and the path from where you are to the AI role you want.",
    fullDescription:
      "A focused session on how your work reads to a hiring team. Portfolio project selection, how to write up what you built, which gaps actually matter for your target role, and what to do in the next ninety days.",
    durationMinutes: 45,
    price: 90,
    category: "Career",
    whatIncluded: ["Portfolio and résumé review", "Target role gap analysis", "A ninety-day plan", "Session recording"],
    whoIsThisFor: ["Learners approaching job readiness", "Engineers switching into AI from another specialisation"],
    preparationTips: "Send your résumé and portfolio links, plus two job postings you would actually apply to.",
  },
];
