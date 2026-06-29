"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { Calendar, XCircle, RefreshCw, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CalendarPage() {
  const { schedules, goals, calendarStatus, setCalendarStatus } = useStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise((r) => setTimeout(r, 1200));
    await setCalendarStatus({
      isSynced: true,
      lastSyncTime: new Date().toISOString()
    });
    setIsSyncing(false);
  };

  const handleDisconnect = async () => {
    await setCalendarStatus({
      isSynced: false,
      lastSyncTime: null
    });
  };

  // Compile scheduled tasks by day from all goals
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const scheduleByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = [] as { goalTitle: string; taskTitle: string; startTime?: string; endTime?: string; hours: number }[];
    return acc;
  }, {} as Record<string, { goalTitle: string; taskTitle: string; startTime?: string; endTime?: string; hours: number }[]>);

  // Populate schedule map
  Object.values(schedules).forEach((schedule) => {
    const goal = goals.find((g) => g.id === schedule.goalId);
    if (!goal) return;

    schedule.days.forEach((dayData) => {
      if (scheduleByDay[dayData.day]) {
        dayData.tasks.forEach((task) => {
          scheduleByDay[dayData.day].push({
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

  const totalScheduledTasks = Object.values(scheduleByDay).reduce((sum, list) => sum + list.length, 0);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Weekly Schedule</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and sync your AI-planned execution schedule</p>
          </div>

          <div className="flex items-center gap-3">
            {calendarStatus.isSynced ? (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/25 px-4 py-2 rounded-xl">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-green-400">Google Calendar Synced</span>
                <button
                  onClick={handleDisconnect}
                  className="text-xs text-slate-400 hover:text-red-400 font-bold transition-colors cursor-pointer border-none bg-transparent ml-2"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3b82f6] text-white hover:bg-blue-600 font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync to Google Calendar"}
              </button>
            )}
          </div>
        </div>

        {/* Sync Mode Note Banner */}
        {!calendarStatus.isSynced && (
          <div className="bg-[#11131e] border border-slate-800/80 p-4 rounded-2xl flex items-start gap-3">
            <XCircle className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-400 leading-relaxed">
              <span className="font-bold text-white block mb-0.5">Google Calendar Sync Pending</span>
              We are not able to sync directly to Google Calendar because it is currently in test mode. In production level, we will be able to synchronize your execution schedules with your primary Google calendar dynamically.
            </div>
          </div>
        )}

        {totalScheduledTasks === 0 ? (
          /* Empty State */
          <Card className="bg-[#11131e] border-slate-800/80 p-8 md:p-12 text-center rounded-3xl max-w-xl mx-auto shadow-2xl">
            <CardContent className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto border border-blue-500/25">
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">No Scheduled Tasks Yet</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Create a goal and allow FocusFlow AI to automatically schedule your tasks inside your working hours window.
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <Link href="/goals/new">
                  <button className="flex items-center gap-2 bg-[#3b82f6] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 cursor-pointer border-none">
                    Create Your First Goal <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Grid list of days */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {daysOfWeek.map((day) => {
              const dayTasks = scheduleByDay[day] || [];
              const hasTasks = dayTasks.length > 0;
              return (
                <Card 
                  key={day} 
                  className={`border transition-all duration-300 rounded-2xl ${
                    hasTasks 
                      ? "bg-[#11131e] border-slate-800/80 shadow-lg" 
                      : "bg-[#11131e]/20 border-slate-900/40 opacity-50"
                  }`}
                >
                  <CardHeader className="border-b border-slate-900/60 pb-3">
                    <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                      <span>{day}</span>
                      {hasTasks && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25">
                          {dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    {hasTasks ? (
                      <div className="space-y-4">
                        {dayTasks.map((task, idx) => (
                          <div key={idx} className="relative pl-4 border-l border-blue-500/30 space-y-1">
                            <h4 className="text-sm font-semibold text-white truncate leading-tight">
                              {task.taskTitle}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-semibold truncate uppercase">
                              {task.goalTitle}
                            </p>
                            {task.startTime && task.endTime ? (
                              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold pt-0.5">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>{task.startTime} - {task.endTime}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>{task.hours} hr{task.hours > 1 ? "s" : ""} duration</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 py-6 text-center italic">No tasks scheduled</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
