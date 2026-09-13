import { GoogleGenAI } from "@google/genai";

/**
 * Server-Side Gemini AI Client
 * Strictly server-side: Never exposed to client components.
 */

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  return geminiClient;
}

export const GEMINI_CONFIG = {
  defaultModel: "gemini-2.5-flash",
  reasoningModel: "gemini-2.5-pro",
  temperature: 0.2, // Low temperature for high precision and grounded legal analysis
  maxOutputTokens: 8192,
};
