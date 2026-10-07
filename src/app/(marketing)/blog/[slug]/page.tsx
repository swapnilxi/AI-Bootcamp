"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Sparkles, BookOpen, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Author {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string | null;
  mentorType: string | null;
  specialties: string | null;
}

interface BlogPostDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string | null;
  readTimeMin: number;
  publishedAt: string;
  author: Author;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTimeMin: number;
  publishedAt: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  async function fetchPost() {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${slug}`);
      if (!res.ok) {
        throw new Error("Article not found");
      }
      const data = await res.json();
      setPost(data.post);
      setRelatedPosts(data.relatedPosts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-text-muted text-sm animate-pulse">
        Unrolling AI parchment...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <h1 className="font-serif text-3xl font-bold text-ink">Article Not Found</h1>
        <p className="text-text-muted text-sm">
          The requested AI essay may have been moved or archived.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold text-[#0C0B0A] font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Journal</span>
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between border-b border-mist pb-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Engineering Blog</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black-raised border border-white/[0.08] text-ink hover:border-gold transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? "Link Copied" : "Share Essay"}</span>
        </button>
      </div>

      {/* Article Header */}
      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-cream/10 text-text border border-cream/20">
            {post.category}
          </span>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readTimeMin} min read
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-ink tracking-tight leading-tight">
          {post.title}
        </h1>

        <p className="text-ink/80 text-lg sm:text-xl leading-relaxed italic border-l-2 border-cream/30 pl-4 py-1">
          {post.excerpt}
        </p>

        {/* Author Byline */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/[0.07]">
          <div className="w-12 h-12 rounded-full bg-cream/10 flex items-center justify-center text-text font-serif font-bold text-lg">
            {post.author.name ? post.author.name[0] : "A"}
          </div>
          <div>
            <p className="font-medium text-ink text-base">{post.author.name || "Master Instructor"}</p>
            <p className="text-xs text-text-muted">
              {post.author.specialties || "AI Engineering Instructor"}
            </p>
          </div>
        </div>
      </header>

      {/* Main Body Content */}
      <div className="p-8 sm:p-12 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] shadow-sm">
        <div className="prose max-w-none text-ink text-base sm:text-lg whitespace-pre-wrap font-sans leading-relaxed space-y-4">
          {post.content}
        </div>
      </div>

      {/* Recommended Course Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-black-raised to-cream/5 border border-cream/15 space-y-4">
        <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Curriculum Connection</span>
        </div>
        <h3 className="font-serif text-2xl font-bold text-ink">
          Deepen Your Study in the Academy
        </h3>
        <p className="text-ink/75 text-sm sm:text-base leading-relaxed">
          Master the complete mathematical calculations, classical chart interpretations, and remedial philosophies referenced in this essay inside our instructor-led classes.
        </p>
        <div className="pt-2 flex flex-wrap gap-4">
          <Button href="/courses" variant="primary" size="md">
            <BookOpen className="w-4 h-4 mr-2" />
            <span>Browse Courses</span>
          </Button>
          <Button href="/book" variant="outline" size="md">
            Schedule Private Session
          </Button>
        </div>
      </div>

      {/* Author Profile Card */}
      {post.author.bio && (
        <div className="p-8 rounded-3xl bg-black-raised/60 border border-white/[0.07] flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-cream/10 shrink-0 flex items-center justify-center text-text font-serif font-bold text-2xl">
            {post.author.name ? post.author.name[0] : "A"}
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <h4 className="font-serif text-xl font-bold text-ink">About {post.author.name}</h4>
            <p className="text-xs text-text-muted">{post.author.specialties}</p>
            <p className="text-sm text-ink/70 leading-relaxed">{post.author.bio}</p>
          </div>
        </div>
      )}

      {/* Related Essays */}
      {relatedPosts.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-mist">
          <h3 className="font-serif text-2xl font-bold text-ink">Related Field Essays</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="p-6 rounded-2xl bg-black-raised/60 border border-white/[0.06] hover:border-gold/30 transition-all space-y-3 group block"
              >
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="text-text-muted font-semibold">{r.category}</span>
                  <span>{r.readTimeMin} min</span>
                </div>
                <h4 className="font-serif text-lg font-bold text-ink group-hover:text-gold transition-colors leading-snug line-clamp-2">
                  {r.title}
                </h4>
                <p className="text-xs text-ink/70 line-clamp-2">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
