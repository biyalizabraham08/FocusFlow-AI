import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

// Configure CORS to allow all origins during development
app.use(cors({
  origin: "*",
  credentials: false
}));

app.use(express.json());

const PORT = process.env.PORT || 3001;

// ==========================================
// 1. Goal Planner Agent
// ==========================================
app.post('/api/agents/planner', async (req, res) => {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || '';
    
    const { title, description, deadline, availableHours, category } = req.body;

    const prompt = `
      You are an elite productivity and goal-planning AI agent.
      A user has submitted the following goal:
      Title: ${title}
      Description: ${description}
      Deadline: ${deadline}
      Available Hours Per Day: ${availableHours}
      Category: ${category}

      CRITICAL INSTRUCTIONS:
      1. UNDERSTAND THE GOAL FIRST: Before creating tasks, carefully analyze what the goal actually entails. Base your tasks on a deep understanding of the subject matter.
      2. INTELLIGENT TASK GROUPING: Do not generate blindly repetitive tasks (e.g., "Learn item 1", "Learn item 2"). Group small items logically.
      3. DEADLINE & TASK LIMIT: Strictly tailor the number of tasks to the deadline. If the deadline is short (e.g., 2 days), do NOT generate 20+ tasks. Keep the total number of tasks manageable and realistic for the given timeframe.
      4. REALISTIC TIME ESTIMATES: Time estimates must make sense for the specific goal. If a task takes 5 minutes in reality, do not assign it 1 hour. Keep time estimates highly realistic, but aggressive.

      Break this goal down into a highly actionable execution plan consisting of specific tasks.
      For each task, estimate the effort in hours (can be decimals like 0.25 for 15 mins) and assign a priority level (Low, Medium, High, Critical).

      Also, provide a brief 'aiSummary' (2-3 sentences) summarizing your understanding of the goal, the effort required, and identifying the most critical milestones.
      Provide the 'estimatedTotalHours' as a number representing the sum of all task hours.

      You MUST respond ONLY with a valid JSON object matching the following structure exactly:
      {
        "aiSummary": "Your summary here.",
        "estimatedTotalHours": 15,
        "tasks": [
          {
            "task": "Task Name",
            "hours": 0.5,
            "priority": "High"
          }
        ]
      }
      Do not include markdown code block formatting (like \`\`\`json), just the raw JSON object.
    `;

    let plan;
    let lastError = "";

    // 1. Try Direct Google SDK First
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
        return res.json(plan);
      } catch (e) {
        console.warn("Google SDK Failed, falling back to OpenRouter:", e.message);
        lastError = e.message;
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
          return res.json(plan); 
        } catch (e) {
          console.warn(`Model ${model} failed:`, e.message);
          lastError = e.message;
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

    return res.json(plan);

  } catch (error) {
    console.error('Error generating goal plan:', error);
    return res.status(500).json({ error: 'Failed to generate plan' });
  }
});

// ==========================================
// 2. Scheduler Agent
// ==========================================
function generateFallbackSchedule(goalId, workingWindow, tasks) {
  const pad = (n) => n.toString().padStart(2, '0');
  
  // parse slots
  let slots = [];
  if (workingWindow) {
    const starts = workingWindow.start.split(",");
    const ends = workingWindow.end.split(",");
    for (let i = 0; i < starts.length; i++) {
      if (!starts[i] || !ends[i]) continue;
      const [sh, sm] = starts[i].split(":").map(Number);
      const [eh, em] = ends[i].split(":").map(Number);
      slots.push({
        startMin: sh * 60 + sm,
        endMin: eh * 60 + em,
        startStr: starts[i],
        endStr: ends[i]
      });
    }
  }
  
  if (slots.length === 0) {
    slots.push({ startMin: 9 * 60, endMin: 17 * 60, startStr: "09:00", endStr: "17:00" });
  }

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const currentDayIdx = today.getDay();
  const currentTotalMin = today.getHours() * 60 + today.getMinutes();
  const days = [];
  
  let currentDayOffset = 0;
  let currentSlotIdx = 0;
  let currentMinutes = slots[0].startMin;

  // Adjust for today's passed time
  let foundSlotForToday = false;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].endMin > currentTotalMin) {
      currentSlotIdx = i;
      currentMinutes = Math.max(slots[i].startMin, currentTotalMin);
      foundSlotForToday = true;
      break;
    }
  }
  
  if (!foundSlotForToday) {
    currentDayOffset = 1;
    currentSlotIdx = 0;
    currentMinutes = slots[0].startMin;
  }
  
  let currentDayTasks = [];

  tasks.forEach((t) => {
    const durationHours = t.hours || t.durationHours || 1;
    const durationMin = Math.round(durationHours * 60);
    
    let scheduled = false;
    let attempts = 0;
    
    while (!scheduled && attempts < 50) {
      attempts++;
      const currentSlot = slots[currentSlotIdx];
      const timeRemainingInSlot = currentSlot.endMin - currentMinutes;
      
      if (timeRemainingInSlot >= durationMin) {
        // Fits in this slot!
        const startH = Math.floor(currentMinutes / 60);
        const startM = currentMinutes % 60;
        const endMinutes = currentMinutes + durationMin;
        const endH = Math.floor(endMinutes / 60);
        const endM = endMinutes % 60;
        
        currentDayTasks.push({
          taskTitle: t.task || t.taskTitle || t.title || "Execution Step",
          hours: durationHours,
          startTime: `${pad(startH)}:${pad(startM)}`,
          endTime: `${pad(endH)}:${pad(endM)}`
        });
        
        currentMinutes = endMinutes;
        scheduled = true;
      } else {
        // Doesn't fit in current slot, try next slot on same day
        if (currentSlotIdx < slots.length - 1) {
          currentSlotIdx++;
          currentMinutes = slots[currentSlotIdx].startMin;
        } else {
          // No slots left today, push current day and move to next day
          days.push({
            day: daysOfWeek[(currentDayIdx + currentDayOffset) % 7],
            tasks: currentDayTasks
          });
          currentDayTasks = [];
          currentDayOffset++;
          currentSlotIdx = 0;
          currentMinutes = slots[0].startMin;
        }
      }
    }
  });

  if (currentDayTasks.length > 0 || days.length === 0) {
    days.push({
      day: daysOfWeek[(currentDayIdx + currentDayOffset) % 7],
      tasks: currentDayTasks
    });
  }

  return { goalId, days };
}

