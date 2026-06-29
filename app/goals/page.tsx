"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, CalendarDays, CheckCircle2, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { AppLayout } from "@/components/layout/app-layout";

export default function GoalsPage() {
  const goals = useStore((state) => state.goals);
  const tasks = useStore((state) => state.tasks);

  const displayGoals = goals;



  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Active Goals</h1>
            <p className="text-sm text-slate-500 mt-1">Track your progress and execution schedules</p>
          </div>
          <Link href="/goals/new">
            <Button className="bg-[#3b82f6] hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 font-semibold border-none cursor-pointer">
              + Create New Goal
            </Button>
          </Link>
        </div>

        {displayGoals.length === 0 ? (
          /* Empty State */
          <Card className="bg-[#11131e] border-slate-800/80 p-8 md:p-12 text-center rounded-3xl max-w-xl mx-auto shadow-2xl">
            <CardContent className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto border border-blue-500/25">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">No Active Goals</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Get started by creating your first AI-planned execution goal.
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <Link href="/goals/new">
                  <button className="flex items-center gap-2 bg-[#3b82f6] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 cursor-pointer border-none">
                    Create Goal <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayGoals.map((goal) => {
              const daysRemaining = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
              const tasksCount = tasks.filter(t => t.goalId === goal.id).length;
              const completedCount = tasks.filter(t => t.goalId === goal.id && t.status === 'done').length;
              const progressPercentage = tasksCount > 0 ? Math.round((completedCount / tasksCount) * 100) : 0;
              
              return (
                <Card key={goal.id} className="bg-[#11131e] border-slate-800/80 flex flex-col hover:border-slate-700 transition-all duration-300 rounded-2xl shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-white truncate">{goal.title}</CardTitle>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mt-1">
                      <span>Progress</span>
                      <span className="text-[#3b82f6]">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-[#3b82f6] h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 pt-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-slate-500" />
                      <span className="text-xs">{completedCount}/{tasksCount} Tasks Completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <CalendarDays className="w-4 h-4 text-slate-500" />
                      <span className="text-xs">{daysRemaining} Days Remaining</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t border-slate-800/40">
                    <Link href={`/goals/${goal.id}`} className="w-full">
                      <Button variant="outline" className="w-full border-slate-800 bg-[#11131e]/50 hover:bg-slate-800/45 hover:text-white rounded-xl font-semibold">
                        Open Goal
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
