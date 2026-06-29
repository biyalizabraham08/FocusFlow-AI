"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Clock, AlertTriangle, Play, Loader2, BrainCircuit } from "lucide-react";
import { useAiRecommendation } from "@/lib/hooks/use-ai-recommendation";
import { useStore } from "@/lib/store";

export function NextTaskCard() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const { task, impactText, reason } = useAiRecommendation();
  const { updateTask } = useStore();

  const handleStartSession = () => {
    if (!task) return;
    setIsSessionActive(true);
    updateTask(task.id, { status: 'in-progress' });
    alert("Focus Session Started! Deep work mode activated. All notifications are now muted.");
  };

  if (!task) {
    return (
      <Card className="bg-gradient-to-br from-[#1a1a24] to-[#13131a] border-white/10 relative overflow-hidden flex-1 flex flex-col justify-center items-center text-center p-8">
        <Star className="w-8 h-8 text-yellow-500/50 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">You&apos;re All Caught Up!</h3>
        <p className="text-muted-foreground text-sm">{reason}</p>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#1a1a24] to-[#13131a] border-white/10 relative overflow-hidden flex-1">
      <div className="absolute top-4 right-4 text-yellow-500">
        <Star className="w-5 h-5 fill-yellow-500" />
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg text-muted-foreground font-medium">What Should I Do Next?</CardTitle>
        <h3 className="text-2xl font-bold text-white mt-2">{task.title}</h3>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Duration</div>
              <div className="text-base font-semibold text-white">{task.durationMinutes} mins</div>
            </div>
          </div>

          <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">Impact</div>
              <div className="text-sm font-semibold text-white">{impactText}</div>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
          <BrainCircuit className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-white/90">
            <span className="font-semibold text-primary">AI Reason:</span> {reason}
          </div>
        </div>

        <Button 
          onClick={handleStartSession}
          disabled={isSessionActive || task.status === 'in-progress'}
          className={`w-full h-14 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            isSessionActive || task.status === 'in-progress'
            ? "bg-green-500/20 text-green-400 border border-green-500/50" 
            : "bg-gradient-to-r from-primary to-indigo-500 text-white hover:opacity-90 shadow-lg shadow-primary/25"
          }`}
        >
          {isSessionActive || task.status === 'in-progress' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Session in Progress...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              Start Focus Session
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
