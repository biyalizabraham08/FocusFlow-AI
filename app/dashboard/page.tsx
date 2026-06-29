"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore, Task } from "@/lib/store";
import { auth } from "@/lib/firebase";
import { 
  Target, 
  Clock, 
  AlertTriangle, 
  Play, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  TrendingDown,
  Sparkles,
  Award,
  Pause,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/app-layout";
import { CalendarStatusCard } from "@/components/dashboard/calendar-status-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { goals, tasks, schedules, preferredVoiceURI, updateTask } = useStore();
  const [userName, setUserName] = useState("User");

  // Focus Session State
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.displayName) {
          setUserName(user.displayName.split(" ")[0]);
        } else if (user.email) {
          const firstPart = user.email.split("@")[0].split(/[._-]/)[0];
          setUserName(firstPart.charAt(0).toUpperCase() + firstPart.slice(1));
        }
      } else {
        setUserName("User");
      }
    });
    return () => unsubscribe();
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      handleCompleteFocusSession();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Today's Date Info
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });

  // Calculate greeting depending on hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Find Today's Mission (Highest priority pending task)
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  const sortedPendingTasks = [...pendingTasks].sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
  const nextTask = sortedPendingTasks[0] || null;
  const parentGoal = nextTask ? goals.find(g => g.id === nextTask.goalId) : null;

  // Generate smart AI next-action reasoning
  const getAiReason = (task: Task) => {
    if (task.priority === "Critical") {
      return "This blocker is critical to prevent timeline delays. Complete this first to stabilize your goals progress.";
    }
    if (task.priority === "High") {
      return "Completing this task now will reduce schedule congestion tomorrow and optimize risk parameters.";
    }
    return "Highly recommended step to maintain consistent execution patterns and hit your goal milestones.";
  };

  // Focus Timer Actions
  const startFocusSession = (task: Task) => {
    setFocusTask(task);
    setTimeLeft(task.durationMinutes * 60 || 25 * 60);
    setIsTimerRunning(true);
    setShowFocusModal(true);
    // Mark in progress
    updateTask(task.id, { status: "in-progress" });
  };

  const handleCompleteFocusSession = () => {
    if (focusTask) {
      updateTask(focusTask.id, { status: "done" });
    }
    setIsTimerRunning(false);
    setShowFocusModal(false);
    setFocusTask(null);
  };

  const handleStopFocusSession = () => {
    if (focusTask) {
      updateTask(focusTask.id, { status: "todo" });
    }
    setIsTimerRunning(false);
    setShowFocusModal(false);
    setFocusTask(null);
  };

  // Today's Scheduled Tasks
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = daysOfWeek[new Date().getDay()];
  
  const todayScheduledTasks: { goalTitle: string; taskTitle: string; startTime?: string; endTime?: string; hours: number }[] = [];

  Object.values(schedules).forEach((schedule) => {
    const goal = goals.find((g) => g.id === schedule.goalId);
    if (!goal) return;

    schedule.days.forEach((dayData) => {
      if (dayData.day === currentDayName) {
        dayData.tasks.forEach((task) => {
          todayScheduledTasks.push({
            goalTitle: goal.title,
            taskTitle: task.taskTitle,
            startTime: task.startTime,
            endTime: task.endTime,
            hours: task.hours
          });
        });
      }
    });
  });

  // Render format for timeLeft
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (goals.length === 0) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center p-6 min-h-[70vh]">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-[#11131e]/75 backdrop-blur-2xl border border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.65)] rounded-3xl p-8 md:p-10 max-w-xl w-full text-center relative overflow-hidden"
          >
            {/* Inner glowing accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#3b82f6]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Central Welcoming Card Header Icon */}
            <div className="relative mx-auto w-24 h-24 mb-8 flex items-center justify-center">
              <div className="absolute inset-[-16px] bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              <motion.div 
                className="absolute inset-0 border border-dashed border-blue-500/35 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
              />
              <div className="absolute inset-6 bg-gradient-to-br from-blue-950 to-indigo-950 border border-blue-900/40 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/15">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  <Target className="w-8 h-8 text-blue-400" />
                </motion.div>
              </div>
            </div>

            {/* Welcome text */}
            <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
              Welcome to FocusFlow AI
            </h1>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed max-w-md mx-auto">
              You haven't set up any goals yet. Create your first goal to unlock AI-powered planning, scheduling, and insights.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/onboarding" className="w-full sm:w-auto">
                <button
                  className="w-full sm:w-auto bg-[#3b82f6] text-white hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.35)] px-8 h-12 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 border-none"
                >
                  Create Goal
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <button
                onClick={() => document.getElementById('voice-assistant-btn')?.click()}
                className="w-full sm:w-auto border border-slate-800 bg-[#11131e]/80 hover:bg-slate-800/40 hover:border-slate-700 text-slate-300 hover:text-white px-6 h-12 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
              >
                Start Voice Assistant
              </button>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Personalized Welcome Header */}
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{formattedDate}</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              {getGreeting()}, {userName} 👋
            </h1>
          </div>
        </div>

        {/* 2-Column Dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Today's Mission & Today's Schedule */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Today's Mission Hero Card */}
            {nextTask ? (
              <Card className="bg-gradient-to-br from-[#1b1c26] to-[#11131e] border-slate-800/80 relative overflow-hidden shadow-2xl rounded-3xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#3b82f6]/5 rounded-full blur-3xl pointer-events-none" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#3b82f6] uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" />
                    Today's Mission (Next Best Action)
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white mt-2 leading-tight tracking-tight">
                    {nextTask.title}
                  </h2>
                  {parentGoal && (
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                      Goal: {parentGoal.title}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-black/35 rounded-xl p-4 border border-slate-800/60 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Clock className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Estimated Duration</div>
                        <div className="text-sm font-extrabold text-white mt-0.5">{nextTask.durationMinutes} mins</div>
                      </div>
                    </div>
                    <div className="bg-black/35 rounded-xl p-4 border border-slate-800/60 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Award className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Priority Level</div>
                        <div className="text-sm font-extrabold text-purple-400 mt-0.5">{nextTask.priority}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-950/20 border border-blue-900/35 rounded-xl p-4 flex gap-3">
                    <BrainCircuit className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-[#3b82f6]">AI Strategist:</span> {getAiReason(nextTask)}
                    </p>
                  </div>

                  <button
                    onClick={() => startFocusSession(nextTask)}
                    className="w-full h-12 rounded-xl bg-[#3b82f6] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 font-bold text-sm transition-all duration-300 border-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current text-white" />
                    Start Focus Session
                  </button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#11131e] border-slate-800/80 rounded-2xl h-48 flex flex-col items-center justify-center text-slate-500 text-sm shadow-xl p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                <p className="font-semibold text-white">All caught up!</p>
                <p className="text-xs mt-1 text-slate-500">Create new goals or tasks to generate AI next best actions.</p>
              </Card>
            )}

            {/* Today's Schedule timeline */}
            <Card className="bg-[#11131e] border-slate-800/80 rounded-3xl shadow-xl">
              <CardHeader className="border-b border-slate-900/50 pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                  <span>Today's Schedule</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    {currentDayName}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {todayScheduledTasks.length > 0 ? (
                  <div className="space-y-6">
                    {todayScheduledTasks.map((t, idx) => (
                      <div key={idx} className="relative pl-6 border-l border-slate-800 last:border-0 pb-2">
                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[#3b82f6]/50 border border-[#11131e]" />
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-semibold text-white">{t.taskTitle}</h4>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{t.goalTitle}</p>
                          </div>
                          <div className="text-right">
                            {t.startTime && t.endTime ? (
                              <span className="text-xs text-blue-400 font-semibold">{t.startTime} - {t.endTime}</span>
                            ) : (
                              <span className="text-xs text-slate-500">{t.hours}h duration</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6 italic">No tasks scheduled for today.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Google Calendar sync & Active Goals summary */}
          <div className="space-y-8">
            {/* Calendar status Integration card */}
            <CalendarStatusCard />

            {/* Active Goals list summary */}
            <Card className="bg-[#11131e] border-slate-800/80 rounded-3xl shadow-xl">
              <CardHeader className="border-b border-slate-900/50 pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                  <span>Active Goals</span>
                  <Link href="/goals" className="text-xs text-[#3b82f6] hover:underline font-semibold">
                    View All
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {goals.slice(0, 3).map((goal) => {
                  const daysRemaining = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                  const goalTasksCount = tasks.filter(t => t.goalId === goal.id).length;
                  const completed = tasks.filter(t => t.goalId === goal.id && t.status === 'done').length;
                  const pct = goalTasksCount > 0 ? Math.round((completed / goalTasksCount) * 100) : 0;
                  
                  return (
                    <Link href={`/goals/${goal.id}`} key={goal.id} className="block group">
                      <div className="bg-black/35 rounded-xl p-4 border border-slate-800/50 hover:bg-slate-800/40 transition-all duration-300 space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-white group-hover:text-[#3b82f6] transition-colors truncate w-2/3">
                            {goal.title}
                          </h4>
                          <span className="text-xs font-bold text-[#3b82f6]">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                          <div className="bg-[#3b82f6] h-1 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase pt-1">
                          <span>{goalTasksCount} Tasks</span>
                          <span>{daysRemaining} Days Left</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {goals.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6 italic">No active goals yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Focus Timer Modal Overlay */}
      <AnimatePresence>
        {showFocusModal && focusTask && (
          <div className="fixed inset-0 z-50 bg-[#090a0f]/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#11131e] border border-slate-800/80 p-8 rounded-3xl max-w-md w-full text-center relative shadow-2xl space-y-8"
            >
              <div>
                <span className="text-xs font-bold text-[#3b82f6] uppercase tracking-widest">Active Focus Session</span>
                <h3 className="text-xl font-bold text-white mt-1 leading-tight truncate">{focusTask.title}</h3>
              </div>

              {/* Ticking countdown ring */}
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-900" />
                <motion.div 
                  className="absolute inset-0 rounded-full border-4 border-[#3b82f6] border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                />
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="flex-1 h-12 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800/60 font-semibold text-slate-350 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-4 h-4" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> Resume
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setTimeLeft(focusTask.durationMinutes * 60)}
                    className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800/60 font-semibold text-slate-350 flex items-center justify-center cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <button 
                  onClick={handleCompleteFocusSession}
                  className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm cursor-pointer shadow-lg shadow-green-500/20 border-none"
                >
                  Mark Task as Done
                </button>

                <button 
                  onClick={handleStopFocusSession}
                  className="w-full h-12 rounded-xl border border-red-900/35 hover:bg-red-950/25 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer transition-colors"
                >
                  Abort Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
