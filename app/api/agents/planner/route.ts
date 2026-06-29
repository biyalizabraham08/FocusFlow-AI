import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    
    const body = await req.json();
    const { title, description, deadline, availableHours, category } = body;

    const prompt = `
      You are an elite productivity and goal-planning AI agent.
      A user has submitted the following goal:
      Title: ${title}
      Description: ${description}
      Deadline: ${deadline}
      Available Hours Per Day: ${availableHours}
      Category: ${category}

      Break this goal down into a highly actionable execution plan consisting of specific tasks.
      For each task, estimate the effort in hours and assign a priority level (Low, Medium, High, Critical).

      CRITICAL CONSTRAINTS FOR EFFORT ESTIMATION:
      Because the user has access to modern AI tools (like ChatGPT, Claude) to accelerate their work, your time estimates must be highly aggressive. 
      - Research, planning, and writing tasks should take no more than 0.5 to 1 hour.
      - Development tasks should be broken down into small 1 to 2 hour chunks.
      Do not give any single task a duration of 3 or 4 hours. Keep them small and fast.

      Also, provide a brief 'aiSummary' (2-3 sentences) summarizing the effort required and identifying the most critical milestones.
      Provide the 'estimatedTotalHours' as an integer representing the sum of all task hours.

      You MUST respond ONLY with a valid JSON object matching the following structure exactly:
      {
        "aiSummary": "Your summary here.",
        "estimatedTotalHours": 15,
        "tasks": [
          {
            "task": "Task Name",
            "hours": 2,
            "priority": "High"
          }
        ]
      }
      Do not include markdown code block formatting (like \`\`\`json), just the raw JSON object.
    `;

    let plan;
    let lastError = "";

    // 1. Try Direct Google SDK First (Since you are in a Google Hackathon!)
    if (geminiKey.trim()) {
      try {
        console.log('Routing request through Google SDK...');
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
        console.warn("Google SDK Failed, falling back to OpenRouter:", e.message);
        lastError = e.message;
      }
    }

    // 2. Try OpenRouter Fallbacks
    if (openRouterKey.trim() && !plan) {
      const fallbackModels = [
        "google/gemma-2-9b-it:free", // Prioritize Google's open model!
        "cohere/north-mini-code:free" // Backup if Gemma is unavailable
      ];

      for (const model of fallbackModels) {
        try {
          console.log(`Trying OpenRouter model: ${model}...`);
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

          if (!orResponse.ok) {
            const errorText = await orResponse.text();
            throw new Error(`OpenRouter Error: ${orResponse.statusText} - ${errorText}`);
          }

          const orData = await orResponse.json();
          let rawText = orData.choices[0].message.content || "{}";
          console.log(`Raw Output from ${model}:`, rawText);
          
          rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            rawText = rawText.substring(firstBrace, lastBrace + 1);
          }

          plan = JSON.parse(rawText);
          return NextResponse.json(plan); // Success! Break the loop and return
        } catch (e: any) {
          console.warn(`Model ${model} failed:`, e.message);
          lastError = e.message;
          // Continue to the next model in the loop
        }
      }
    }

    // 3. Ultimate Graceful Fallback
    if (!plan) {
      console.error('All AI APIs Failed. Using static mockup.');
      plan = {
        aiSummary: `Generated via Offline Fallback System (Error: ${lastError}). Your goal "${title}" has been structured into manageable steps.`,
        estimatedTotalHours: parseInt(availableHours) * 3 || 12,
        tasks: [
          { task: `Initial planning and setup for: ${title}`, hours: 2, priority: "Medium" },
          { task: `Core execution phase 1 for: ${title}`, hours: Math.max(1, parseInt(availableHours) - 1), priority: "Critical" },
          { task: `Core execution phase 2 for: ${title}`, hours: parseInt(availableHours), priority: "High" },
          { task: `Final review and completion of: ${title}`, hours: 2, priority: "Medium" }
        ]
      };
    }

    return NextResponse.json(plan);

  } catch (error) {
    console.error('Error generating goal plan:', error);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
