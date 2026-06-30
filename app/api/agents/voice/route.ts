import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    const { text, history, context } = await req.json();

    const systemPrompt = `You are FocusFlow AI, an intelligent conversational productivity assistant.
The user just said: "${text}".

Conversation History:
${JSON.stringify(history || [], null, 2)}

You have access to the user's current project context:
${JSON.stringify(context, null, 2)}

Active AI Mode: ${context?.activeMode || 'Coach'}
Personality Rules based on Active Mode:
- **Focus Mode**: Be extremely concise and direct. Respond only to the prompt. Do not provide motivational messages, greetings, or extra context.
- **Coach Mode**: Be encouraging, friendly, and explain why tasks or actions matter. Offer praise when tasks are completed. Provide a brief weekly productivity summary if requested.
- **Accountability Mode**: Be strict, urgent, and proactive. Remind the user frequently about their deadlines. Warn them sternly if they are falling behind or if inactive. Recommend recovery plans immediately if progress stalls.

You must respond with a JSON object in exactly this format:
{
  "reply": "Your concise, conversational response to the user. Max 2 sentences.",
  "action": {
    "type": "NAVIGATE | COMPLETE_TASK | ADD_TASK | ADD_GOAL | ANALYZE_RISK | GENERATE_RECOVERY | NONE",
    "payload": {}
  }
}

Action Rules:
- If they ask to navigate to dashboard, tasks, goals, or to create a goal manually, use "NAVIGATE" with payload {"path": "/dashboard" | "/tasks" | "/goals" | "/goals/new"}.
- If they ask to complete or mark a task as done, use "COMPLETE_TASK" with payload {"taskId": "the-id-of-the-task"}. Try to find the closest matching task in the context.
- If they ask to create or add a task, use "ADD_TASK" with payload {"title": "task name"}.
- If they ask to create a goal, you MUST collect: Title, Description, Deadline, and Available Hours. If any details are missing or if the deadline is unclear, ask the user to clarify and specify the month, date, and year. Return "NONE" and ask the user for the missing details in your reply. Only when you have ALL four pieces of information, use "ADD_GOAL" with payload {"title": "...", "description": "...", "deadline": "YYYY-MM-DD", "availableHours": "..."}.
- If they ask to analyze risk, use "ANALYZE_RISK" with payload {"goalId": "the-id-of-the-goal"}. If no specific goal is mentioned, use the first goal in the context.
- If they ask for a recovery plan, use "GENERATE_RECOVERY" with payload {"goalId": "the-id-of-the-goal"}. If no specific goal is mentioned, use the first goal.
- If they just ask a question (e.g., "What should I do next?", "How many tasks are left?", "What's my schedule?"), use "NONE" and just provide the answer in the "reply" field based on the context.
- Unrecognized Input: If you do not understand the user's request, query, or command, you MUST reply asking the user: "What is that?".

Respond ONLY with valid JSON. Do not include markdown formatting or backticks.`;

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY === 'your_gemini_api_key_here') {
      // Mock mode if API key isn't provided
      console.log('Mocking Gemini API response for:', text);
      let reply = "What is that?"; // Default fallback query to "What is that?"
      let action = { type: 'NONE', payload: {} };
      
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('add task') || lowerText.includes('create task')) {
        const taskName = lowerText.replace(/add task|create task/i, '').trim() || 'New AI Task';
        reply = `I have added "${taskName}" to your task list. Let's get to work!`;
        action = { type: 'ADD_TASK', payload: { title: taskName } };
      } else if (lowerText.includes('what should i do next') || lowerText.includes('what should i work on')) {
         reply = "Based on your context, Backend API Development is your highest priority task.";
      } else if (lowerText.includes('create goal') || lowerText.includes('new goal')) {
         // Ask for month, date, and year
         reply = "To create a goal, please provide the title, description, and the deadline specifying the month, date, and year.";
         action = { type: 'NONE', payload: {} };
      } else if (lowerText.includes('dashboard')) {
         reply = "Opening the dashboard command center.";
         action = { type: 'NAVIGATE', payload: { path: '/dashboard' } };
      } else if (lowerText.includes('tasks')) {
         reply = "Here are your tasks.";
         action = { type: 'NAVIGATE', payload: { path: '/tasks' } };
      } else if (lowerText.includes('goals')) {
         reply = "Here are your goals.";
         action = { type: 'NAVIGATE', payload: { path: '/goals' } };
      }
      
      return NextResponse.json({ reply, action });
    }

    let aiText;
    let lastError = "";

    // 1. Try Direct Google SDK First
    if (geminiKey.trim() && geminiKey !== 'your_gemini_api_key_here') {
      try {
        console.log('Routing voice request through Google SDK...');
        const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: systemPrompt,
        });
        aiText = response.text || '';
      } catch (e: any) {
        console.warn("Google SDK Failed for Voice Agent, falling back to OpenRouter:", e.message);
        lastError = e.message;
      }
    }

    // 2. Try OpenRouter Fallbacks
    if (openRouterKey.trim() && !aiText) {
      const fallbackModels = [
        "google/gemma-2-9b-it:free",
        "cohere/north-mini-code:free"
      ];

      for (const model of fallbackModels) {
        try {
          console.log(`Trying OpenRouter voice model: ${model}...`);
          const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey.trim()}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: "user", content: systemPrompt }]
            })
          });

          if (!orResponse.ok) continue;

          const orData = await orResponse.json();
          aiText = orData.choices[0].message.content || "";
          if (aiText) break; // Success
        } catch (e: any) {
          console.warn(`Voice Model ${model} failed:`, e.message);
          lastError = e.message;
        }
      }
    }

    // 3. Ultimate Graceful Fallback
    if (!aiText) {
      return NextResponse.json({
        reply: "I'm having trouble connecting to my AI providers right now.",
        action: { type: 'NONE', payload: {} }
      });
    }
    
    // Clean up markdown block if present
    aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const firstBrace = aiText.indexOf('{');
    const lastBrace = aiText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      aiText = aiText.substring(firstBrace, lastBrace + 1);
    }
    
    try {
      const parsed = JSON.parse(aiText);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("Failed to parse JSON from AI:", aiText);
      return NextResponse.json({ reply: "What is that?", action: { type: 'NONE', payload: {} } });
    }

  } catch (error: any) {
    console.error('Error in Voice Agent:', error);
    return NextResponse.json(
      { error: 'Failed to process voice command' },
      { status: 500 }
    );
  }
}
