import { NextRequest, NextResponse } from "next/server";
import { analyzeSituation, sanitizeSituationInput } from "@/lib/ai/situation/situationEngine";

export async function POST(request: NextRequest) {
  try {
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
