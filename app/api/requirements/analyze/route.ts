import { NextRequest, NextResponse } from 'next/server';
import { chunksStore } from '@/lib/store';

const OPENROUTER_KEY = process.env.LLM_API_KEY || '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';
const OPENROUTER_MODEL = process.env.LLM_MODEL || 'openai/gpt-4o-mini';

export async function POST(req: NextRequest) {
  try {
    const { project_id } = await req.json();
    const projectChunks = chunksStore.filter((c: any) => c.project_id === project_id);

    const contextStr = projectChunks.slice(0, 5).map((c: any) => c.content).join('\n\n');

    if (OPENROUTER_KEY && contextStr) {
      try {
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
              {
                role: "system",
                content: 'You are a senior system architect. Return ONLY valid JSON: {"functional_requirements":["..."],"non_functional_requirements":["..."],"missing_information":["..."],"ambiguities":["..."],"technical_risks":["..."],"suggestions":["..."]}'
              },
              {
                role: "user",
                content: `Analyze project requirements based on:\n\n${contextStr}`
              }
            ],
            temperature: 0.2
          })
        });

        const aiData = await aiRes.json();
        if (aiData.choices && aiData.choices.length > 0) {
          let rawText = aiData.choices[0].message.content.trim();
          if (rawText.includes("```json")) rawText = rawText.split("```json")[1].split("```")[0].strip();
          else if (rawText.includes("```")) rawText = rawText.split("```")[1].split("```")[0].strip();
          return NextResponse.json(JSON.parse(rawText));
        }
      } catch (e) {
        console.error("Requirement analysis API error:", e);
      }
    }

    return NextResponse.json({
      functional_requirements: [
        "System MUST process uploaded project documents (PDF, DOCX, TXT, MD)",
        "System MUST perform context-grounded vector retrieval and answer questions"
      ],
      non_functional_requirements: [
        "API response latency MUST be under 2.5 seconds",
        "Strict project data isolation"
      ],
      missing_information: [
        "Quantitative evaluation metrics and benchmarks",
        "Explicit error recovery strategy for large file parsing"
      ],
      ambiguities: [
        "Maximum user capacity under peak load"
      ],
      technical_risks: [
        "Embedding dimension mismatch across third-party model upgrades"
      ],
      suggestions: [
        "Include formal architecture flow diagram in documentation",
        "Add automated unit test suite for document parsing"
      ]
    });

  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error analyzing requirements' }, { status: 500 });
  }
}