app.post('/api/agents/scheduler', async (req, res) => {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || '';
    
    const { goalId, title, deadline, availableHours, workingWindow, tasks, existingSchedules } = req.body;

    const today = new Date();
    const currentTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
    const deadlineDate = new Date(deadline);
    const diffTime = Math.abs(deadlineDate.getTime() - today.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const prompt = `
You are an intelligent AI Scheduling Agent responsible for converting a list of goal tasks into a realistic execution schedule.

## Inputs
* Goal title: ${title}
* Goal deadline: ${deadlineDate.toDateString()}
* List of tasks: ${JSON.stringify(tasks, null, 2)}
* User's preferred daily working window:
${(() => {
  if (!workingWindow) return "  * Standard business hours (09:00 to 17:00).";
  if (workingWindow.label === "Custom") {
    const starts = workingWindow.start.split(",");
    const ends = workingWindow.end.split(",");
    const slots = starts.map((s, idx) => \`  * Slot \${idx + 1}: \${s} to \${ends[idx]}\`).join("\\n");
    return slots;
  }
  return \`  * \${workingWindow.start} to \${workingWindow.end}\`;
})()}
* Existing schedules from all other goals:
${existingSchedules && Object.keys(existingSchedules).length > 0 ? JSON.stringify(existingSchedules, null, 2) : "None"}
* Today's date: ${today.toDateString()}
* Current time: ${currentTime}

## Your Objective
Generate the most realistic schedule possible while respecting every constraint below.

## Scheduling Rules

### 1. Never cross the goal deadline
Every task must be scheduled on or before the goal deadline. Never place tasks after the deadline.
If completing all tasks before the deadline is impossible, return a "messageForUser" property explaining which tasks cannot fit, why, and recommendations. Never silently schedule after the deadline.

### 2. Always begin scheduling from today
Scheduling must always begin from today's date. Never schedule work in the past. If today's working window has already started, use the remaining available time today.

### 3. Respect the user's working window
Only schedule tasks inside the provided working window. Never create work outside the user's available hours or in gaps between custom slots.

### 4. Never overlap with existing schedules
You will receive schedules belonging to other goals. These are blocked time slots. Do not place a task where another task already exists.

### 5. Fill time efficiently
Use the earliest available free slot. Avoid unnecessary gaps.

### 6. Split long tasks only when necessary
If a task duration exceeds today's remaining working window, split the task across multiple days.

### 7. Preserve task order
Tasks should generally follow the logical order provided.

### 8. Respect priorities
If time becomes limited before the deadline, lower-priority tasks should be deferred first or omitted.

### 9. No empty days
If there is available working time before the deadline, continue scheduling.

### 10. Detect impossible schedules
If the available hours before the deadline are insufficient, DO NOT invent impossible schedules. Instead, leave tasks unscheduled and explain via "messageForUser".

### 11. Return a clean schedule
You MUST respond ONLY with a valid JSON object matching the following structure exactly:
{
  "goalId": "${goalId}",
  "messageForUser": "Optional message if there is not enough time to fit all tasks.",
  "days": [
    {
      "day": "Monday",
      "tasks": [
        { "taskTitle": "<EXACT task title from the input list>", "hours": 2, "startTime": "09:00", "endTime": "11:00" },
        { "taskTitle": "<EXACT task title from the input list>", "hours": 1, "startTime": "11:00", "endTime": "12:00" }
      ]
    }
  ]
}
Do not include markdown code block formatting (like \`\`\`json), just the raw JSON object.
    `;

    let schedule;
    let lastError = "";

    // 1. Try Direct Google SDK First
    if (geminiKey.trim()) {
      try {
        console.log('Routing scheduler request through Google SDK...');
        const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            temperature: 0.1,
            responseMimeType: "application/json",
          }
        });

        let rawText = response.text || "{}";
        rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        schedule = JSON.parse(rawText);
        return res.json(schedule);
      } catch (e) {
        console.warn("Google SDK Failed, falling back to OpenRouter:", e.message);
        lastError = e.message;
      }
    }

    // 2. Try OpenRouter Fallbacks
    if (openRouterKey.trim() && !schedule) {
      const fallbackModels = [
        "google/gemma-2-9b-it:free",
        "cohere/north-mini-code:free"
      ];

      for (const model of fallbackModels) {
        try {
          console.log(`Trying OpenRouter scheduler model: ${model}...`);
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
          
          rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            rawText = rawText.substring(firstBrace, lastBrace + 1);
          }

          schedule = JSON.parse(rawText);
          return res.json(schedule); 
        } catch (e) {
          console.warn(`Scheduler Model ${model} failed:`, e.message);
          lastError = e.message;
        }
      }
    }

    // 3. Ultimate Graceful Fallback
    if (!schedule) {
      console.error('All AI APIs Failed. Using static schedule mockup.');
      schedule = generateFallbackSchedule(goalId, workingWindow, tasks);
    }

    return res.json(schedule);

  } catch (error) {
    console.error('Error generating goal schedule:', error);
    return res.status(500).json({ error: 'Failed to generate schedule' });
  }
});
// ==========================================
// 3. Risk Agent
// ==========================================
app.post('/api/agents/risk', async (req, res) => {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || '';
    
    const { title, successProbability, riskLevel, totalTasks, completedTasks, daysRemaining, tasks } = req.body;

    const pendingTasksList = tasks
      .filter((t) => t.status !== 'done')
      .map((t) => `- ${t.title} (${t.priority} Priority, ${t.durationMinutes / 60}h)`)
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
        return res.json(explanation);
      } catch (e) {
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
          return res.json(explanation); 
        } catch (e) {
          console.warn(`Risk Model ${model} failed:`, e.message);
        }
      }
    }

    // 3. Mock Fallback
    if (!explanation) {
      return res.json({ 
        aiRiskExplanation: `Because you have ${daysRemaining} days left with ${totalTasks - completedTasks} tasks remaining, your risk level is ${riskLevel}. Focus immediately on the most critical pending task to improve your success probability.` 
      });
    }

  } catch (error) {
    console.error('Error generating risk explanation:', error);
    return res.status(500).json({ error: 'Failed to generate explanation' });
  }
});
// ==========================================
// 4. Recovery Agent
// ==========================================
app.post('/api/agents/recovery', async (req, res) => {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || '';
    
    const { title, riskLevel, successProbability, daysRemaining, availableHours, pendingTasks, currentSchedule } = req.body;

    const pendingTasksList = pendingTasks
      .map((t) => `- ${t.title} (${t.priority} Priority, ${t.durationMinutes / 60}h)`)
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
        return res.json(plan);
      } catch (e) {
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
          return res.json(plan); 
        } catch (e) {
          console.warn(`Recovery Model ${model} failed:`, e.message);
        }
      }
    }

    // 3. Mock Fallback
    if (!plan) {
      return res.json({ 
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
    return res.status(500).json({ error: 'Failed to generate plan' });
  }
});
// ==========================================
// 5. Voice Agent
// ==========================================
app.post('/api/agents/voice', async (req, res) => {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const { text, history, context } = req.body;

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

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
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
      
      return res.json({ reply, action });
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
      } catch (e) {
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
        } catch (e) {
          console.warn(`Voice Model ${model} failed:`, e.message);
          lastError = e.message;
        }
      }
    }

    // 3. Ultimate Graceful Fallback
    if (!aiText) {
      return res.json({
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
      return res.json(parsed);
    } catch (e) {
      console.error("Failed to parse JSON from AI:", aiText);
      return res.json({ reply: "What is that?", action: { type: 'NONE', payload: {} } });
    }

  } catch (error) {
    console.error('Error in Voice Agent:', error);
    return res.status(500).json({ error: 'Failed to process voice command' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
