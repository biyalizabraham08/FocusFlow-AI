"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useStore } from "@/lib/store";

export function ProbabilityCard() {
  const { goals } = useStore();
  const activeGoals = goals.filter(g => g.progress < 100);
  
  const probability = activeGoals.length > 0 
    ? Math.round(activeGoals.reduce((acc, g) => acc + g.successProbability, 0) / activeGoals.length)
    : 100;
  
  const riskLevels = activeGoals.map(g => g.riskLevel);
  let overallRisk = 'Low';
  if (riskLevels.includes('Critical')) overallRisk = 'Critical';
  else if (riskLevels.includes('High')) overallRisk = 'High';
  else if (riskLevels.includes('Medium')) overallRisk = 'Medium';

  return (
    <Card className="bg-[#13131a] border-white/5 relative overflow-hidden flex-1 flex flex-col items-center justify-center py-10 px-4">
      <div className="absolute top-4 right-4 text-yellow-500">
        <Star className="w-5 h-5 fill-yellow-500" />
      </div>
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8 relative z-10 w-full">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Overall Portfolio</h2>
        <p className="text-sm font-medium text-primary">Success Probability</p>
      </div>

      <CardContent className="flex flex-col items-center relative z-10 p-0 w-full">
        {/* Beautiful Circular Chart */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-8">
          
          {/* Outer glowing ring */}
          <div className="absolute inset-0 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]" />
          
          {/* SVG Progress */}
          <svg className="w-full h-full transform -rotate-90 absolute inset-0 drop-shadow-2xl" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              className="text-white/5 stroke-current"
              strokeWidth="6"
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
            ></circle>
            {/* Animated Foreground Track */}
            <circle
              className="stroke-[url(#gradient)] drop-shadow-[0_0_15px_rgba(129,140,248,0.5)] transition-all duration-1000 ease-out"
              strokeWidth="6"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * probability) / 100}
            ></circle>
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
              {probability}%
            </span>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-2">Overall Risk Level</div>
          <div className={`px-6 py-1.5 rounded-full font-bold text-sm ${
            overallRisk === 'Low' ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]' :
            overallRisk === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]' :
            'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
          }`}>
            {overallRisk}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
