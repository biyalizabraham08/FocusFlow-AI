"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Circle, AlertTriangle, Play, BrainCircuit, Clock, Loader2, Trash2, RefreshCw } from "lucide-react";
import { useStore, Goal, Task } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useAiRecommendation } from "@/lib/hooks/use-ai-recommendation";
import { CalendarSyncButton } from "@/components/calendar/calendar-sync-button";
import { AppLayout } from "@/components/layout/app-layout";
import { AiLoadingExperience } from "@/components/dashboard/ai-loading-experience";

export default function GoalDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const { goals, tasks, schedules, updateTask, updateGoal, setSchedule, removeGoal, addTask, workingWindow } = useStore();
  const router = useRouter();
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalTasks, setGoalTasks] = useState<Task[]>([]);
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);
  const [isGeneratingRecovery, setIsGeneratingRecovery] = useState(false);

  const { task: recTask, impactText, reason } = useAiRecommendation(id);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isRegeneratingSchedule, setIsRegeneratingSchedule] = useState(false);

  const handleRegenerateSchedule = async () => {
    if (!goal) return;
    setIsRegeneratingSchedule(true);
    try {
      const { workingWindow } = useStore.getState();
      
      const scheduleRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/scheduler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: goal.id,
          title: goal.title,
          deadline: new Date(goal.deadline).toISOString().split('T')[0],
          availableHours: goal.estimatedTotalHours ? String(Math.round(goal.estimatedTotalHours / 3)) : "4",
          workingWindow,
          tasks: goalTasks.map(t => ({
            title: t.title,
            hours: t.durationMinutes / 60
          })),
          existingSchedules: useStore.getState().schedules
        })
      });

      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        await setSchedule(goal.id, scheduleData);
        alert("AI Schedule regenerated successfully based on your current working hours!");
      } else {
        alert("Failed to regenerate schedule. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error regenerating schedule.");
    } finally {
      setIsRegeneratingSchedule(false);
    }
  };

  const handleStartSession = () => {
    if (!recTask) return;
    setIsSessionActive(true);
    updateTask(recTask.id, { status: 'in-progress' });
    alert("Focus Session Started! Deep work mode activated.");
  };

  const handleAnalyzeRisk = async () => {
    if (!goal) return;
    setIsAnalyzingRisk(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goal.title,
          successProbability: goal.successProbability,
          riskLevel: goal.riskLevel,
          totalTasks: goalTasks.length,
          completedTasks: goalTasks.filter(t => t.status === 'done').length,
          daysRemaining: Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
          tasks: goalTasks,
        })
      });
      
      const data = await res.json();
      if (data.aiRiskExplanation) {
        updateGoal(goal.id, { aiRiskExplanation: data.aiRiskExplanation });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to analyze risk. Please check your API keys.");
    } finally {
      setIsAnalyzingRisk(false);
    }
  };

  const handleGenerateRecovery = async () => {
    if (!goal) return;
    setIsGeneratingRecovery(true);
    try {
      const pendingTasks = goalTasks.filter(t => t.status !== 'done');
      const currentSchedule = schedules[goal.id];
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goal.title,
          riskLevel: goal.riskLevel,
          successProbability: goal.successProbability,
          daysRemaining: Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
          availableHours: 8,
          pendingTasks: pendingTasks,
          currentSchedule: currentSchedule
        })
      });
      
      const data = await res.json();
      if (data.recommendations) {
        updateGoal(goal.id, { aiRecoveryPlan: data });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate recovery plan.");
    } finally {
      setIsGeneratingRecovery(false);
    }
  };

  const handleApplyRecoveryPlan = () => {
    if (goal?.aiRecoveryPlan?.newSchedule) {
      setSchedule(goal.id, { goalId: goal.id, days: goal.aiRecoveryPlan.newSchedule });
      alert("Schedule successfully updated with the Recovery Plan!");
    }
  };

  const toggleTask = (taskId: string, currentStatus: string) => {
    if (currentStatus === 'done') {
      updateTask(taskId, { status: 'todo' });
    } else {
      updateTask(taskId, { status: 'done' });
    }
  };

  const [loadingStage, setLoadingStage] = useState(0);

  // Background planner and scheduler generator hook
  useEffect(() => {
    if (!goal || !goal.isGenerating) return;

    let active = true;

    const generatePlanAndSchedule = async () => {
      try {
        // Stage 0 -> 1: Understanding goal
        setLoadingStage(0);
        await new Promise(r => setTimeout(r, 150));
        if (!active) return;

        // Stage 1 -> 2: Call Planner
        setLoadingStage(1);
        const plannerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/planner`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: goal.title,
            description: goal.description || "",
            deadline: new Date(goal.deadline).toISOString().split('T')[0],
            availableHours: goal.estimatedTotalHours ? String(goal.estimatedTotalHours) : "12",
            category: "personal"
          })
        });

        if (!plannerRes.ok) throw new Error("Planner failed");
        const plannerData = await plannerRes.json();
        if (!active) return;

        // Stage 2 -> 3: Estimating effort
        setLoadingStage(2);
        await new Promise(r => setTimeout(r, 150));
        if (!active) return;

        // Stage 3 -> 4: Scheduler Agent
        setLoadingStage(3);
        const scheduleRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/scheduler`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalId: goal.id,
            title: goal.title,
            deadline: new Date(goal.deadline).toISOString().split('T')[0],
            availableHours: goal.estimatedTotalHours ? String(Math.round(goal.estimatedTotalHours / 3)) : "4",
            workingWindow,
            tasks: plannerData.tasks,
            existingSchedules: schedules
          })
        });

        if (!scheduleRes.ok) throw new Error("Scheduler failed");
        const scheduleData = await scheduleRes.json();
        if (!active) return;

        // Stage 4 -> 5: Risk Analysis Agent call
        setLoadingStage(4);
        const daysRemaining = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        const riskRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/agents/risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: goal.title,
            successProbability: goal.successProbability || 78,
            riskLevel: goal.riskLevel || 'Low',
            totalTasks: plannerData.tasks.length,
            completedTasks: 0,
            daysRemaining,
            tasks: plannerData.tasks.map((t: any) => ({
              title: t.task || t.taskTitle,
              status: 'todo',
              priority: t.priority || 'Medium',
              durationMinutes: (t.hours || 1) * 60
            })),
          })
        });

        let aiRiskExplanation = "Timeline and risk factors optimized.";
        if (riskRes.ok) {
          const riskData = await riskRes.json();
          if (riskData.aiRiskExplanation) aiRiskExplanation = riskData.aiRiskExplanation;
        }
        if (!active) return;

        // Stage 5 -> 6: Commit all data to state and clear generating flag
        setLoadingStage(5);
        await new Promise(r => setTimeout(r, 150));
        if (!active) return;

        // 1. Add tasks to store
        if (plannerData.tasks && Array.isArray(plannerData.tasks)) {
          for (let i = 0; i < plannerData.tasks.length; i++) {
            const t = plannerData.tasks[i];
            await addTask({
              id: `t-${goal.id}-${i}-${Date.now()}`,
              goalId: goal.id,
              title: t.task || t.taskTitle,
              status: "todo",
              durationMinutes: (t.hours || 1) * 60,
              impactScore: t.priority === 'Critical' ? 95 : t.priority === 'High' ? 80 : t.priority === 'Medium' ? 50 : 20,
              priority: t.priority || "Medium",
              createdAt: new Date()
            });
          }
        }

        // 2. Set schedule
        await setSchedule(goal.id, scheduleData);

        if (scheduleData.messageForUser) {
          alert(`AI Scheduler Alert:\n\n${scheduleData.messageForUser}`);
        }

        // 3. Update parent Goal record
        await updateGoal(goal.id, {
          isGenerating: false, // End loading experience
          aiSummary: plannerData.aiSummary,
          estimatedTotalHours: plannerData.estimatedTotalHours,
          aiRiskExplanation
        });

      } catch (err) {
        console.error("AI Generation pipeline failed:", err);
        // Fallback to clear generating status so the page doesn't hang
        await updateGoal(goal.id, { isGenerating: false });
      }
    };

    generatePlanAndSchedule();

    return () => {
      active = false;
    };
  }, [goal?.id, goal?.isGenerating]);

  useEffect(() => {
    const foundGoal = goals.find(g => g.id === id);
    if (!foundGoal) return;
    
    setGoal(foundGoal);
    setGoalTasks(tasks.filter(t => t.goalId === id));
  }, [id, goals, tasks]);

  if (!goal) {
    return (
      <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center text-white">
        Loading or Goal Not Found...
      </div>
    );
  }

  if (goal.isGenerating) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-8 relative min-h-[80vh]">
          {/* Centered Premium Overlay loading timeline */}
          <div className="absolute inset-0 bg-[#090a0f]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <AiLoadingExperience stageIndex={loadingStage} operationName="Goal Planner & Schedule" />
          </div>

          {/* SKELETON PLACEHOLDERS */}
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none opacity-40">
            <div className="space-y-3 flex-1">
              <div className="h-3 w-32 bg-slate-800/60 rounded shimmer" />
              <div className="h-8 w-2/3 max-w-md bg-slate-800/60 rounded-xl shimmer" />
              <div className="h-4 w-1/2 max-w-sm bg-slate-800/40 rounded shimmer" />
            </div>
            <div className="h-14 w-64 bg-[#11131e]/50 border border-slate-800/50 rounded-2xl shimmer" />
          </div>

          {/* Next Best Action */}
          <div className="h-40 bg-[#11131e]/50 border border-slate-800/50 rounded-2xl shimmer select-none opacity-40" />

          {/* Two column layout for Tasks and Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none opacity-40">
            {/* Tasks */}
            <div className="bg-[#11131e]/50 border border-slate-800/50 rounded-2xl p-6 space-y-4">
              <div className="h-6 w-40 bg-slate-800/60 rounded shimmer" />
              <div className="space-y-3 pt-2">
                <div className="h-16 bg-black/20 border border-slate-900/40 rounded-xl shimmer" />
                <div className="h-16 bg-black/20 border border-slate-900/40 rounded-xl shimmer" />
                <div className="h-16 bg-black/20 border border-slate-900/40 rounded-xl shimmer" />
              </div>
            </div>
            
            {/* Schedule */}
            <div className="bg-[#11131e]/50 border border-slate-800/50 rounded-2xl p-6 space-y-4">
              <div className="h-6 w-48 bg-slate-800/60 rounded shimmer" />
              <div className="space-y-4 pt-2">
                <div className="flex gap-4">
                  <div className="h-full w-2 bg-slate-800/60 rounded shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-12 bg-black/20 border border-slate-900/40 rounded-xl shimmer" />
                    <div className="h-12 bg-black/20 border border-slate-900/40 rounded-xl shimmer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Risk and Recovery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none opacity-40 mb-8">
            <div className="h-32 bg-[#11131e]/50 border border-slate-800/50 rounded-2xl shimmer" />
            <div className="h-32 bg-[#11131e]/50 border border-slate-800/50 rounded-2xl shimmer" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const daysRemaining = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const completedTasks = goalTasks.filter(t => t.status === 'done').length;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Goal Execution Profile</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">{goal.title}</h1>
            <p className="text-sm text-slate-500 mt-1.5">{goal.description || "Created via onboarding"}</p>
          </div>
          
          <div className="flex items-center gap-4 bg-[#11131e] px-5 py-3 rounded-2xl border border-slate-800/80 shadow-md">
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Risk Level</div>
              <div className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full mt-1.5 inline-block ${
                goal.riskLevel === 'Low' ? 'text-green-400 bg-green-400/10 border border-green-500/20' :
                goal.riskLevel === 'Medium' ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-500/20' :
                'text-red-400 bg-red-400/10 border border-red-500/20'
              }`}>{goal.riskLevel}</div>
            </div>
            
            <div className="w-px h-8 bg-slate-800" />
            
            <Button 
              variant="outline"
              className="border-red-900/30 text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
              onClick={async () => {
                if (confirm("Are you sure you want to delete this goal?")) {
                  await removeGoal(goal.id);
                  router.push("/goals");
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Goal AI Recommendation: Next Best Action */}
        {recTask && (
          <Card className="bg-gradient-to-br from-[#1b1c26] to-[#11131e] border-slate-800/80 relative overflow-hidden shadow-2xl rounded-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#3b82f6]/5 rounded-full blur-3xl pointer-events-none" />
            <CardHeader className="pb-3">
              <CardTitle className="text-[10px] text-[#3b82f6] font-bold uppercase tracking-widest">Next Best Action Recommendation</CardTitle>
              <h3 className="text-2xl font-black text-white mt-1.5 leading-tight">{recTask.title}</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-xl p-4 border border-slate-800/50 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Estimated Duration</div>
                    <div className="text-base font-bold text-white mt-0.5">{recTask.durationMinutes} mins</div>
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-slate-800/50 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <AlertTriangle className="w-5 h-5 text-green-450" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Impact Score</div>
                    <div className="text-base font-bold text-white mt-0.5">{impactText}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-950/20 border border-blue-900/35 rounded-xl p-4 flex gap-3">
                <BrainCircuit className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-[#3b82f6]">AI Context Strategy:</span> {reason}
                </div>
              </div>
              
              <Button 
                onClick={handleStartSession}
                disabled={isSessionActive || recTask.status === 'in-progress'}
                className={`w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-none ${
                  isSessionActive || recTask.status === 'in-progress'
                  ? "bg-green-950/20 text-green-400 border border-green-900/30" 
                  : "bg-[#3b82f6] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25"
                }`}
              >
                {(isSessionActive || recTask.status === 'in-progress') ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                    Session Active... Focus Mode Running
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-white" />
                    Start Focus Session
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Goal Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#11131e] border-slate-800/80 rounded-2xl">
            <CardContent className="p-5 flex flex-col items-center text-center justify-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Target Deadline</div>
              <div className="text-base font-extrabold text-white">{new Date(goal.deadline).toLocaleDateString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-[#11131e] border-slate-800/80 rounded-2xl">
            <CardContent className="p-5 flex flex-col items-center text-center justify-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Remaining Time</div>
              <div className="text-base font-extrabold text-white">{daysRemaining} Days</div>
            </CardContent>
          </Card>
          <Card className="bg-[#11131e] border-slate-800/80 rounded-2xl">
            <CardContent className="p-5 flex flex-col items-center text-center justify-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Goals Tasks</div>
              <div className="text-base font-extrabold text-white">{goalTasks.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-[#11131e] border-slate-800/80 rounded-2xl">
            <CardContent className="p-5 flex flex-col items-center text-center justify-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Tasks Completed</div>
              <div className="text-base font-extrabold text-green-400">{completedTasks}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Task Checklist */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="bg-[#11131e] border-slate-800/80 rounded-2xl shadow-lg">
              <CardHeader className="border-b border-slate-900/60 pb-4">
                <CardTitle className="text-lg font-bold text-white">AI-Generated Checklist</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Tap a task card directly to complete or restore execution</p>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {goalTasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => toggleTask(task.id, task.status)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    task.status === 'done' ? 'bg-black/20 border-slate-900/50 text-slate-500 line-through' :
                    task.priority === 'Critical' ? 'bg-red-950/10 border-red-900/30 text-white hover:bg-red-950/20' :
                    'border-slate-800/50 hover:bg-slate-800/40 text-slate-300'
                  }`}>
                    <div className="flex items-center gap-3.5">
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <Circle className={`w-5 h-5 shrink-0 ${task.priority === 'Critical' ? 'text-red-400' : 'text-slate-655 text-slate-600'}`} />
                      )}
                      <div>
                        <span className="font-semibold block text-sm">{task.title}</span>
                        <div className="flex items-center gap-3 text-[10px] mt-1 text-slate-500 font-bold uppercase">
                          <span className={`px-1.5 py-0.5 rounded ${
                            task.priority === 'Critical' ? 'bg-red-900/20 text-red-400' :
                            task.priority === 'High' ? 'bg-orange-900/20 text-orange-400' :
                            'bg-slate-800 text-slate-400'
                          }`}>{task.priority}</span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> {task.durationMinutes} mins
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Generated Execution Schedule */}
            <Card className="bg-[#11131e] border-slate-800/80 rounded-2xl shadow-lg relative overflow-hidden min-h-[200px]">
              {isRegeneratingSchedule && (
                <div className="absolute inset-0 bg-[#090a0f]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <AiLoadingExperience 
                    stageIndex={2}
                    operationName="Schedule Generator"
                    stages={["Analyzing current tasks", "Finding optimal time blocks", "Building execution plan"]}
                    messages={["Mapping execution schedules inside your customized working slots...", "Balancing task allocations to match cognitive capacity..."]}
                    size="default"
                  />
                </div>
              )}
              <CardHeader className="border-b border-slate-900/60 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    AI Execution Schedule
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">Calendar sync controls and daily schedules</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRegenerateSchedule} 
                  disabled={isRegeneratingSchedule}
                  className="border-slate-800 text-xs bg-slate-900/60 hover:bg-slate-850 hover:text-white cursor-pointer"
                >
                  {isRegeneratingSchedule ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <RefreshCw className="w-3 h-3 mr-1.5" />}
                  Regenerate
                </Button>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                {!schedules[id] && !isRegeneratingSchedule ? (
                  <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                    No schedule generated.
                  </div>
                ) : !schedules[id] && isRegeneratingSchedule ? (
                  <div className="space-y-4 select-none opacity-40">
                    <div className="flex gap-4 pt-2">
                      <div className="h-full w-2 bg-slate-800/60 rounded shimmer" />
                      <div className="flex-1 space-y-2">
                        <div className="h-12 bg-black/20 border border-slate-900/40 rounded-xl shimmer" />
                        <div className="h-12 bg-black/20 border border-slate-900/40 rounded-xl shimmer" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {schedules[id].days.map((dayPlan, i) => (
                      <div key={i} className="relative pl-6 border-l border-slate-800 last:border-0 pb-6 last:pb-0">
                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500/50 border border-[#11131e]" />
                        <h3 className="text-xs font-bold text-[#3b82f6] mb-3 uppercase tracking-wider">{dayPlan.day}</h3>
                        <div className="grid gap-2">
                          {dayPlan.tasks.map((t, j) => (
                            <div key={j} className="flex justify-between items-center bg-black/35 px-4 py-3 rounded-xl border border-slate-900/50">
                              <span className="text-sm text-slate-200 font-semibold">{t.taskTitle}</span>
                              <div className="flex items-center gap-3">
                                {(t.startTime && t.endTime) && (
                                  <span className="text-xs text-slate-500 font-semibold">{t.startTime} - {t.endTime}</span>
                                )}
                                <span className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 border border-slate-800 rounded font-bold">{t.hours}h</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {(schedules[id].lastSyncedScheduleHash && schedules[id].lastSyncedScheduleHash !== JSON.stringify(schedules[id].days)) ? (
                      <div className="bg-orange-950/20 border border-orange-900/35 p-4 rounded-xl flex flex-col gap-3 mt-6">
                        <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                          <AlertTriangle className="w-5 h-5 text-orange-400" />
                          Execution Schedule Updated
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">The schedule was modified locally or by the Recovery agent. Sync your active calendars to update external agendas.</p>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <div className="flex-1">
                            <CalendarSyncButton schedule={schedules[id]} goal={goal} />
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            <Button 
                              variant="outline" 
                              className="w-full h-10 border-slate-800 text-slate-400 hover:bg-slate-800/40 rounded-xl text-xs font-semibold" 
                              onClick={() => {
                                const updatedSchedule = { ...schedules[id], lastSyncedScheduleHash: JSON.stringify(schedules[id].days) };
                                setSchedule(id, updatedSchedule);
                              }}
                            >
                              Dismiss Sync Check
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-slate-900/50">
                        <CalendarSyncButton schedule={schedules[id]} goal={goal} />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: AI Analytics & Recovery Plan */}
          <div className="space-y-6">
            
            {/* AI Strategic Planner summary */}
            {goal.aiSummary && (
              <Card className="bg-gradient-to-br from-purple-950/15 to-blue-950/10 border-purple-900/30 shadow-lg rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                    AI Planning Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {goal.aiSummary}
                  </p>
                  <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-slate-900/50">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Estimated Effort</div>
                    <div className="text-xs font-extrabold text-white">{goal.estimatedTotalHours || goalTasks.reduce((acc, t) => acc + (t.durationMinutes/60), 0)} Hours</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Risk Analysis Card */}
            <Card className="bg-[#11131e] border-slate-800/80 rounded-2xl relative overflow-hidden min-h-[140px]">
              {isAnalyzingRisk && (
                <div className="absolute inset-0 bg-[#090a0f]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <AiLoadingExperience 
                    stageIndex={1}
                    operationName="Risk Analysis"
                    stages={["Evaluating timeline margins", "Predicting failure points", "Generating risk profile"]}
                    messages={["Running risk simulation models on timeline completion margins...", "Synthesizing constraints and target milestones..."]}
                    size="compact"
                  />
                </div>
              )}
              <CardHeader className="pb-3 border-b border-slate-900/60">
                <CardTitle className="text-sm text-white font-bold uppercase tracking-wider flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${
                      goal.riskLevel === 'Low' ? 'text-green-500' :
                      goal.riskLevel === 'Medium' ? 'text-yellow-500' :
                      'text-red-500'
                    }`} />
                    AI Risk Analysis
                  </div>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handleAnalyzeRisk}
                    disabled={isAnalyzingRisk}
                    className="h-7 border-slate-800 text-[10px] bg-slate-900/60 hover:bg-slate-800 text-white cursor-pointer"
                  >
                    {isAnalyzingRisk ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <BrainCircuit className="w-3 h-3 mr-1" />}
                    Analyze Risk
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {!goal.aiRiskExplanation && isAnalyzingRisk ? (
                  <div className="space-y-3 select-none opacity-40 py-2">
                    <div className="h-3 w-5/6 bg-slate-800/60 rounded shimmer" />
                    <div className="h-3 w-2/3 bg-slate-800/60 rounded shimmer" />
                    <div className="h-3 w-4/5 bg-slate-800/60 rounded shimmer" />
                  </div>
                ) : goal.aiRiskExplanation ? (
                  <div className="p-3.5 bg-black/40 rounded-xl text-xs text-slate-350 leading-relaxed border border-slate-900/60">
                    {goal.aiRiskExplanation}
                  </div>
                ) : (
                  <div className="p-6 bg-black/30 rounded-xl text-xs text-slate-500 flex flex-col items-center justify-center text-center border border-slate-900/40 py-8">
                    <BrainCircuit className="w-6 h-6 mb-2 opacity-30 text-slate-500" />
                    <p>Trigger risk evaluation to verify target completion margins.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Recovery Agent */}
            {(goal.riskLevel === 'High' || goal.riskLevel === 'Critical') && (
              <Card className="bg-gradient-to-br from-red-950/20 to-orange-950/15 border-red-900/35 shadow-lg rounded-2xl relative overflow-hidden min-h-[160px]">
                {isGeneratingRecovery && (
                  <div className="absolute inset-0 bg-[#090a0f]/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <AiLoadingExperience 
                      stageIndex={1}
                      operationName="Recovery Agent"
                      stages={["Analyzing critical paths", "Applying recovery buffers", "Formulating recovery strategy"]}
                      messages={["Applying recovery buffer strategy for critical paths...", "Mapping execution schedules inside your customized working slots..."]}
                      size="compact"
                    />
                  </div>
                )}
                <CardHeader className="pb-3 border-b border-red-900/20">
                  <CardTitle className="text-sm text-white font-bold uppercase tracking-wider flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      Recovery Agent
                    </div>
                    <Button 
                      size="sm"
                      onClick={handleGenerateRecovery}
                      disabled={isGeneratingRecovery}
                      className="h-7 text-[10px] bg-red-500 hover:bg-red-600 text-white cursor-pointer border-none"
                    >
                      {isGeneratingRecovery ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <BrainCircuit className="w-3 h-3 mr-1" />}
                      Re-Plan Goal
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {!goal.aiRecoveryPlan && isGeneratingRecovery ? (
                    <div className="space-y-4 select-none opacity-40 py-2">
                      <div className="h-3 w-full bg-slate-800/60 rounded shimmer" />
                      <div className="h-3 w-3/4 bg-slate-800/60 rounded shimmer" />
                      <div className="h-10 w-full bg-slate-800/60 rounded-xl shimmer mt-4" />
                    </div>
                  ) : goal.aiRecoveryPlan ? (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-black/40 rounded-xl text-xs border border-red-500/20">
                        <div className="text-[10px] font-bold text-red-400 mb-2 uppercase">Recommendations</div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-300">
                          {goal.aiRecoveryPlan.recommendations.map((r, idx) => <li key={idx}>{r}</li>)}
                        </ul>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div className="p-3.5 bg-black/40 rounded-xl text-xs border border-slate-900/60">
                          <div className="text-[10px] font-bold text-yellow-400 mb-2 uppercase">Revised Priorities</div>
                          <ul className="list-disc pl-4 space-y-1 text-slate-350">
                            {goal.aiRecoveryPlan.revisedPriorities.map((r, idx) => <li key={idx}>{r}</li>)}
                          </ul>
                        </div>
                        <div className="p-3.5 bg-black/40 rounded-xl text-xs border border-slate-900/60">
                          <div className="text-[10px] font-bold text-green-400 mb-2 uppercase">Focus Actions</div>
                          <ul className="list-disc pl-4 space-y-1 text-slate-355">
                            {goal.aiRecoveryPlan.focusActions.map((r, idx) => <li key={idx}>{r}</li>)}
                          </ul>
                        </div>
                      </div>

                      <Button onClick={handleApplyRecoveryPlan} className="w-full h-10 bg-white hover:bg-white/90 text-black font-extrabold text-xs rounded-xl cursor-pointer border-none">
                        Apply Recovery Schedule
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 bg-black/40 rounded-xl text-xs text-red-200/60 border border-red-900/20 text-center font-semibold">
                      Goal is at risk! Generate a recovery plan to receive an AI-adjusted execution schedule.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
