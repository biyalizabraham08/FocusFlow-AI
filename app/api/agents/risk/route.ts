import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    
    const body = await req.json();
    const { title, successProbability, riskLevel, totalTasks, completedTasks, daysRemaining, tasks } = body;

    const pendingTasksList = tasks
      .filter((t: any) => t.status !== 'done')
      .map((t: any) => `- ${t.title} (${t.priority} Priority, ${t.durationMinutes / 60}h)`)
      .join('\n');

    const prompt = `
      You are an elite AI Risk Analyst and Recovery Agent for a productivity platform.
      A user has requested a risk analysis on their current goal.
      
      Goal: ${title}
      Success Probability: ${successProbability}%
      Calculated Risk Level: ${riskLevel}
      
      Progress: ${completedTasks} out of ${totalTasks} tasks completed.
      Time Remaining: ${daysRemaining} days.
      
      Pending Tasks:
      ${pendingTasksList}

      Your job is to provide a concise, sharp, and highly actionable "AI Risk Explanation".
      1. Explain *why* the risk level is what it is (e.g., "You only have 2 days left but 4 Critical tasks remaining").
      2. Provide a specific, actionable recovery suggestion focusing on the most important pending task.
      
      CRITICAL: You MUST respond ONLY with a valid JSON object matching this structure exactly:
      {
        "aiRiskExplanation": "Your explanation and recovery suggestion here (2-3 sentences max)."
      }
    `;

    let explanation;

    // 1. Try Direct Google SDK First
    if (geminiKey.trim()) {
      try {
        console.log('Routing risk request through Google SDK...');
        const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: "application/json",
          }
        });

        let rawText = response.text || "{}";
        rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        explanation = JSON.parse(rawText);
        return NextResponse.json(explanation);
      } catch (e: any) {
        console.warn("Google SDK Failed for Risk Agent, falling back to OpenRouter:", e.message);
      }
    }

    // 2. Try OpenRouter Fallbacks
    if (openRouterKey.trim() && !explanation) {
      const fallbackModels = [
        "google/gemma-2-9b-it:free",
        "cohere/north-mini-code:free"
      ];

      for (const model of fallbackModels) {
        try {
          console.log(`Trying OpenRouter risk model: ${model}...`);
          const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey.trim()}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: "user", content: prompt }]
            })
          });

          if (!orResponse.ok) continue;

          const orData = await orResponse.json();
          let rawText = orData.choices[0].message.content || "{}";
          
          rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            rawText = rawText.substring(firstBrace, lastBrace + 1);
          }

          explanation = JSON.parse(rawText);
          return NextResponse.json(explanation); 
        } catch (e: any) {
          console.warn(`Risk Model ${model} failed:`, e.message);
        }
      }
    }

    // 3. Mock Fallback
    if (!explanation) {
      return NextResponse.json({ 
        aiRiskExplanation: `Because you have ${daysRemaining} days left with ${totalTasks - completedTasks} tasks remaining, your risk level is ${riskLevel}. Focus immediately on the most critical pending task to improve your success probability.` 
      });
    }

  } catch (error) {
    console.error('Error generating risk explanation:', error);
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
  }
}
