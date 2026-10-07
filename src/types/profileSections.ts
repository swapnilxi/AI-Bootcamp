/** Discriminated union type for each profile section variant */

export type SectionType =
  | "bio_extended"
  | "philosophy"
  | "journey"
  | "credentials"
  | "offerings"
  | "testimonials"
  | "video_intro"
  | "gallery"
  | "faq"
  | "mantra"
  | "research"
  | "custom";

export interface BaseSectionItem {
  id: string;
}

export interface TextItem extends BaseSectionItem {
  kind: "text";
  value: string;
}

export interface BulletItem extends BaseSectionItem {
  kind: "bullet";
  text: string;
  icon?: string;
}

export interface TestimonialItem extends BaseSectionItem {
  kind: "testimonial";
  quote: string;
  author: string;
  role?: string;
  avatarInitial?: string;
}

export interface FaqItem extends BaseSectionItem {
  kind: "faq";
  question: string;
  answer: string;
}

export interface CredentialItem extends BaseSectionItem {
  kind: "credential";
  title: string;
  institution?: string;
  year?: string;
  icon?: string;
}

export interface VideoItem extends BaseSectionItem {
  kind: "video";
  url: string;
  caption?: string;
}

export interface GalleryItem extends BaseSectionItem {
  kind: "gallery";
  imageUrl: string;
  caption?: string;
}

export type SectionItem =
  | TextItem
  | BulletItem
  | TestimonialItem
  | FaqItem
  | CredentialItem
  | VideoItem
  | GalleryItem;

export interface ProfileSection {
  id: string;
  type: SectionType;
  title: string;
  icon: string;
  content: string;
  items: SectionItem[];
  visible: boolean;
  order: number;
}

export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

export interface SectionTemplate {
  type: SectionType;
  title: string;
  icon: string;
  description: string;
  defaultContent: string;
  defaultItems: DistributiveOmit<SectionItem, "id">[];
}

export const PREDEFINED_SECTION_TEMPLATES: SectionTemplate[] = [
  {
    type: "philosophy",
    title: "Teaching Philosophy",
    icon: "🌙",
    description: "Share your guiding principles and spiritual worldview",
    defaultContent:
      "My approach bridges ancient sacred wisdom with modern practical application. Every learner who arrives carries within them a unique cosmic blueprint…",
    defaultItems: [],
  },
  {
    type: "journey",
    title: "My Background",
    icon: "🌿",
    description: "How you got into AI engineering and what you work on",
    defaultContent:
      "My journey into the sacred sciences began when I was initiated by my guru at the age of nineteen, deep in the hills of Rishikesh…",
    defaultItems: [],
  },
  {
    type: "credentials",
    title: "Certifications & Training",
    icon: "🏛",
    description: "List your formal qualifications and initiations",
    defaultContent: "",
    defaultItems: [
      { kind: "credential", title: "MSc Machine Learning", institution: "University of Edinburgh", year: "2016" },
      { kind: "credential", title: "Staff ML Engineer, Search & Retrieval", institution: "Industry", year: "2020" },
    ],
  },
  {
    type: "offerings",
    title: "What I Offer",
    icon: "✨",
    description: "A curated list of your core offerings and services",
    defaultContent: "Each session is a sacred transmission tailored to your exact AI coordinates and energetic state:",
    defaultItems: [
      { kind: "bullet", text: "Architecture review (90 min deep-dive)" },
      { kind: "bullet", text: "Biofield Abundance Clearing (60 min)" },
      { kind: "bullet", text: "Mock interview with written feedback (45 min)" },
    ],
  },
  {
    type: "testimonials",
    title: "Client Testimonials",
    icon: "⭐",
    description: "Powerful words from those you have guided",
    defaultContent: "",
    defaultItems: [
      {
        kind: "testimonial",
        quote:
          "After one session, I restructured my entire investment strategy. Three months later, our fund outperformed the index by 34%.",
        author: "Vikram S.",
        role: "Venture Capital Partner",
        avatarInitial: "V",
      },
    ],
  },
  {
    type: "faq",
    title: "Frequently Asked Questions",
    icon: "💬",
    description: "Answer common questions learners ask before booking",
    defaultContent: "",
    defaultItems: [
      { kind: "faq", question: "Do I need to know my exact birth time?", answer: "A birth time within 15 minutes is sufficient. Even without a birth time, we work with the Chandra (Moon) lagna, which remains powerful for prosperity readings." },
      { kind: "faq", question: "What is the format of a private session?", answer: "Sessions are conducted via a secure video call. You will receive a pre-session questionnaire to guide our dialogue and maximize the transmission received." },
    ],
  },
  {
    type: "video_intro",
    title: "Video Introduction",
    icon: "🎬",
    description: "Embed a YouTube or Vimeo introduction video",
    defaultContent: "A short introduction to how I teach and what I work on.",
    defaultItems: [{ kind: "video", url: "", caption: "Welcome message" }],
  },
  {
    type: "mantra",
    title: "Sacred Practice",
    icon: "🕉",
    description: "Share a mantra, daily practice, or ritual you recommend",
    defaultContent:
      "I invite all learners to begin each morning with the Mahalakshmi Bija invocation: Om Shreem Hreem Kleem Maha Lakshmiyei Namaha. Chanted 108 times at sunrise, this mantra activates the wealth nadis within the subtle body and magnetizes auspicious synchronicities throughout the day.",
    defaultItems: [],
  },
  {
    type: "research",
    title: "Publications & Research",
    icon: "📚",
    description: "Books, articles, and research you have published",
    defaultContent: "",
    defaultItems: [
      { kind: "bullet", text: "\"Hybrid Retrieval at Scale\" – SIGIR Industry Track (2024)" },
      { kind: "bullet", text: "\"Evaluating Tool-Calling Agents\" – NeurIPS Workshop (2025)" },
    ],
  },
  {
    type: "custom",
    title: "Custom Section",
    icon: "📝",
    description: "A fully custom section with your own title and content",
    defaultContent: "Write your custom content here…",
    defaultItems: [],
  },
];
