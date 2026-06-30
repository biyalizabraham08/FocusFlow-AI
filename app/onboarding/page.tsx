"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ArrowRight, CheckCircle2, Calendar, Loader2, Sparkles, Keyboard } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const parseNaturalDate = (input: string): Date => {
  if (!input) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const lower = input.toLowerCase().trim();
  const today = new Date();
  
  if (lower === "today") return today;
  if (lower === "tomorrow" || lower === "tmrw") {
    const tmrw = new Date();
    tmrw.setDate(today.getDate() + 1);
    return tmrw;
  }
  if (lower.includes("next week") || lower.includes("next sunday") || lower.includes("next weekend")) {
    const nextWk = new Date();
    nextWk.setDate(today.getDate() + 7);
    return nextWk;
  }
  if (lower.includes("next month")) {
    const nextMo = new Date();
    nextMo.setMonth(today.getMonth() + 1);
    return nextMo;
  }
  
  // Try native parsing
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) return parsed;
  
  // Fallback to 30 days
  const thirty = new Date();
  thirty.setDate(today.getDate() + 30);
  return thirty;
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [goalTitle, setGoalTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [workingWindow, setWorkingWindow] = useState<{ label: string, start: string, end: string } | null>(null);
  const [customSlots, setCustomSlots] = useState<{ start: string; end: string }[]>([
    { start: "09:00", end: "12:00" }
  ]);

  useEffect(() => {
    if (workingWindow?.label === "Custom") {
      setWorkingWindow({
        label: "Custom",
        start: customSlots.map(s => s.start).join(","),
        end: customSlots.map(s => s.end).join(",")
      });
    }
  }, [customSlots, workingWindow?.label]);
  
  const [isListening, setIsListening] = useState(false);
  const [loadingState, setLoadingState] = useState(0); // 0 to 4 for checkmarks
  
  const { addGoal, addTask, setSchedule, completeOnboarding, setActiveMode, preferredVoiceURI, setWorkingWindow: storeSetWorkingWindow } = useStore();
  const router = useRouter();

  // Voice selection and speaking
  const speak = (text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    if (preferredVoiceURI) {
      const selectedVoice = voices.find(v => v.voiceURI === preferredVoiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // Pick the best natural English voice available
      const preferredVoices = voices.filter(v => 
        v.name.includes("Google US English") || 
        v.name.includes("Samantha") || 
        v.name.includes("Siri") ||
        v.name.includes("Premium")
      );
      
      if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[0];
      } else {
        const englishVoices = voices.filter(v => v.lang.startsWith("en"));
        if (englishVoices.length > 0) utterance.voice = englishVoices[0];
      }
    }
    
    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  };

  // Real voice recognition ref to allow toggle on/off
  const recognitionRef = useRef<any>(null);

  const handleVoiceInput = (setter: (val: string) => void, fallbackPlaceholder: string) => {
    if (typeof window === "undefined") return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.error("Error stopping recognition", e);
      }
      setIsListening(false);
      return;
    }
    
    // @ts-expect-error - SpeechRecognition is not standard across all browsers
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser. Using fallback.");
      alert("Voice recognition is not supported in this browser. Please type your answer instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      // Stop synthesis when listening starts
      window.speechSynthesis.cancel();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setter(text);
      setIsListening(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error !== 'aborted') {
        alert("Microphone error. Please ensure you have granted microphone permissions, or type your answer instead.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Error starting recognition", e);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  useEffect(() => {
    // Make sure voices are loaded
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }, []);

  // Handle Step 0: Welcome
  useEffect(() => {
    if (step === 0) {
      speak("Welcome to FocusFlow AI!");
    }
  }, [step]);

  // Handle Step 1: Goal
  useEffect(() => {
    if (step === 1) {
      speak("Let's get started. What's the most important goal you'd like to achieve?");
    }
  }, [step]);

  // Handle Step 2: Deadline
  useEffect(() => {
    if (step === 2) {
      speak("When is your deadline?");
    }
  }, [step]);

  // Handle Step 3: Working Window
  useEffect(() => {
    if (step === 3) {
      speak("What is your preferred working window?");
    }
  }, [step]);

  // Handle Step 4: Loading AI
  useEffect(() => {
    if (step === 4) {
      let speechFinished = false;
      let animationFinished = false;

      const checkAndTransition = () => {
        if (speechFinished && animationFinished) {
          setStep(5);
        }
      };

      speak("Great! I'm creating your personalized execution plan.", () => {
        speechFinished = true;
        checkAndTransition();
      });
      
      const processAI = async () => {
        if (workingWindow) {
          storeSetWorkingWindow(workingWindow);
        }

        // 1. Fire off the API requests immediately so they run in the background
        const generateBackgroundPlan = async () => {
          try {
            const newGoalId = 'g-' + Math.random().toString(36).substr(2, 9);
            const deadlineStr = parseNaturalDate(deadline);
            
            addGoal({
              id: newGoalId,
              title: goalTitle,
              description: 'Created via Onboarding',
              deadline: deadlineStr,
              progress: 0,
              successProbability: 78,
              riskLevel: 'Low',
              createdAt: new Date(),
            });

            // Compute total available hours dynamically, summing up Custom time slots
            let availableHoursVal = "4";
            if (workingWindow) {
              if (workingWindow.label === "Custom") {
                const starts = workingWindow.start.split(",");
                const ends = workingWindow.end.split(",");
                let totalHours = 0;
                for (let i = 0; i < starts.length; i++) {
                  if (!starts[i] || !ends[i]) continue;
                  const [startH] = starts[i].split(":").map(Number);
                  const [endH] = ends[i].split(":").map(Number);
                  totalHours += (endH - startH + 24) % 24;
                }
                availableHoursVal = String(totalHours || 4);
              } else {
                availableHoursVal = String((parseInt(workingWindow.end.split(":")[0]) - parseInt(workingWindow.start.split(":")[0]) + 24) % 24);
              }
            }

            // Call Planner
            const plannerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/planner`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: goalTitle,
                description: "",
                deadline: deadlineStr.toISOString().split('T')[0],
                availableHours: availableHoursVal,
                category: "personal"
              })
            });

            if (plannerRes.ok) {
              const data = await plannerRes.json();
              
              // Add Tasks
              if (data.tasks && Array.isArray(data.tasks)) {
                data.tasks.forEach((t: any, index: number) => {
                  addTask({
                    id: `t-${Date.now()}-${index}`,
                    goalId: newGoalId,
                    title: t.task || t.taskTitle,
                    status: "todo",
                    durationMinutes: (t.hours || 1) * 60,
                    impactScore: t.priority === 'Critical' ? 95 : 50,
                    priority: t.priority || "Medium",
                    createdAt: new Date(),
                    deadline: deadlineStr
                  });
                });
              }

              // Call Scheduler
              const schedulerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/scheduler`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  goalId: newGoalId,
                  title: goalTitle,
                  deadline: deadlineStr.toISOString().split('T')[0],
                  availableHours: availableHoursVal,
                  workingWindow: workingWindow,
                  tasks: data.tasks || [],
                  existingSchedules: useStore.getState().schedules
                })
              });

              if (schedulerRes.ok) {
                const scheduleData = await schedulerRes.json();
                setSchedule(newGoalId, scheduleData);
              }
            }
          } catch (e) {
            console.error("Failed to generate plan during onboarding", e);
          }
        };
        
        // Start background generation WITHOUT awaiting it!
        generateBackgroundPlan();

        // 2. Play the visual animations quickly to give a sense of AI progress without blocking
        await new Promise(r => setTimeout(r, 100));
        setLoadingState(1); // Understanding goal...
        
        await new Promise(r => setTimeout(r, 100));
        setLoadingState(2); // Breaking into tasks...
        
        await new Promise(r => setTimeout(r, 100));
        setLoadingState(3); // Creating schedule...
        
        await new Promise(r => setTimeout(r, 100));
        setLoadingState(4); // Calculating probability...
        
        await new Promise(r => setTimeout(r, 100));
        animationFinished = true;
        checkAndTransition();
      };
      
      processAI();
    }
  }, [step]);

  // Handle Step 5: Mode
  useEffect(() => {
    if (step === 5) {
      speak("How would you like me to help you stay on track?");
    }
  }, [step]);

  const handleComplete = (mode: 'Focus' | 'Coach' | 'Accountability') => {
    setActiveMode(mode);
    completeOnboarding();
    router.push("/dashboard?onboarding=true");
  };

  const skipOnboarding = () => {
    completeOnboarding();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans text-slate-300">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#3b82f6]/10 to-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">
          
          {/* Step 0: Welcome Animation */}
          {step === 0 && (
            <motion.div 
              key="step-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.5 }}
              className="text-center"
            >
              {/* Star Icon Block with royal blue to purple gradient and breathing ambient glow */}
              <div className="relative mx-auto w-24 h-24 mb-8 flex items-center justify-center">
                {/* Soft breathing glowing aura behind the icon block */}
                <div className="absolute inset-[-20px] bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full blur-xl pointer-events-none animate-pulse" />
                
                {/* Rounded square app icon block */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 border border-blue-400/20 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10 relative z-10">
                  {/* White minimalist 4-point star emblem with a tiny plus sign */}
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
                    <path d="M18 4H20M19 3V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Welcome to FocusFlow AI</h1>
              <p className="text-slate-400 max-w-md mx-auto text-base leading-relaxed mb-8">
                I'm your personal AI productivity coach. I'll help you plan your goals, stay focused, and finish important work before your deadlines.
              </p>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => { window.speechSynthesis.cancel(); setStep(1); }} 
                  className="border border-slate-800 bg-[#11131e]/80 hover:bg-slate-800/40 hover:border-slate-700 text-slate-200 hover:text-white px-8 h-12 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
                  variant="outline"
                >
                  Start Planning <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Goal */}
          {step === 1 && (
            <motion.div 
              key="step-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md mx-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">What's your main goal?</h2>
              
              <div className="bg-[#11131e] border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-6">
                <input 
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Build my Vibe2Ship hackathon project" 
                  className="w-full h-14 bg-black/40 border border-slate-800 focus:border-[#3b82f6]/50 focus:shadow-[0_0_12px_rgba(59,130,246,0.25)] px-4 rounded-xl text-white outline-none transition-all duration-300 text-base font-medium placeholder:text-slate-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && goalTitle && setStep(2)}
                />
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleVoiceInput(setGoalTitle, "Build my Vibe2Ship hackathon project")}
                    className={`flex-1 h-12 border rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                      isListening 
                        ? 'border-red-500/50 bg-red-950/20 text-red-200' 
                        : 'border-slate-850 bg-[#11131e]/80 hover:bg-slate-800/40 hover:border-slate-700 text-slate-200 hover:text-white'
                    }`}
                  >
                    <Mic className={`w-4 h-4 ${isListening ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                    {isListening ? "Listening..." : "Speak Instead"}
                  </button>
                  <button 
                    onClick={() => setStep(2)}
                    disabled={!goalTitle}
                    className="flex-1 h-12 bg-[#3b82f6] text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 border-none"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button onClick={skipOnboarding} className="text-slate-500 hover:text-slate-300 text-sm font-semibold transition-colors bg-transparent border-none cursor-pointer">
                  Skip for Now
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Deadline */}
          {step === 2 && (
            <motion.div 
              key="step-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md mx-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">When is your deadline?</h2>
              
              <div className="bg-[#11131e] border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-6">
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5.5 h-5.5 text-slate-500 pointer-events-none z-10" />
                  <input 
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full h-14 bg-black/40 border border-slate-800 focus:border-[#3b82f6]/50 focus:shadow-[0_0_12px_rgba(59,130,246,0.25)] pl-12 pr-4 rounded-xl text-white outline-none transition-all duration-300 text-base font-medium [color-scheme:dark]"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && deadline && setStep(3)}
                  />
                </div>
                
                <div className="flex justify-center">
                  <button 
                    onClick={() => setStep(3)}
                    disabled={!deadline}
                    className="w-full h-12 bg-[#3b82f6] text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 border-none"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Working Window */}
          {step === 3 && (
            <motion.div 
              key="step-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md mx-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-tight">What is your preferred working window?</h2>
              
              <div className="bg-[#11131e] border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Morning", start: "06:00", end: "12:00" },
                    { label: "Afternoon", start: "12:00", end: "17:00" },
                    { label: "Evening", start: "17:00", end: "22:00" },
                    { label: "Night", start: "20:00", end: "01:00" }
                  ].map((w) => {
                    const isActive = workingWindow?.label === w.label;
                    return (
                      <button 
                        key={w.label}
                        type="button"
                        onClick={() => setWorkingWindow(w)}
                        className={`h-16 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer select-none bg-transparent ${
                          isActive 
                            ? 'border-[#3b82f6]/60 bg-[#11131e] shadow-[0_0_20px_rgba(59,130,246,0.2)] text-white font-bold' 
                            : 'border-slate-800/50 opacity-45 hover:opacity-75 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-sm font-semibold">{w.label}</span>
                        <span className="text-xs mt-1 opacity-70">{w.start} - {w.end}</span>
                      </button>
                    );
                  })}

                  {/* Custom Window Option */}
                  <button 
                    type="button"
                    onClick={() => setWorkingWindow({ label: "Custom", start: customSlots.map(s => s.start).join(","), end: customSlots.map(s => s.end).join(",") })}
                    className={`h-16 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer select-none col-span-2 bg-transparent ${
                      workingWindow?.label === "Custom"
                        ? 'border-[#3b82f6]/60 bg-[#11131e] shadow-[0_0_20px_rgba(59,130,246,0.2)] text-white font-bold' 
                        : 'border-slate-800/50 opacity-45 hover:opacity-75 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm font-semibold">Custom Window</span>
                    <span className="text-xs mt-1 opacity-70">
                      {workingWindow?.label === "Custom" ? `${workingWindow.start} - ${workingWindow.end}` : "Choose your own hours"}
                    </span>
                  </button>
                </div>

                {/* Custom range input picker fields */}
                {workingWindow?.label === "Custom" && (
                  <div className="space-y-3 pt-2">
                    {customSlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex-1 flex flex-col gap-1.5">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Start</span>
                          <input 
                            type="time"
                            value={slot.start}
                            onChange={(e) => {
                              const newSlots = [...customSlots];
                              newSlots[index].start = e.target.value;
                              setCustomSlots(newSlots);
                            }}
                            className="w-full h-10 bg-black/40 border border-slate-800 focus:border-[#3b82f6]/50 px-2 rounded-lg text-white text-xs outline-none [color-scheme:dark]"
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">End</span>
                          <input 
                            type="time"
                            value={slot.end}
                            onChange={(e) => {
                              const newSlots = [...customSlots];
                              newSlots[index].end = e.target.value;
                              setCustomSlots(newSlots);
                            }}
                            className="w-full h-10 bg-black/40 border border-slate-800 focus:border-[#3b82f6]/50 px-2 rounded-lg text-white text-xs outline-none [color-scheme:dark]"
                          />
                        </div>
                        {customSlots.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => {
                              const newSlots = customSlots.filter((_, i) => i !== index);
                              setCustomSlots(newSlots);
                            }}
                            className="self-end mb-1 w-8 h-8 rounded-lg bg-red-900/20 border border-red-900/30 text-red-400 hover:bg-red-900/25 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Plus button to add slot */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomSlots([...customSlots, { start: "13:00", end: "17:00" }]);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/20 border border-blue-900/35 text-xs text-blue-400 hover:bg-blue-900/25 transition-colors cursor-pointer"
                      >
                        <span>+ Add Slot</span>
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center pt-2">
                  <button 
                    onClick={() => setStep(4)}
                    disabled={!workingWindow}
                    className="w-full h-12 bg-[#3b82f6] text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 border-none"
                  >
                    Plan It <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Loading AI */}
          {step === 4 && (
            <motion.div 
              key="step-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <div className="bg-[#13131a]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-xl">
                <div className="flex justify-center mb-8">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-lg">
                    {loadingState >= 1 ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <div className="w-6 h-6 border-2 border-white/10 rounded-full" />}
                    <span className={loadingState >= 1 ? "text-white" : "text-white/40"}>🧠 Understanding your goal...</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-lg">
                    {loadingState >= 2 ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <div className="w-6 h-6 border-2 border-white/10 rounded-full" />}
                    <span className={loadingState >= 2 ? "text-white" : "text-white/40"}>🧠 Breaking it into tasks...</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-lg">
                    {loadingState >= 3 ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <div className="w-6 h-6 border-2 border-white/10 rounded-full" />}
                    <span className={loadingState >= 3 ? "text-white" : "text-white/40"}>🧠 Creating your schedule...</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-lg">
                    {loadingState >= 4 ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <div className="w-6 h-6 border-2 border-white/10 rounded-full" />}
                    <span className={loadingState >= 4 ? "text-white" : "text-white/40"}>🧠 Calculating success probability...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Personalization Mode */}
          {step === 5 && (
            <motion.div 
              key="step-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-6 text-center">How would you like me to help you stay on track?</h2>
              
              <div className="space-y-4">
                <button 
                  onClick={() => handleComplete('Focus')}
                  className="w-full text-left bg-[#13131a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:border-green-500/50 hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">Focus Mode</h3>
                      <p className="text-sm text-muted-foreground">Only important reminders</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => handleComplete('Coach')}
                  className="w-full text-left bg-[#13131a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:border-yellow-500/50 hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">Coach Mode</h3>
                      <p className="text-sm text-muted-foreground">Daily suggestions and guidance</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => handleComplete('Accountability')}
                  className="w-full text-left bg-[#13131a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:border-red-500/50 hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">Accountability Mode</h3>
                      <p className="text-sm text-muted-foreground">Active check-ins when you're falling behind</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Floating controls in the bottom-right corner during onboarding steps */}
      {step < 4 && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
          <button className="w-12 h-12 rounded-full shadow-lg bg-[#11131e]/80 hover:bg-slate-800/80 border border-slate-800/85 text-slate-400 hover:text-white transition-all duration-300 backdrop-blur-md flex items-center justify-center cursor-pointer">
            <Keyboard className="w-5 h-5" />
          </button>
          <button 
            onClick={() => { 
              window.speechSynthesis.cancel(); 
              if (step === 0) setStep(1);
              else if (step === 1) handleVoiceInput(setGoalTitle, "Build my Vibe2Ship hackathon project");
              else if (step === 2) speak("Give me the date and month only.");
              else if (step === 3) speak("Please select your preferred working window.");
            }}
            className="w-16 h-16 rounded-full shadow-2xl transition-all duration-300 bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] flex items-center justify-center cursor-pointer text-white border-none focus:outline-none"
          >
            <Mic className="w-8 h-8 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
