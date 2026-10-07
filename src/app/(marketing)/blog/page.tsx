"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Clock, Calendar, ArrowRight, BookOpen, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Author {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  role: string | null;
  mentorType: string | null;
  specialties: string | null;
}

interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string | null;
  readTimeMin: number;
  publishedAt: string;
  author: Author;
}

const CATEGORIES = [
  { id: "all", label: "All Insights" },
  { id: "Engineering", label: "AI Engineering" },
  { id: "Agents", label: "Agents & Tools" },
  { id: "RAG", label: "RAG & Retrieval" },
  { id: "Career", label: "Career" },
];

export default function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  async function fetchPosts() {
    setLoading(true);
    try {
      const url =
        activeCategory === "all"
          ? "/api/blog"
          : `/api/blog?category=${encodeURIComponent(activeCategory)}`;
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Error loading blog posts:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      p.excerpt.toLowerCase().includes(query) ||
      (p.tags && p.tags.toLowerCase().includes(query)) ||
      (p.author.name && p.author.name.toLowerCase().includes(query))
    );
  });

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const standardPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-mist pb-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-text-muted px-3 py-1 rounded-full bg-mist/60 border border-mist inline-block mb-3">
            Engineering Blog & Field Notes
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink font-normal leading-tight">
            AI Essays & Research
          </h1>
          <p className="text-ink/75 text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
            Field notes from engineers running AI systems in production — what worked, what did not, and the numbers behind both.
          </p>
        </div>

        <Button href="/courses" variant="primary" size="md" className="shrink-0">
          <BookOpen className="w-4 h-4 mr-2" />
          <span>Explore Academy Classes</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-gold text-black shadow-sm font-semibold"
                  : "bg-black-raised/80 backdrop-blur-sm text-ink border border-white/[0.07] hover:border-gold"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search articles, tags, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black-raised/60 border border-white/[0.08] rounded-full text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-text-muted text-sm animate-pulse">
          Consulting AI scrolls...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-black-raised/40 rounded-3xl border border-white/[0.06]">
          <p className="text-lg font-serif text-ink">No articles found matching your criteria.</p>
          <p className="text-xs text-text-muted">Try selecting another category or clearing your search query.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Featured Article Card */}
          {featuredPost && (
            <div className="p-8 sm:p-12 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-cream/20 hover:border-gold/50 shadow-lg transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-cream/10 text-text border border-cream/20 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Featured Essay
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-mist/60 text-ink/80 border border-mist">
                    {featuredPost.category}
                  </span>
                  <span className="text-xs text-text-muted flex items-center gap-1 ml-auto">
                    <Clock className="w-3.5 h-3.5" />
                    {featuredPost.readTimeMin} min read
                  </span>
                </div>

                <Link href={`/blog/${featuredPost.slug}`} className="block group">
                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink group-hover:text-gold transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>
                </Link>

                <p className="text-ink/80 text-base sm:text-lg leading-relaxed max-w-4xl">
                  {featuredPost.excerpt}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center text-text font-serif font-bold text-sm">
                      {featuredPost.author.name ? featuredPost.author.name[0] : "M"}
                    </div>
                    <div>
                      <p className="text-xs text-ink/50 uppercase tracking-wider font-semibold">Author</p>
                      <p className="text-sm font-medium text-ink">{featuredPost.author.name || "Master Instructor"}</p>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold hover:bg-[#FFB073] text-black font-semibold text-sm transition-all shadow-sm"
                  >
                    <span>Read Full Essay</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Other Articles */}
          {standardPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {standardPosts.map((post) => (
                <article
                  key={post.id}
                  className="p-6 sm:p-8 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] hover:border-gold/40 transition-all flex flex-col justify-between group space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span className="px-2.5 py-0.5 rounded-full bg-mist/60 text-ink/80 border border-mist font-medium">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readTimeMin} min
                      </span>
                    </div>

                    <Link href={`/blog/${post.slug}`} className="block group">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink group-hover:text-gold transition-colors leading-snug">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-ink/75 text-sm leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cream/10 flex items-center justify-center text-text font-serif text-xs font-bold">
                        {post.author.name ? post.author.name[0] : "A"}
                      </div>
                      <span className="text-xs font-medium text-ink/80">
                        {post.author.name || "Faculty Member"}
                      </span>
                    </div>

                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-xs font-semibold text-text-muted hover:text-text flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Academy Bridge Banner */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-black-raised to-cream/8 border border-cream/15 text-center space-y-4">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
          Study Directly Under Our Master Instructors & Mentors
        </h2>
        <p className="text-ink/75 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Every post here is anchored in a live course. Join a path to get the lessons, labs and projects behind it.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Button href="/courses" variant="primary" size="md">
            View All Academy Classes
          </Button>
          <Button href="/book" variant="outline" size="md">
            Book 1-on-1 Session
          </Button>
        </div>
      </div>
    </div>
  );
}
