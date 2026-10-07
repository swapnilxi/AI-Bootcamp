"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, BookOpen, AlertCircle } from "lucide-react";
import { ClassCard, useClasses, type ClassFilter } from "@/features/courses";
import { Button } from "@/components/ui/Button";
import { canCreateClasses } from "@/lib/roles";

export default function ClassesCatalogPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ClassFilter>("all");

  const userRole = session?.user?.role;
  const canCreate = canCreateClasses(userRole);
  const { classes, loading, error, refetch } = useClasses(activeFilter);

  const filteredClasses = classes.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.instructor?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-mist pb-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-cream px-3 py-1 rounded-full bg-mist/60 border border-mist inline-block mb-3">
            Classical Academy
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink font-normal leading-tight">
            AI Classes & Courses
          </h1>
          <p className="text-ink/75 text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
            From Python and machine learning foundations through generative AI, RAG, agents and production AI engineering.
          </p>
        </div>

        {canCreate && (
          <Button href="/courses/new" variant="primary" size="md" className="shrink-0">
            <Plus className="w-4 h-4 mr-1" />
            <span>Author New Class</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === "all"
                ? "bg-cream text-[#0C0B0A] shadow-sm"
                : "bg-black-raised/80 backdrop-blur-sm text-ink border border-white/[0.07] hover:border-gold"
            }`}
          >
            All Classes
          </button>
          <button
            onClick={() => setActiveFilter("free")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === "free"
                ? "bg-cream text-[#0C0B0A] shadow-sm"
                : "bg-black-raised/80 backdrop-blur-sm text-ink border border-white/[0.07] hover:border-gold"
            }`}
          >
            Free Foundation
          </button>
          <button
            onClick={() => setActiveFilter("subscriber")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === "subscriber"
                ? "bg-cream text-[#0C0B0A] shadow-sm"
                : "bg-black-raised/80 backdrop-blur-sm text-ink border border-white/[0.07] hover:border-gold"
            }`}
          >
            Subscriber Courses
          </button>
          <button
            onClick={() => setActiveFilter("protected")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === "protected"
                ? "bg-cream text-[#0C0B0A] shadow-sm"
                : "bg-black-raised/80 backdrop-blur-sm text-ink border border-white/[0.07] hover:border-gold"
            }`}
          >
            Secret Key Circles
          </button>
          {session && (
            <button
              onClick={() => setActiveFilter("mine")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === "mine"
                  ? "bg-cream text-[#0C0B0A] shadow-sm"
                  : "bg-black-raised/80 backdrop-blur-sm text-ink border border-white/[0.07] hover:border-gold"
              }`}
            >
              My Courses
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => setActiveFilter("teaching")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === "teaching"
                  ? "bg-cream text-[#0C0B0A] shadow-sm"
                  : "bg-black-raised/80 backdrop-blur-sm text-ink border border-white/[0.07] hover:border-gold"
              }`}
            >
              Teaching
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes or topic..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-mist bg-black/60 text-ink text-sm focus:outline-none focus:border-gold"
          />
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-ink/40" />
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="text-center py-20 text-ink/60 text-sm">
          Loading academy classes...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="editorial-card p-12 text-center text-ink/70 max-w-md mx-auto space-y-3"
        >
          <AlertCircle className="w-10 h-10 text-cream mx-auto" />
          <h3 className="font-serif text-xl text-ink font-medium">Could not load classes</h3>
          <p className="text-sm">{error}</p>
          <button onClick={refetch} className="text-xs font-semibold text-cream hover:underline">
            Try again
          </button>
        </div>
      ) : filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClasses.map((item) => (
            <ClassCard key={item.id} classItem={item} userRole={userRole} />
          ))}
        </div>
      ) : (
        <div className="editorial-card p-12 text-center text-ink/70 max-w-md mx-auto space-y-3">
          <BookOpen className="w-10 h-10 text-cream mx-auto" />
          <h3 className="font-serif text-xl text-ink font-medium">No classes match this search</h3>
          <p className="text-sm">Try adjusting your filters or resetting the search query.</p>
          <button
            onClick={() => {
              setActiveFilter("all");
              setSearchQuery("");
            }}
            className="text-xs font-semibold text-cream hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
