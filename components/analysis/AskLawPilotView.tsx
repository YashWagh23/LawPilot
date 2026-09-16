"use client";

import React, { useState, useEffect, useRef } from "react";
import type { AnalysisReport, EvidenceChain } from "@/types";
import type {
  AskAnswerStructure,
  AskConversationMessage,
} from "@/types/ask";
import {
  Send,
  Copy,
  Check,
  RotateCcw,
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

  // Suggested questions — phrased as text links, not pills
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

      let data: { success?: boolean; answer?: AskAnswerStructure; error?: string } = {};
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `The question service returned an unreadable response (HTTP ${response.status}). Please try again.`
        );
      }

      if (!response.ok || !data.success || !data.answer) {
        throw new Error(data.error || "Unable to get an answer from LawPilot.");
      }

      const structuredAnswer = data.answer;
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
      {/* Header — open, no card wrapping */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Ask about {report.metadata.title}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Ask any question in plain English. LawPilot answers using only your agreement and verified Indian law.
            </p>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearConversation}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Suggested questions — text links, not pill buttons */}
        {messages.length === 0 && (
          <div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
              Suggested:
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conversation Thread */}
      <div className="space-y-6 min-h-[240px]">
        {messages.length === 0 ? (
          /* Empty state — plain text, no icon in circle */
          <div className="py-8 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Type your question below or click a suggestion above.
            </p>
          </div>
        ) : (
          messages.map((msg: AskConversationMessage) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                /* User Message — right-aligned, minimal */
                <div className="flex justify-end">
                  <div className="max-w-xl space-y-0.5">
                    <p className="text-[11px] text-slate-400 text-right">You</p>
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-lg rounded-tr-sm">
                      <p className="text-sm text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Assistant Message — open layout, no card */
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">LawPilot</p>

                  {/* Plain English Answer */}
                  <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap lp-text-pretty">
                    {msg.content}
                  </div>

                  {/* Supporting Details (collapsible) */}
                  {msg.structuredAnswer && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <button
                        type="button"
                        onClick={() => toggleDetails(msg.id)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        <span>{expandedDetailsMap[msg.id] ? "Hide sources" : "Show contract quote & legal source"}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandedDetailsMap[msg.id] ? "rotate-180" : ""}`} />
                      </button>

                      {expandedDetailsMap[msg.id] && (
                        <div className="mt-3 space-y-3 text-xs lp-animate-slide-down">
                          {msg.structuredAnswer.whatDocumentSays && (
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-400" />
                                Contract quote
                              </p>
                              <blockquote className="lp-quote">
                                &ldquo;{msg.structuredAnswer.whatDocumentSays}&rdquo;
                              </blockquote>
                            </div>
                          )}

                          {msg.structuredAnswer.legalContext && (
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Scale className="w-3 h-3 text-blue-400" />
                                Legal context
                              </p>
                              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                {msg.structuredAnswer.legalContext}
                              </p>
                            </div>
                          )}

                          {msg.structuredAnswer.whatToDoNext && (
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                Recommended next step
                              </p>
                              <p className="text-slate-600 dark:text-slate-300">
                                {msg.structuredAnswer.whatToDoNext}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Copy action */}
                  <div className="flex items-center pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyAnswer(msg.id, msg.content)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600">Copied</span>
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
              )}
            </div>
          ))
        )}

        {/* Loading indicator — text, no spinner in circle */}
        {isLoading && (
          <div className="lp-animate-fade-in">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">LawPilot</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 animate-pulse">
              Analyzing your document and applicable legal authorities...
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Input — clean, minimal */}
      <div className="sticky bottom-3 z-10 border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg p-2.5 focus-within:border-indigo-400 dark:focus-within:border-indigo-700 transition-colors shadow-sm">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your document..."
            className="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden py-1"
          />
          <button
            type="button"
            disabled={!inputText.trim() || isLoading}
            onClick={() => handleSend()}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md bg-slate-900 text-white dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
            aria-label="Send question"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
