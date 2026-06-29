import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    
    const body = await req.json();
    const { title, riskLevel, successProbability, daysRemaining, availableHours, pendingTasks, currentSchedule } = body;

    const pendingTasksList = pendingTasks
      .map((t: any) => `- ${t.title} (${t.priority} Priority, ${t.durationMinutes / 60}h)`)
      .join('\n');

    const prompt = `
      You are an elite AI Recovery Agent for a productivity platform.
      A user's goal has entered a dangerous risk state and requires immediate intervention.
      
      Goal: ${title}
      Risk Level: ${riskLevel}
      Success Probability: ${successProbability}%
      
      Time Remaining: ${daysRemaining} days
      Available Hours Per Day: ${availableHours || 8}
      
      Pending Tasks:
      ${pendingTasksList}

      Current Schedule:
      ${JSON.stringify(currentSchedule, null, 2)}

      Your job is to generate a comprehensive "Recovery Plan".
      
      CRITICAL: You MUST respond ONLY with a valid JSON object matching this structure exactly:
      {
        "recommendations": ["Recommendation 1", "Recommendation 2"],
        "revisedPriorities": ["Priority change 1", "Priority change 2"],
        "focusActions": ["Immediate action 1", "Immediate action 2"],
        "newSchedule": [
          {
            "day": "DayName (e.g., Monday)",
            "tasks": [
              { "taskTitle": "Task 1", "hours": 2 }
            ]
          }
        ]
      }
      
      Make sure the new schedule drops low-priority tasks if time is short, and focuses purely on Critical/High priority tasks required to save the deadline. Ensure it fits within the Available Hours Per Day.
    `;

    let plan;

    // 1. Try Direct Google SDK First
    if (geminiKey.trim()) {
      try {
        console.log('Routing recovery request through Google SDK...');
        const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
          }
        });

        let rawText = response.text || "{}";
        rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        plan = JSON.parse(rawText);
        return NextResponse.json(plan);
      } catch (e: any) {
        console.warn("Google SDK Failed for Recovery Agent, falling back to OpenRouter:", e.message);
      }
    }

    // 2. Try OpenRouter Fallbacks
    if (openRouterKey.trim() && !plan) {
      const fallbackModels = [
        "google/gemma-2-9b-it:free",
        "cohere/north-mini-code:free"
      ];

      for (const model of fallbackModels) {
        try {
          console.log(`Trying OpenRouter recovery model: ${model}...`);
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

          plan = JSON.parse(rawText);
          return NextResponse.json(plan); 
        } catch (e: any) {
          console.warn(`Recovery Model ${model} failed:`, e.message);
        }
      }
    }

    // 3. Mock Fallback
    if (!plan) {
      return NextResponse.json({ 
        recommendations: ["Drop non-essential features", "Focus entirely on backend logic today"],
        revisedPriorities: ["Elevated 'Backend API' to highest priority"],
        focusActions: ["Start a 2-hour focus block on Backend API immediately"],
        newSchedule: [
          {
            day: "Today (Recovery Mode)",
            tasks: [{ taskTitle: pendingTasks[0]?.title || "Critical Work", hours: 4 }]
          }
        ]
      });
    }

  } catch (error) {
    console.error('Error generating recovery plan:', error);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
