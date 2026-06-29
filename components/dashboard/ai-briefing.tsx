"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import Link from "next/link";

export function AiBriefingCard() {
  const { goals } = useStore();
  
  const criticalGoals = goals.filter(g => g.riskLevel === 'Critical' || g.riskLevel === 'High');

  return (
    <Card className="bg-[#13131a] border-white/5 h-full relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Daily Briefing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {criticalGoals.length > 0 ? (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white/90 leading-relaxed font-bold">
                  Attention Required
                </p>
                <p className="text-sm text-red-200/70 leading-relaxed mt-1 mb-3">
                  You have {criticalGoals.length} goal(s) at high risk of missing their deadlines. Action is highly recommended.
                </p>
                <div className="space-y-2">
                  {criticalGoals.map(g => (
                    <Link href={`/goals/${g.id}`} key={g.id} className="flex items-center justify-between bg-black/40 hover:bg-black/60 p-2 rounded-lg border border-red-500/10 transition-colors">
                      <span className="text-xs font-semibold text-white/90 truncate mr-2">{g.title}</span>
                      <span className="text-xs text-red-400 flex items-center gap-1 shrink-0">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-sm text-white/90 leading-relaxed font-medium">
              You are currently on track.
            </p>
            <p className="text-sm text-white/70 leading-relaxed mt-2">
              All active goals are in low or medium risk states. Keep up the momentum!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
