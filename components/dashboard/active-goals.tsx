"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/store";

export function ActiveGoalsList() {
  const { goals } = useStore();
  const activeGoals = goals.filter(g => g.progress < 100);

  return (
    <Card className="bg-[#13131a] border-white/5 h-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">Active Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeGoals.map((goal, i) => {
          const colors = ["bg-indigo-500", "bg-purple-500", "bg-green-500", "bg-blue-500"];
          const color = colors[i % colors.length];
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-white truncate pr-4">{goal.title}</span>
                <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">{goal.progress}%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${color} rounded-full`} 
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          );
        })}
        {activeGoals.length === 0 && (
          <div className="text-sm text-muted-foreground italic p-4 text-center">No active goals found.</div>
        )}
      </CardContent>
    </Card>
  );
}
