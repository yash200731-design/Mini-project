import { NextRequest, NextResponse } from 'next/server';
import { chunksStore } from '@/lib/store';

const OPENROUTER_KEY = process.env.LLM_API_KEY || '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';
const OPENROUTER_MODEL = process.env.LLM_MODEL || 'openai/gpt-4o-mini';

export async function POST(req: NextRequest) {
  try {
    const { project_id, difficulty = 'medium', count = 10 } = await req.json();
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
                content: 'You are an external viva examiner. Return ONLY a valid JSON array of objects: [{"question":"...","topic":"...","difficulty":"easy|medium|hard","expected_points":["..."]}]'
              },
              {
                role: "user",
                content: `Generate ${count} viva questions at '${difficulty}' difficulty based on:\n\n${contextStr}`
              }
            ],
            temperature: 0.3
          })
        });

        const aiData = await aiRes.json();
        if (aiData.choices && aiData.choices.length > 0) {
          let rawText = aiData.choices[0].message.content.trim();
          if (rawText.includes("```json")) rawText = rawText.split("```json")[1].split("```")[0].strip();
          else if (rawText.includes("```")) rawText = rawText.split("```")[1].split("```")[0].strip();
          const parsed = JSON.parse(rawText);
          return NextResponse.json({ questions: parsed.slice(0, count) });
        }
      } catch (e) {
        console.error("Viva generation API error:", e);
      }
    }

    return NextResponse.json({
      questions: [
        {
          question: "What is the primary problem statement and core objective of your system?",
          topic: "Problem Statement",
          difficulty: difficulty,
          expected_points: ["Clear target problem scope", "Expected user benefit", "Measurable objective"]
        },
        {
          question: "Can you explain the high-level system architecture and data flow?",
          topic: "Architecture",
          difficulty: difficulty,
          expected_points: ["Client-server boundaries", "API contracts", "Database persistence layer"]
        },
        {
          question: "What key algorithms or frameworks were chosen and why?",
          topic: "Methodology",
          difficulty: difficulty,
          expected_points: ["Technology trade-offs", "Performance efficiency", "Alternative comparison"]
        }
      ]
    });

  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error generating viva questions' }, { status: 500 });
  }
}
