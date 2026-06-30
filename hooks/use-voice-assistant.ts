"use client";

import { useState, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export function useVoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const router = useRouter();
  
  const { setDailyBriefing, addTask, addGoal, updateTask, updateGoal, setSchedule, goals, tasks, schedules, preferredVoiceURI, activeMode } = useStore();

  const initSpeechRecognition = () => {
    if (typeof window === "undefined") return null;
    
    // @ts-expect-error - SpeechRecognition is not standard across all browsers
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      await processCommand(text);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') {
        return;
      }
      
      console.warn("Speech recognition error:", event.error);
      if (event.error === 'network') {
        speakText("Network error with speech recognition. Let's use text input instead.");
        setDailyBriefing("Speech Recognition failed (Network Error). Check your internet connection or use the text fallback.");
      } else if (event.error === 'no-speech') {
        console.log("No speech detected.");
      }
      setIsListening(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  };

  const speakText = (text: string) => {
    if (typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    if (preferredVoiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.voiceURI === preferredVoiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAction = async (action: any) => {
    if (!action || action.type === 'NONE') return;

    try {
      switch (action.type) {
        case 'NAVIGATE':
          if (action.payload?.path) {
            router.push(action.payload.path);
          }
          break;
        case 'COMPLETE_TASK':
          if (action.payload?.taskId) {
            updateTask(action.payload.taskId, { status: 'done' });
          }
          break;
        case 'ADD_TASK':
          if (action.payload?.title) {
            addTask({
              id: 't-' + Math.random().toString(36).substr(2, 9),
              goalId: goals[0]?.id || 'g-1',
              title: action.payload.title,
              status: 'todo',
              durationMinutes: 30,
              impactScore: 50,
              priority: 'Medium',
              createdAt: new Date(),
            });
          }
          break;
        case 'ADD_GOAL':
          if (action.payload?.title) {
            const newGoalId = 'g-' + Math.random().toString(36).substr(2, 9);
            const parsedDeadline = action.payload.deadline ? new Date(action.payload.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const deadlineDate = isNaN(parsedDeadline.getTime()) ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : parsedDeadline;
            const availableHours = action.payload.availableHours || "4 hours/day";
            
            addGoal({
              id: newGoalId,
              title: action.payload.title,
              description: action.payload.description || 'Created via Voice Assistant',
              deadline: deadlineDate,
              progress: 0,
              successProbability: 80,
              riskLevel: 'Low',
              createdAt: new Date(),
            });

            speakText("I've created the goal and am generating your tasks and schedule in the background. You can keep working while I finish.");

            const generateBackgroundTasks = async () => {
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/planner`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: action.payload.title,
                    description: action.payload.description || '',
                    deadline: deadlineDate.toISOString().split('T')[0],
                    availableHours: availableHours,
                    category: "personal"
                  })
                });
                
                if (res.ok) {
                  const data = await res.json();
                  
                  updateGoal(newGoalId, {
                    aiSummary: data.aiSummary,
                    estimatedTotalHours: data.estimatedTotalHours
                  });

                  if (data.tasks && Array.isArray(data.tasks)) {
                    data.tasks.forEach((t: any, index: number) => {
                      addTask({
                        id: `t-${Date.now()}-${index}`,
                        goalId: newGoalId,
                        title: t.task,
                        status: "todo",
                        durationMinutes: t.hours * 60,
                        impactScore: t.priority === 'Critical' ? 95 : t.priority === 'High' ? 80 : t.priority === 'Medium' ? 50 : 20,
                        priority: t.priority || "Medium",
                        createdAt: new Date()
                      });
                    });
                  }

                  const scheduleRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/scheduler`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      goalId: newGoalId,
                      title: action.payload.title,
                      deadline: deadlineDate.toISOString().split('T')[0],
                      availableHours: availableHours,
                      tasks: data.tasks,
                      existingSchedules: useStore.getState().schedules
                    })
                  });

                  if (scheduleRes.ok) {
                    const scheduleData = await scheduleRes.json();
                    setSchedule(newGoalId, scheduleData);
                    setDailyBriefing("Background task complete: Your goal has been fully planned and scheduled.");
                  }
                }
              } catch(e) {
                 console.error("Failed to generate plan from voice", e);
                 setDailyBriefing("Background task failed: I encountered an error generating the tasks for your goal.");
              }
            };
            
            // Start the generation without awaiting to free up the UI instantly
            generateBackgroundTasks();
          }
          break;
        case 'ANALYZE_RISK':
          if (action.payload?.goalId) {
            const goal = goals.find(g => g.id === action.payload.goalId);
            if (!goal) break;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/risk`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: goal.title,
                successProbability: goal.successProbability,
                riskLevel: goal.riskLevel,
                totalTasks: tasks.filter(t => t.goalId === goal.id).length,
                completedTasks: tasks.filter(t => t.goalId === goal.id && t.status === 'done').length,
                daysRemaining: Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
                tasks: tasks.filter(t => t.goalId === goal.id),
              })
            });
            const data = await res.json();
            if (data.aiRiskExplanation) {
              updateGoal(goal.id, { aiRiskExplanation: data.aiRiskExplanation });
            }
          }
          break;
        case 'GENERATE_RECOVERY':
          if (action.payload?.goalId) {
            const goal = goals.find(g => g.id === action.payload.goalId);
            if (!goal) break;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/recovery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: goal.title,
                riskLevel: goal.riskLevel,
                successProbability: goal.successProbability,
                daysRemaining: Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
                availableHours: 8,
                pendingTasks: tasks.filter(t => t.goalId === goal.id && t.status !== 'done'),
                currentSchedule: schedules[goal.id]
              })
            });
            const data = await res.json();
            if (data.recommendations) {
              updateGoal(goal.id, { aiRecoveryPlan: data });
            }
          }
          break;
      }
    } catch (err) {
      console.error("Failed to execute voice action:", err);
    }
  };

  const processCommand = async (text: string) => {
    setIsProcessing(true);
    
    const userMessage = { role: 'user' as const, content: text };
    const currentHistory = [...history, userMessage];
    setHistory(currentHistory);

    speakText("Analyzing your request, please wait a moment...");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text,
          history: currentHistory,
          context: { goals, tasks, schedules, activeMode }
        }),
      });
      
      const data = await response.json();
      
      if (data.reply) {
        speakText(data.reply);
        setDailyBriefing(`Voice CMD: "${text}" -> AI: "${data.reply}"`);
        setHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }

      if (data.action) {
        await handleAction(data.action);
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      speakText("Sorry, I encountered an error processing your request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
      recognitionRef.current = initSpeechRecognition();
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Error starting recognition", e);
          setIsListening(false);
        }
      } else {
        alert("Speech recognition is not supported in your browser.");
      }
    }
  }, [isListening, setDailyBriefing]);

  return {
    isListening,
    isProcessing,
    transcript,
    toggleListening,
    processCommand
  };
}
