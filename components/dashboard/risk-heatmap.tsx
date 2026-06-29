"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";

export function RiskHeatmap() {
  const { goals } = useStore();
  const activeGoals = goals.filter(g => g.progress < 100).sort((a, b) => a.successProbability - b.successProbability);

  return (
    <Card className="bg-[#13131a] border-white/5 h-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white">Risk Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.map(goal => (
          <div key={goal.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 transition-all hover:bg-white/10 cursor-default">
            <div className={`w-3 h-3 rounded-full ${
              goal.riskLevel === 'Low' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' :
              goal.riskLevel === 'Medium' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]' :
              'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
            }`} />
            <span className="text-sm font-semibold text-white truncate max-w-[200px]">{goal.title}</span>
            <span className="ml-auto text-xs text-muted-foreground">{goal.successProbability}% Success</span>
          </div>
        ))}
        {activeGoals.length === 0 && (
          <div className="text-sm text-muted-foreground italic p-4 text-center">No active goals to analyze.</div>
        )}
      </CardContent>
    </Card>
  );
}
