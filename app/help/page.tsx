"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Rocket, 
  Target, 
  BrainCircuit, 
  Settings2, 
  LayoutDashboard, 
  FileText, 
  Calendar as CalendarIcon, 
  Mic, 
  HelpCircle, 
  Info,
  ChevronRight,
  Clock,
  ShieldAlert,
  Activity,
  Bot
} from "lucide-react";

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState("welcome");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const menuItems = [
    { id: "welcome", label: "Welcome", icon: BookOpen },
    { id: "quick-start", label: "Quick Start Guide", icon: Rocket },
    { id: "creating-goal", label: "Creating a Goal", icon: Target },
    { id: "ai-agents", label: "AI Agents", icon: BrainCircuit },
    { id: "ai-modes", label: "AI Modes", icon: Settings2 },
    { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "goal-details", label: "Goal Details", icon: FileText },
    { id: "calendar", label: "Google Calendar", icon: CalendarIcon },
    { id: "voice", label: "Voice Commands", icon: Mic },
    { id: "faq", label: "Frequently Asked Questions", icon: HelpCircle },
    { id: "about", label: "About FocusFlow", icon: Info },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row h-full max-w-7xl mx-auto gap-8">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-800/80 pr-0 md:pr-6 pb-6 md:pb-0 mb-6 md:mb-0">
          <div className="sticky top-0 space-y-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pl-3">Documentation</h3>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 text-sm font-semibold border ${
                  activeSection === item.id
                    ? "bg-[#3b82f6] border-[#3b82f6] text-white shadow-lg shadow-blue-500/20"
                    : "bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
                {activeSection === item.id && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 space-y-12 pb-20">
          
          <div className="space-y-2 mb-8">
            <h1 className="text-4xl font-black text-white tracking-tight">Help & Documentation</h1>
            <p className="text-slate-400">Everything you need to master FocusFlow AI and supercharge your productivity.</p>
          </div>

          {/* Welcome */}
          <section id="welcome" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <BookOpen className="w-5 h-5 text-blue-400" /> Welcome to FocusFlow AI
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-slate-300 space-y-4">
                <p>
                  FocusFlow AI is your intelligent execution engine. We combine state-of-the-art AI planning, dynamic risk prediction, and adaptive coaching to help you achieve your most ambitious goals.
                </p>
                <p>
                  Unlike a traditional to-do list, FocusFlow acts as a strategic partner. It breaks down goals into manageable tasks, schedules them into your actual working windows, monitors your progress, and automatically adjusts its strategy if you fall behind.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Quick Start Guide */}
          <section id="quick-start" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <Rocket className="w-5 h-5 text-purple-400" /> Quick Start Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-slate-300 space-y-6">
                <ol className="space-y-4 list-decimal list-inside marker:text-blue-500 marker:font-bold">
                  <li><strong className="text-white">Configure your Settings:</strong> Go to the Settings page to define your Working Window and choose your preferred AI Voice.</li>
                  <li><strong className="text-white">Create your first Goal:</strong> Click the 'New Goal' button on the Goals page. Tell the AI what you want to achieve.</li>
                  <li><strong className="text-white">Let the AI Plan:</strong> The Goal Planner will automatically break your goal into tasks, and the Smart Scheduler will map them to your calendar.</li>
                  <li><strong className="text-white">Start Executing:</strong> Head to the Dashboard and click 'Start Focus Session' on your Today's Mission.</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          {/* Creating a Goal */}
          <section id="creating-goal" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-green-400" /> Creating a Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-slate-300 space-y-4">
                <p>Goals are the core of FocusFlow. To create one, you need four key pieces of information:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-black/40 p-4 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-white mb-1">Title & Description</h4>
                    <p className="text-sm">Be as specific as possible. The AI uses this context to generate highly accurate tasks.</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-white mb-1">Deadline</h4>
                    <p className="text-sm">When must this goal be completed? The AI will strictly enforce this limit.</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-white mb-1">Available Hours</h4>
                    <p className="text-sm">How many hours per day can you dedicate to this specific goal?</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI Agents */}
          <section id="ai-agents" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <BrainCircuit className="w-5 h-5 text-blue-400" /> Meet Your AI Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                      <Bot className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">The Goal Planner</h4>
                      <p className="text-sm text-slate-400 mt-1">Breaks your high-level goal into actionable, chronological tasks and estimates the time required for each.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">The Smart Scheduler</h4>
                      <p className="text-sm text-slate-400 mt-1">Takes the Planner's tasks and maps them day-by-day onto your calendar, strictly respecting your Working Window settings.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                      <ShieldAlert className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">The Risk Predictor</h4>
                      <p className="text-sm text-slate-400 mt-1">Continuously analyzes your completion rate against the ticking deadline. It identifies when a goal is moving from 'Low Risk' to 'Critical'.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                      <Activity className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">The Recovery Agent</h4>
                      <p className="text-sm text-slate-400 mt-1">When a goal enters High or Critical risk, this agent generates a crisis-management plan, rescopes priorities, and provides actionable steps to get back on track.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI Modes */}
          <section id="ai-modes" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <Settings2 className="w-5 h-5 text-indigo-400" /> AI Adaptive Modes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-slate-300 space-y-4">
                <p>FocusFlow adapts its personality and strictness based on your selected mode (configurable in Settings):</p>
                <ul className="space-y-4 mt-4">
                  <li className="bg-black/30 p-4 rounded-xl border border-slate-800/80">
                    <strong className="text-white text-base block mb-1">🎯 Focus Mode</strong>
                    Zero distractions. Minimal notifications. The UI hides greetings and AI strategy text to keep your eyes entirely on the current task.
                  </li>
                  <li className="bg-black/30 p-4 rounded-xl border border-slate-800/80">
                    <strong className="text-white text-base block mb-1">🤝 Coach Mode (Default)</strong>
                    Balanced and encouraging. The AI explains why tasks matter, offers praise, and operates with standard risk tolerances.
                  </li>
                  <li className="bg-black/30 p-4 rounded-xl border border-slate-800/80">
                    <strong className="text-white text-base block mb-1">🚨 Accountability Mode</strong>
                    Strict and urgent. The AI flags risk earlier, displays urgent warning banners on your dashboard, and proactively reminds you of deadlines.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Dashboard Overview */}
          <section id="dashboard" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <LayoutDashboard className="w-5 h-5 text-blue-400" /> Dashboard Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-slate-300 space-y-4">
                <p>The Dashboard is your daily command center:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Today's Mission:</strong> The absolute highest-priority task you should be working on right now.</li>
                  <li><strong>Focus Timer:</strong> Click "Start Focus Session" to launch a Pomodoro-style timer for your active task.</li>
                  <li><strong>Today's Schedule:</strong> A chronological timeline of exactly what you need to do today, as scheduled by the AI.</li>
                  <li><strong>Active Goals:</strong> A quick snapshot of your overall progress across all projects.</li>
                </ul>
              </CardContent>
            </Card>
          </section>
          
          {/* Goal Details */}
          <section id="goal-details" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-blue-400" /> Goal Details & Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-slate-300 space-y-4">
                <p>Clicking into a specific goal provides deep analytics:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Success Probability:</strong> A real-time % chance of hitting your deadline based on your velocity.</li>
                  <li><strong>Task List:</strong> Drag and drop tasks between Todo, In Progress, and Done.</li>
                  <li><strong>Schedule View:</strong> See the AI's day-by-day mapping of your tasks.</li>
                  <li><strong>Activity Log:</strong> A transparent log of every time the AI analyzed your progress and adjusted its strategy.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Calendar Sync */}
          <section id="calendar" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <CalendarIcon className="w-5 h-5 text-orange-400" /> Google Calendar Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-slate-300 space-y-4">
                <p>
                  You can sync the AI-generated schedules directly to your Google Calendar.
                  Head to the <strong>Calendar</strong> page to authorize access.
                </p>
                <p>
                  Once synced, any tasks scheduled by the AI will appear as time-blocked events on your Google Calendar, complete with descriptions and goal context. If the AI reschedules tasks because you fell behind, you can hit the "Sync" button again to update your calendar.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Voice Commands */}
          <section id="voice" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <Mic className="w-5 h-5 text-pink-400" /> Voice Commands
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-slate-300 space-y-4">
                <p>
                  The Voice Assistant allows for hands-free interaction with the app. It's context-aware and knows about your current goals and tasks.
                </p>
                <div className="bg-black/30 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-white mb-2">Example Commands:</h4>
                  <ul className="space-y-2 text-sm text-slate-400 font-mono">
                    <li>"Navigate to the dashboard."</li>
                    <li>"Add a task to write the API documentation."</li>
                    <li>"Create a new goal to launch the website by next Friday, 4 hours a day."</li>
                    <li>"Mark the database setup task as done."</li>
                    <li>"Analyze the risk for my current goal."</li>
                    <li>"I'm falling behind, generate a recovery plan."</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <HelpCircle className="w-5 h-5 text-emerald-400" /> Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="bg-black/30 p-4 rounded-xl border border-slate-800/50">
                    <h4 className="font-bold text-white">What happens if I miss a scheduled task?</h4>
                    <p className="text-sm text-slate-400 mt-2">The Risk Predictor will notice the missed execution. If your success probability drops significantly, the Recovery Agent will intervene and suggest a new plan. Otherwise, you can simply complete the task late.</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-slate-800/50">
                    <h4 className="font-bold text-white">Can I change my working window?</h4>
                    <p className="text-sm text-slate-400 mt-2">Yes, go to Settings. If you change your working window, you will need to ask the AI to generate a new schedule for your existing goals to respect the new hours.</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-slate-800/50">
                    <h4 className="font-bold text-white">Do I need an API key to use the Voice Assistant?</h4>
                    <p className="text-sm text-slate-400 mt-2">Yes. FocusFlow uses Gemini or OpenRouter API keys which must be provided in your `.env.local` file for the AI agents to function.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* About */}
          <section id="about" className="scroll-mt-8">
            <Card className="bg-[#11131e]/50 border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <Info className="w-5 h-5 text-blue-400" /> About FocusFlow AI
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-slate-300">
                <p>
                  FocusFlow AI was designed to solve the problem of overwhelming to-do lists and missed deadlines. By leveraging advanced Language Models as autonomous agents (Planners, Schedulers, Risk Analyzers), FocusFlow offloads the cognitive burden of project management, allowing you to focus entirely on execution.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#a855f7] flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-white font-black text-3xl">F</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

        </div>
      </div>
    </AppLayout>
  );
}
