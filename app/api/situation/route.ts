import { NextRequest, NextResponse } from "next/server";
import { analyzeSituation, sanitizeSituationInput } from "@/lib/ai/situation/situationEngine";
import { checkRateLimit } from "@/lib/safety/rateLimiter";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(request, "situation", 15, 60_000);
    if (rateLimit.limited) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body. Please provide a situation description.",
        },
        { status: 400 }
      );
    }

    const rawInput =
      typeof body?.situationText === "string"
        ? body.situationText
        : typeof body?.promptText === "string"
        ? body.promptText
        : typeof body?.text === "string"
        ? body.text
        : "";
    const { valid, sanitized, error } = sanitizeSituationInput(rawInput);

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          error: error || "Describe what happened so LawPilot can identify the relevant issues.",
        },
        { status: 400 }
      );
    }

    const assessment = await analyzeSituation(sanitized);

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (err) {
    console.error("Error in /api/situation route:", err);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't analyze this situation right now. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Live AI calls can take several seconds; the default serverless limit is too tight.
export const maxDuration = 60;
