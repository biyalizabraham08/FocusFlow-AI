import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

function generateFallbackSchedule(goalId: string, workingWindow: any, tasks: any[]) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  // parse slots
  let slots: { startMin: number; endMin: number; startStr: string; endStr: string }[] = [];
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
  const days: any[] = [];
  
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
  
  let currentDayTasks: any[] = [];

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

export async function POST(req: Request) {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    
    const body = await req.json();
    const { goalId, title, deadline, availableHours, workingWindow, tasks, existingSchedules } = body;

    const today = new Date();
    const currentTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
    const deadlineDate = new Date(deadline);
    const diffTime = Math.abs(deadlineDate.getTime() - today.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const prompt = `
      You are an elite productivity and scheduling AI agent.
      A user needs a strict day-by-day schedule to complete their goal before the deadline.
      
      Goal Title: ${title}
      Today's Date: ${today.toDateString()}
      Current Time: ${currentTime}
      Deadline Date: ${deadlineDate.toDateString()}
      Days Remaining: ${diffDays} days
      Available Hours Per Day: ${availableHours}
      ${(() => {
        if (!workingWindow) return "User has not specified a working window. Use standard business hours (09:00 to 17:00).";
        if (workingWindow.label === "Custom") {
          const starts = workingWindow.start.split(",");
          const ends = workingWindow.end.split(",");
          const slots = starts.map((s: string, idx: number) => `Slot ${idx + 1}: ${s} to ${ends[idx]}`).join("\n      ");
          return `User's Preferred Working Window is CUSTOM with the following specific, non-overlapping slots:\n      ${slots}\n      CRITICAL: You MUST schedule tasks strictly within these specific slots. Do not schedule tasks in the gaps between these slots!`;
        }
        return `User's Preferred Working Window: ${workingWindow.start} to ${workingWindow.end} (${workingWindow.label})`;
      })()}
      
      Tasks to Schedule:
      ${JSON.stringify(tasks, null, 2)}

      ${existingSchedules && Object.keys(existingSchedules).length > 0 ? `
      Existing Schedules (DO NOT OVERLAP WITH THESE):
      ${JSON.stringify(existingSchedules, null, 2)}
      ` : ''}

      Constraints:
      1. CRITICAL: You MUST NOT schedule any tasks beyond the Deadline Date (${deadlineDate.toDateString()}). The entire schedule MUST fit within the next ${diffDays} days.
      2. CRITICAL: You MUST STRICTLY respect the User's Preferred Working Window and Available Hours Per Day. DO NOT schedule tasks outside of the specified window or during any gaps.
      3. CRITICAL: You MUST use the exact task titles provided in the 'Tasks to Schedule' list. DO NOT invent new tasks or use generic titles like 'Research'.
      4. Distribute the tasks across the upcoming days (e.g., "Day 1 (Monday)", "Day 2 (Tuesday)").
      5. CRITICAL: If the total task hours exceed the absolute total available time within the strict working window before the deadline, DO NOT simply add more time or compress the schedule. Only schedule what fits perfectly within the strict window. Leave any remaining tasks unscheduled.
      6. If you cannot fit all tasks within the provided window, you MUST include a "messageForUser" property in your JSON response asking the user: "The customized window time is not enough to schedule all tasks. Should I add more time or extend outside the window?"
      7. A task can be split across multiple days if it exceeds the daily available hours.
      8. Calculate and assign an exact 'startTime' and 'endTime' (in "HH:mm" format, 24-hour clock) for each task. The times MUST fall strictly within the User's Preferred Working Window/Slots. Ensure tasks on the same day do not overlap.
      9. CRITICAL: For tasks scheduled on Today (${today.toDateString()}), the 'startTime' MUST be greater than or equal to the Current Time (${currentTime}). Do NOT schedule tasks in the past! If there is not enough time left today, push the tasks to tomorrow.
      10. CRITICAL: If 'Existing Schedules' are provided above, you MUST NOT schedule any tasks during the timeslots occupied by those existing schedules. Avoid overlapping with any previously scheduled goals!

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
        return NextResponse.json(schedule);
      } catch (e: any) {
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
          return NextResponse.json(schedule); 
        } catch (e: any) {
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

    return NextResponse.json(schedule);

  } catch (error) {
    console.error('Error generating goal schedule:', error);
    return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 });
  }
}
