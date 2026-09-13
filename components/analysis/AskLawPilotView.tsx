"use client";

import React, { useState, useEffect, useRef } from "react";
import type { AnalysisReport, Clause, EvidenceChain } from "@/types";
import type {
  AskAnswerCitation,
  AskAnswerStructure,
  AskConversationMessage,
} from "@/types/ask";
import { getSuggestedQuestions, type SuggestedQuestion } from "@/lib/ai/ask/suggestedQuestions";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  FileText,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Info,
  Scale,
  Compass,
} from "lucide-react";

interface AskLawPilotViewProps {
  report: AnalysisReport;
  onJumpToClause?: (clauseId: string) => void;
  onOpenChain?: (chain: EvidenceChain) => void;
}

export function AskLawPilotView({
  report,
  onJumpToClause,
  onOpenChain,
}: AskLawPilotViewProps) {
  const storageKey = `lawpilot_ask_${report.id}`;
  const [messages, setMessages] = useState<AskConversationMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`lawpilot_ask_${report.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Storage parse fail
      }
    }
    return [];
  });

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestedQuestions = getSuggestedQuestions(report);

  // Save conversation to localStorage
  const saveMessages = (newMessages: AskConversationMessage[]) => {
    setMessages(newMessages);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newMessages));
      } catch {
        // Storage write fail
      }
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Clear conversation
  const handleClearConversation = () => {
    if (confirm("Clear this conversation history?")) {
      saveMessages([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
      setErrorMessage(null);
    }
  };

  // Copy answer text
  const handleCopyAnswer = (msgId: string, answerText: string) => {
    navigator.clipboard.writeText(answerText);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Question Submission
  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    setInputText("");

    const nowIso = new Date().toISOString();
    const userMessage: AskConversationMessage = {
      id: `user-${nowIso.replace(/[^0-9]/g, "")}`,
      role: "user",
      content: textToSend,
      timestamp: nowIso,
    };

    const updatedMessages = [...messages, userMessage];
    saveMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/analysis/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: report.id,
          question: textToSend,
          history: messages.slice(-4),
          clientReport: report,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to get an answer from LawPilot.");
      }

      const structuredAnswer: AskAnswerStructure = data.answer;
      const assistantMessage: AskConversationMessage = {
        id: structuredAnswer.id,
        role: "assistant",
        content: structuredAnswer.answer,
        structuredAnswer,
        timestamp: new Date().toISOString(),
      };

      saveMessages([...updatedMessages, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error asking LawPilot.";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to jump to clause by section number or clauseId
  const handleClauseClick = (citation: AskAnswerCitation) => {
    if (!onJumpToClause) return;

    if (citation.clauseId) {
      onJumpToClause(citation.clauseId);
      return;
    }

    if (citation.sectionNumber) {
      const matched = report.clauses.find(
        (c: Clause) =>
          c.sectionNumber === citation.sectionNumber ||
          c.title?.toLowerCase().includes(`section ${citation.sectionNumber}`)
      );
      if (matched) {
        onJumpToClause(matched.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header Ribbon */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Ask LawPilot
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900">
                GROUNDED DOCUMENT Q&A
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evidence-backed answers derived directly from {report.metadata.title} and verified legal authorities.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearConversation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear conversation history"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Chat</span>
              </button>
            )}

            <div className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              🇮🇳 {report.jurisdictionContext?.country || "India"} Legal Context
            </div>
          </div>
        </div>

        {/* Suggested Questions Carousel */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
            Suggested Inquiries
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq: SuggestedQuestion) => (
              <button
                key={sq.id}
                type="button"
                onClick={() => handleSend(sq.question)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-blue-950/60 dark:hover:border-blue-900 dark:hover:text-blue-300 transition-colors cursor-pointer text-left"
              >
                <span>{sq.question}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-8 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                How Can LawPilot Assist With This Agreement?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ask about specific clauses, calculate notice timelines, understand statutory enforceability under Indian law, or prepare negotiation scripts for HR.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto pt-2 text-left">
              <div
                onClick={() => handleSend("What's my notice period?")}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Notice & Termination</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  &ldquo;What&apos;s my notice period?&rdquo;
                </p>
              </div>

              <div
                onClick={() => handleSend("Why is the non-compete flagged?")}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Statutory Restraints</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  &ldquo;Why is the non-compete flagged?&rdquo;
                </p>
              </div>

              <div
                onClick={() => handleSend("Can my employer recover the training amount?")}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Financial Penalties</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  &ldquo;Can my employer recover the training amount?&rdquo;
                </p>
              </div>

              <div
                onClick={() => handleSend("What should I ask HR?")}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Negotiation Preparation</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  &ldquo;What should I ask HR?&rdquo;
                </p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg: AskConversationMessage) => (
            <div key={msg.id} className="space-y-3">
              {msg.role === "user" ? (
                /* User Message */
                <div className="flex items-start justify-end gap-2.5">
                  <div className="max-w-2xl rounded-2xl rounded-tr-none bg-blue-600 text-white px-4 py-3 shadow-xs">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                /* Assistant Message */
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0 mt-1 shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>

                  <div className="flex-1 max-w-4xl rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
                    {/* Header & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          LawPilot Analysis
                        </span>
                        {msg.structuredAnswer && (
                          <>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {msg.structuredAnswer.classification}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ✓ GROUNDED
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyAnswer(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Primary Plain-English Answer */}
                    <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {/* Structured Evidence Cards (if present) */}
                    {msg.structuredAnswer && (
                      <div className="space-y-3 pt-2">
                        {/* 1. What the Document Says */}
                        {msg.structuredAnswer.whatDocumentSays && (
                          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                <span>What the Document Says</span>
                              </span>

                              {msg.structuredAnswer.citations.find(
                                (c: AskAnswerCitation) => c.type === "document_clause"
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cit = msg.structuredAnswer?.citations.find(
                                      (c: AskAnswerCitation) => c.type === "document_clause"
                                    );
                                    if (cit) handleClauseClick(cit);
                                  }}
                                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                >
                                  <span>View in Document Viewer</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200/60 dark:border-slate-800 leading-relaxed">
                              {msg.structuredAnswer.whatDocumentSays}
                            </p>
                          </div>
                        )}

                        {/* 2. Legal Context & Authorities */}
                        {msg.structuredAnswer.legalContext && (
                          <div className="p-3.5 rounded-lg border border-indigo-100 bg-indigo-50/50 dark:border-indigo-950 dark:bg-indigo-950/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>Verified Legal Context</span>
                              </span>

                              {onOpenChain && report.evidenceChains && report.evidenceChains.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onOpenChain(report.evidenceChains[0])}
                                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                                >
                                  <span>View Evidence Chain</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {msg.structuredAnswer.legalContext}
                            </p>
                          </div>
                        )}

                        {/* 3. What is Uncertain */}
                        {msg.structuredAnswer.whatIsUncertain && (
                          <div className="p-3.5 rounded-lg border border-amber-200/80 bg-amber-50/50 dark:border-amber-950 dark:bg-amber-950/30 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>What is Uncertain</span>
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {msg.structuredAnswer.whatIsUncertain}
                            </p>
                          </div>
                        )}

                        {/* 4. What Would Change the Answer? (Key Differentiator) */}
                        {msg.structuredAnswer.whatWouldChangeAnswer &&
                          msg.structuredAnswer.whatWouldChangeAnswer.length > 0 && (
                            <div className="p-3.5 rounded-lg border border-purple-200/80 bg-purple-50/50 dark:border-purple-950 dark:bg-purple-950/30 space-y-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>What Would Change the Answer?</span>
                              </span>
                              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {msg.structuredAnswer.whatWouldChangeAnswer.map((fact: string, idx: number) => (
                                  <li key={idx}>{fact}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {/* 5. Follow-Up Questions (Max 3) */}
                        {msg.structuredAnswer.followUpQuestions &&
                          msg.structuredAnswer.followUpQuestions.length > 0 && (
                            <div className="p-3.5 rounded-lg border border-sky-200/80 bg-sky-50/50 dark:border-sky-950 dark:bg-sky-950/30 space-y-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                <span>Follow-Up Questions to Clarify</span>
                              </span>
                              <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {msg.structuredAnswer.followUpQuestions.map((fq: string, idx: number) => (
                                  <li key={idx}>{fq}</li>
                                ))}
                              </ol>
                            </div>
                          )}

                        {/* 6. What to Do Next */}
                        {msg.structuredAnswer.whatToDoNext && (
                          <div className="p-3.5 rounded-lg border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-950 dark:bg-emerald-950/30 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>What to Do Next (Preparation Step)</span>
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {msg.structuredAnswer.whatToDoNext}
                            </p>
                          </div>
                        )}

                        {/* 7. Verified Statutory Sources */}
                        {msg.structuredAnswer.sources && msg.structuredAnswer.sources.length > 0 && (
                          <div className="pt-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                              Verified Legal Sources Cited
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.structuredAnswer.sources.map((src) => (
                                <a
                                  key={src.id}
                                  href={src.url || src.sourceUrl || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-start justify-between gap-2 text-left"
                                >
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                                      {src.citation || src.title}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block">
                                      {src.publisher || src.jurisdiction} · {src.authorityType?.toUpperCase() || "STATUTE"}
                                    </span>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Disclaimer Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Non-binding legal information. Consult qualified legal counsel for professional advice.</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex items-center gap-3">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Reviewing document clauses and verifying legal context...
              </p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-2 sticky bottom-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={2}
            placeholder="Ask anything about this agreement, specific clauses, risks, or next steps..."
            className="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden disabled:opacity-60 px-2 py-1 leading-relaxed"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer transition-colors shrink-0 shadow-xs"
            title="Send question (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>Press <kbd className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Enter</kbd> to send, <kbd className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Shift+Enter</kbd> for newline</span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Grounded Legal Intelligence</span>
          </span>
        </div>
      </div>
    </div>
  );
}
