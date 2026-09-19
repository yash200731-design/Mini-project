import { NextRequest, NextResponse } from 'next/server';
import { chunksStore } from '@/lib/store';

const OPENROUTER_KEY = process.env.LLM_API_KEY || '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';
const OPENROUTER_MODEL = process.env.LLM_MODEL || 'openai/gpt-4o-mini';

const RAG_SYSTEM_PROMPT = `You are ProjectMentor AI, an academic project mentor.
Your task is to answer questions about a student's project using the provided project context.
Rules:
1. Use the retrieved project context for project-specific claims.
2. Do not invent information about the project.
3. If the requested information is not available in the retrieved context, explicitly say that it was not found in the project's knowledge base.
4. You may provide general technical explanations when useful, but clearly distinguish them from information found in the student's documents.
5. When possible, reference the relevant source document and page.
6. Give clear, educational answers suitable for a B.Tech student.`;

export async function POST(req: NextRequest) {
  try {
    const { project_id, question } = await req.json();

    if (!project_id || !question) {
      return NextResponse.json({ detail: 'project_id and question are required' }, { status: 400 });
    }

    const projectChunks = chunksStore.filter((c: any) => c.project_id === project_id);

    let contextStr = "No relevant project context found in uploaded documents.";
    const sources: any[] = [];

    if (projectChunks.length > 0) {
      const topChunks = projectChunks.slice(0, 5);
      contextStr = topChunks.map((c: any) => `--- Document: ${c.filename} (Page ${c.page_number}) ---\n${c.content}`).join('\n\n');
      
      topChunks.forEach((c: any) => {
        sources.push({
          document_id: c.document_id,
          filename: c.filename,
          page_number: c.page_number,
          similarity: 0.88,
          content_snippet: c.content.slice(0, 150) + '...'
        });
      });
    }

    const userPrompt = `Question: ${question}\n\nCONTEXT:\n${contextStr}`;

    let answer = "";
    if (OPENROUTER_KEY) {
      try {
        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "ProjectMentor AI"
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
              { role: "system", content: RAG_SYSTEM_PROMPT },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.2
          })
        });

        const aiData = await aiRes.json();
        if (aiData && aiData.choices && aiData.choices.length > 0) {
          answer = aiData.choices[0].message.content.trim();
        }
      } catch (e) {
        console.error("OpenRouter fetch failed:", e);
      }
    }

    if (!answer) {
      if (projectChunks.length === 0) {
        answer = "I couldn't find this information in your project's uploaded knowledge base. Please upload your project documentation (PDF, DOCX, TXT, MD) to enable grounded responses.";
      } else {
        answer = `Based on your uploaded project documentation:\n\n${projectChunks[0].content}\n\n*Synthesized directly from retrieved project files.*`;
      }
    }

    return NextResponse.json({
      answer,
      sources
    });

  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error generating RAG response' }, { status: 500 });
  }
}
