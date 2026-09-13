"use client";

import React, { useState, useEffect, useRef } from "react";
import type { AnalysisReport, EvidenceChain } from "@/types";
import type {
  AskAnswerStructure,
  AskConversationMessage,
} from "@/types/ask";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  FileText,
  Scale,
} from "lucide-react";

interface AskLawPilotViewProps {
  report: AnalysisReport;
  onJumpToClause?: (clauseId: string) => void;
  onOpenChain?: (chain: EvidenceChain) => void;
}

export function AskLawPilotView({
  report,
  onJumpToClause: _onJumpToClause,
  onOpenChain: _onOpenChain,
}: AskLawPilotViewProps) {
  const storageKey = `lawpilot_ask_${report.id}`;
  const [messages, setMessages] = useState<AskConversationMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
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
  const [expandedDetailsMap, setExpandedDetailsMap] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Suggested questions tailored to non-lawyers
  const suggestedQuestions = [
    "Why was this flagged?",
    "What does this clause mean?",
    "What should I ask HR?",
    "What is my notice period?",
  ];

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

  // Toggle supporting details for an answer
  const toggleDetails = (msgId: string) => {
    setExpandedDetailsMap((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Handle Question Submission
  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    setInputText("");

    const nowIso = new Date().toISOString();
    const userMessage: AskConversationMessage = {
      id: `user-${report.id}-${messages.length + 1}`,
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
        id: structuredAnswer?.id || `ans-${report.id}-${updatedMessages.length + 1}`,
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Ask about your document
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ask any question in plain English. LawPilot answers using only your agreement and verified Indian law.
            </p>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearConversation}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>

        {/* Suggested Question Pills */}
        <div className="pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Suggested questions:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-indigo-950/60 dark:hover:border-indigo-900 dark:hover:text-indigo-300 transition-colors cursor-pointer text-left"
              >
                <span>{q}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4 min-h-[260px]">
        {messages.length === 0 ? (
          /* Clean Empty State */
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mx-auto">
              <Bot className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Have a question about {report.metadata.title}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Type your question below or click one of the suggestions above.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg: AskConversationMessage) => (
            <div key={msg.id} className="space-y-3">
              {msg.role === "user" ? (
                /* User Message */
                <div className="flex items-start justify-end gap-2">
                  <div className="max-w-xl rounded-2xl rounded-tr-xs bg-indigo-600 text-white px-4 py-2.5 shadow-xs">
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0 text-xs font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                </div>
              ) : (
                /* Assistant Message — Clean, direct, human */
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>

                  <div className="flex-1 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
                    {/* Plain English Answer */}
                    <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {/* Supporting Details (Collapsible progressive disclosure) */}
                    {msg.structuredAnswer && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => toggleDetails(msg.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          <span>{expandedDetailsMap[msg.id] ? "Hide supporting details" : "Show contract quote & legal source"}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandedDetailsMap[msg.id] ? "rotate-180" : ""}`} />
                        </button>

                        {expandedDetailsMap[msg.id] && (
                          <div className="mt-3 pt-3 space-y-3 text-xs border-t border-slate-100 dark:border-slate-800/80 lp-animate-slide-down">
                            {msg.structuredAnswer.whatDocumentSays && (
                              <div className="space-y-1">
                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-indigo-500" />
                                  <span>Contract Quote:</span>
                                </span>
                                <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
                                  &ldquo;{msg.structuredAnswer.whatDocumentSays}&rdquo;
                                </p>
                              </div>
                            )}

                            {msg.structuredAnswer.legalContext && (
                              <div className="space-y-1">
                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                  <Scale className="w-3 h-3 text-blue-500" />
                                  <span>Legal Context:</span>
                                </span>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {msg.structuredAnswer.legalContext}
                                </p>
                              </div>
                            )}

                            {msg.structuredAnswer.whatToDoNext && (
                              <div className="space-y-1">
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                  Recommended Next Step:
                                </span>
                                <p className="text-slate-700 dark:text-slate-300">
                                  {msg.structuredAnswer.whatToDoNext}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer / Copy Action */}
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyAnswer(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5 lp-animate-fade-in">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0 mt-0.5">
              <span className="h-3 w-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                LawPilot is analyzing your document and Indian legal authorities...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Notice if API fails */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Input Box — Sticky above mobile virtual keyboards */}
      <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 dark:border-slate-800 dark:bg-slate-900/95 shadow-md focus-within:border-indigo-500 transition-colors">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your document (e.g., 'What happens if I resign early?')"
            className="flex-1 resize-none bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden py-1"
          />
          <button
            type="button"
            disabled={!inputText.trim() || isLoading}
            onClick={() => handleSend()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0 shadow-xs"
            aria-label="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
