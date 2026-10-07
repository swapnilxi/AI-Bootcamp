"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  Settings,
  Wand2,
  Calendar,
  Check,
  RefreshCw,
  HelpCircle,
  Shield,
  MessageSquare,
} from "lucide-react";

interface Instructor {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  role?: string;
  mentorType?: string | null;
  sessionPrice?: number | null;
  sessionDuration?: number | null;
  specialties?: string | null;
  aiChatEnabled?: boolean;
  aiSystemPrompt?: string | null;
  aiChatStyle?: string | null;
  aiGreeting?: string | null;
  aiSampleQuestions?: string | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface InstructorAiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: Instructor | null;
  onOpenBooking?: (inst: Instructor) => void;
  initialQuestion?: string | null;
}

export function InstructorAiChatModal({
  isOpen,
  onClose,
  instructor,
  onOpenBooking,
  initialQuestion,
}: InstructorAiChatModalProps) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings / Context management
  const [systemPrompt, setSystemPrompt] = useState("");
  const [chatStyle, setChatStyle] = useState("");
  const [greeting, setGreeting] = useState("");
  const [sampleChat, setSampleChat] = useState("");
  const [extractingStyle, setExtractingStyle] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCallerAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const isSelf = session?.user?.id === instructor?.id;
  const canManageAi = isCallerAdmin || isSelf;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Initialize or reset chat when modal opens or instructor changes
  useEffect(() => {
    if (!isOpen || !instructor) return;

    setShowSettings(false);
    setSettingsNotice(null);

    // Initial greeting
    const initialGreeting =
      instructor.aiGreeting ||
      `Namaste and welcome. I am the AI digital twin of ${instructor.name || "your instructor"}. How may I illuminate your journey today?`;

    setMessages([
      {
        id: "msg-0",
        role: "assistant",
        content: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setSystemPrompt(instructor.aiSystemPrompt || "");
    setChatStyle(instructor.aiChatStyle || "");
    setGreeting(instructor.aiGreeting || "");
    setSampleChat(
      `Sample excerpt from ${instructor.name || "Instructor"}: "True abundance is not accumulated; it is tuned. When we clear the energetic cords of scarcity from our subtle biofield and align our timing with the auspicious nakshatras, wealth flows as an inevitable natural law."`
    );

    if (initialQuestion) {
      setInputValue(initialQuestion);
    } else {
      setInputValue("");
    }

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, [isOpen, instructor?.id, initialQuestion]);

  // Keep scroll strictly inside container without scrolling window
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  if (!isOpen || !instructor || !mounted) return null;

  // Parse sample starter questions
  let sampleQuestions: string[] = [];
  try {
    if (instructor.aiSampleQuestions) {
      sampleQuestions = JSON.parse(instructor.aiSampleQuestions);
    }
  } catch (e) {
    // fallback
  }

  if (sampleQuestions.length === 0) {
    const isWealth =
      (instructor.name || "").toLowerCase().includes("lakshmi") ||
      (instructor.specialties || "").toLowerCase().includes("wealth") ||
      (instructor.specialties || "").toLowerCase().includes("financial");

    if (isWealth) {
      sampleQuestions = [
        "How do I activate the wealth yogas (Dhana Yogas) in my chart?",
        "How do I measure whether my retrieval is any good?",
        "Why does my agent keep picking the wrong tool?",
        "Should this be an agent or a fixed workflow?",
      ];
    } else {
      sampleQuestions = [
        "What is your teaching philosophy?",
        "How do your courses work in the academy?",
        "What should I prepare for a private 1:1 session?",
        "What should I learn next, given where I am?",
      ];
    }
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setLoading(true);

    try {
      const res = await fetch(`/api/instructors/${instructor.id}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to receive message");

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `I apologize, but I momentarily lost alignment with the etheric stream. ${err.message || "Please try asking again."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractStyle = async () => {
    setExtractingStyle(true);
    setSettingsNotice(null);

    try {
      const res = await fetch(`/api/instructors/${instructor.id}/ai-persona`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extract_style",
          sampleChat,
          apply: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze chat style");

      setChatStyle(data.extractedStyle || "");
      setSystemPrompt(data.suggestedPrompt || "");
      setGreeting(data.suggestedGreeting || "");
      setSettingsNotice("Successfully extracted chatting style & persona context! Click 'Save Persona' to apply.");
    } catch (err: any) {
      setSettingsNotice(`Error analyzing style: ${err.message}`);
    } finally {
      setExtractingStyle(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsNotice(null);

    try {
      const res = await fetch(`/api/instructors/${instructor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiSystemPrompt: systemPrompt,
          aiChatStyle: chatStyle,
          aiGreeting: greeting,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save AI settings");

      setSettingsNotice("AI persona settings and context saved successfully!");
      setTimeout(() => setShowSettings(false), 1200);
    } catch (err: any) {
      setSettingsNotice(`Error saving: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  return createPortal(
    <div data-lenis-prevent className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl h-[min(760px,calc(100vh-2rem))] max-h-[90vh] bg-[#121217] border border-cream/15 rounded-3xl shadow-[0_20px_60px_-15px_rgba(251, 146, 60,0.25)] flex flex-col overflow-hidden text-ink">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              {instructor.avatarUrl ? (
                <img
                  src={instructor.avatarUrl}
                  alt={instructor.name || "Instructor"}
                  className="w-12 h-12 rounded-2xl object-cover border border-cream/30 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-cream/10 border border-cream/20 text-text flex items-center justify-center font-serif text-lg font-bold">
                  {instructor.name?.charAt(0) || "M"}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-black border-2 border-black" title="AI Twin Online 24/7">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg text-ink font-medium truncate">
                  {instructor.name}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-cream/10 text-text border border-cream/20">
                  <Bot className="w-3 h-3" />
                  <span>AI Twin</span>
                </span>
              </div>
              <p className="text-xs text-text-muted truncate">
                Ask anytime · course preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageAi && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl transition-all ${
                  showSettings
                    ? "bg-cream text-black"
                    : "text-text-muted hover:text-gold hover:bg-white/5"
                }`}
                title="Manage AI Persona Context & Chatting Style"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {onOpenBooking && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBooking(instructor);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cream/10 hover:bg-cream/15 border border-cream/25 text-text text-xs font-semibold transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Live 1:1</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Drawer / Tab for Instructor or Admin */}
        {showSettings && (
          <div className="relative z-20 px-5 py-4 bg-[#16161d] border-b border-white/10 space-y-4 max-h-[380px] overflow-y-auto animate-fade-in text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-text font-semibold">
                <Wand2 className="w-4 h-4" />
                <span>AI Persona Context & Chatting Style Editor</span>
              </div>
              <span className="text-[10px] text-text-muted">
                Admin / Instructor Management Mode
              </span>
            </div>

            {settingsNotice && (
              <div className="p-2.5 rounded-xl bg-cream/8 border border-cream/20 text-text text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{settingsNotice}</span>
              </div>
            )}

            {/* Feature requested by user: Fetch style from chat sample */}
            <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-text-muted font-medium flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
                  <span>Sample Chat / Teaching Excerpt</span>
                </label>
                <button
                  type="button"
                  onClick={handleExtractStyle}
                  disabled={extractingStyle}
                  className="px-2.5 py-1 rounded-full bg-cream hover:bg-cream/90 text-black font-semibold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  {extractingStyle ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Analyzing Style…</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3" />
                      <span>Fetch / Analyze Style from Chat</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={2}
                value={sampleChat}
                onChange={(e) => setSampleChat(e.target.value)}
                placeholder="Paste real chat messages, session transcripts, or quotes here..."
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-ink text-xs focus:border-gold focus:outline-none"
              />
              <p className="text-[10px] text-text-muted">
                Clicking the button extracts the instructor&apos;s speaking cadence, vocabulary, and system prompt.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-text-muted font-medium">Chatting Style & Mannerisms</label>
              <input
                type="text"
                value={chatStyle}
                onChange={(e) => setChatStyle(e.target.value)}
                placeholder="e.g. Direct and measurement-first, explains the mechanism before the recipe, names trade-offs..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-xs focus:border-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-text-muted font-medium">System Prompt / Background Context</label>
              <textarea
                rows={2}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Background context, specific teachings, guidance rules..."
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-ink text-xs focus:border-gold focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-3 py-1.5 rounded-full border border-white/10 text-text-muted hover:text-white text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-1.5 rounded-full bg-cream hover:bg-cream/90 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {savingSettings ? "Saving…" : "Save AI Persona"}
              </button>
            </div>
          </div>
        )}

        {/* Disclaimer Bar */}
        <div className="px-5 py-2 bg-cream/5 border-b border-white/5 flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span>
              Speaking with <strong className="text-text">{instructor.name}&apos;s</strong> AI Twin for demo & 24/7 inquiries.
            </span>
          </div>
          <span className="text-[10px] hidden sm:inline text-text-muted">
            Grounded in this instructor&apos;s courses
          </span>
        </div>

        {/* Message Thread */}
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(251, 146, 60,0.4)_transparent]"
        >
          {messages.map((msg) => {
            const isBot = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"} animate-fade-in`}
              >
                {isBot && (
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-cream/10 border border-cream/20 text-text flex items-center justify-center shadow-sm">
                    {instructor.avatarUrl ? (
                      <img
                        src={instructor.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <Sparkles className="w-4 h-4 text-text" />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-4.5 text-xs sm:text-sm leading-relaxed ${
                    isBot
                      ? "bg-white/[0.04] border border-white/10 text-ink/90 shadow-sm"
                      : "bg-gold text-black font-medium shadow-md ml-auto"
                  }`}
                >
                  {isBot ? (
                    <div className="prose prose-invert prose-xs sm:prose-sm max-w-none text-ink/90 leading-relaxed font-sans space-y-2 [&_p]:leading-relaxed [&_p]:mb-2.5 last:[&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-2 [&_strong]:text-text [&_strong]:font-semibold [&_em]:italic [&_em]:text-text-muted [&_li]:text-ink/90 [&_li]:leading-relaxed [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_blockquote]:border-l-2 [&_blockquote]:border-cream/30 [&_blockquote]:pl-3 [&_blockquote]:italic">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">{msg.content}</p>
                  )}
                  <span
                    className={`block text-[10px] mt-2 ${
                      isBot ? "text-text-muted text-right" : "text-black/60 text-right"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {!isBot && (
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-cream/10 border border-cream/20 text-text flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin text-text" />
              </div>
              <div className="rounded-2xl p-3.5 bg-white/[0.04] border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gold animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-gold animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-text-muted ml-1">
                  Channeling {instructor.name}…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {sampleQuestions.length > 0 && messages.length <= 3 && (
          <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex gap-2 overflow-x-auto scrollbar-none">
            {sampleQuestions.slice(0, 3).map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="shrink-0 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-gold/15 border border-white/10 hover:border-gold/40 text-[11px] text-text-muted hover:text-gold transition-all text-left"
              >
                ✨ {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask ${instructor.name || "the mentor"} about their teachings or timing...`}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-ink text-xs sm:text-sm focus:border-gold focus:outline-none placeholder:text-text-muted"
            />

            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-3 rounded-2xl bg-cream hover:bg-cream/90 text-black font-semibold shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
