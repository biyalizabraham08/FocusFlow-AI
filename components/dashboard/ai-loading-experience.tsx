"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_STAGES = [
  "Understanding your goal",
  "Breaking the goal into tasks",
  "Estimating effort",
  "Building your schedule",
  "Predicting risks",
  "Preparing the final execution plan"
];

const DEFAULT_MESSAGES = [
  "Synthesizing goal constraints and target milestones...",
  "Deconstructing objectives into granular execution tasks...",
  "Analyzing complexity to structure realistic hour estimations...",
  "Mapping execution schedules inside your customized working slots...",
  "Running risk simulation models on timeline completion margins...",
  "Applying recovery buffer strategy for critical paths...",
  "Balancing task allocations to match cognitive capacity...",
  "Aligning calendar schedules with primary notifications..."
];

interface AiLoadingExperienceProps {
  stageIndex: number;
  operationName?: string;
  stages?: string[];
  messages?: string[];
  size?: "default" | "compact";
  className?: string;
}

export function AiLoadingExperience({ 
  stageIndex, 
  operationName = "AI Generation",
  stages = DEFAULT_STAGES,
  messages = DEFAULT_MESSAGES,
  size = "default",
  className
}: AiLoadingExperienceProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Rotate helpful messages every 1.5 seconds
  useEffect(() => {
    if (messages.length === 0) return;
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(messageInterval);
  }, [messages.length]);

  // Track elapsed seconds
  useEffect(() => {
    const elapsedInterval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(elapsedInterval);
  }, []);

  const isCompact = size === "compact";

  return (
    <div className={cn(
      "bg-[#11131e]/90 border border-slate-800/80 rounded-3xl shadow-2xl relative overflow-hidden select-none space-y-6 w-full",
      isCompact ? "p-4 md:p-5 max-w-sm space-y-4" : "p-6 md:p-8 max-w-lg",
      className
    )}>
      {/* Background glow dots */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 relative z-10">
        <div className={cn(
          "rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#a855f7] flex items-center justify-center shadow-lg shadow-blue-500/10",
          isCompact ? "w-8 h-8" : "w-10 h-10"
        )}>
          <Sparkles className={cn("text-white", isCompact ? "w-4 h-4" : "w-5 h-5")} />
        </div>
        <div>
          <h3 className={cn("font-bold text-white tracking-tight", isCompact ? "text-sm" : "text-base")}>
            {operationName} in Progress
          </h3>
          <span className={cn("text-slate-500 font-semibold uppercase tracking-wider", isCompact ? "text-[8px]" : "text-[10px]")}>
            FocusFlow AI Engine
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className={cn("relative z-10", isCompact ? "space-y-2 pt-1" : "space-y-3.5 pt-2")}>
        {stages.map((stage, idx) => {
          const isCompleted = idx < stageIndex;
          const isActive = idx === stageIndex;

          return (
            <div 
              key={idx}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                isCompleted ? "opacity-100 text-slate-400" :
                isActive ? "opacity-100 text-white font-semibold" :
                "opacity-40 text-slate-500"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className={cn("text-green-500 shrink-0", isCompact ? "w-4 h-4" : "w-4.5 h-4.5")} />
              ) : isActive ? (
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className={cn("rounded-full bg-blue-500/10 border border-blue-500/80 flex items-center justify-center shrink-0", isCompact ? "w-4 h-4" : "w-4.5 h-4.5")}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </motion.div>
              ) : (
                <Circle className={cn("text-slate-700 shrink-0", isCompact ? "w-4 h-4" : "w-4.5 h-4.5")} />
              )}
              <span className={cn(isCompact ? "text-[10px]" : "text-xs")}>{stage}</span>
            </div>
          );
        })}
      </div>

      {/* Rotating Helpful AI messages */}
      {messages.length > 0 && (
        <div className={cn(
          "bg-black/35 rounded-xl border border-slate-900/60 flex items-center justify-center text-center relative overflow-hidden z-10",
          isCompact ? "p-3 h-12" : "p-4 h-16"
        )}>
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className={cn("text-blue-400 font-medium leading-normal px-2", isCompact ? "text-[10px]" : "text-[11px]")}
            >
              {messages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* Over-time Reassurance Banner (exceeds 8 seconds) */}
      {secondsElapsed > 8 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("flex items-start gap-2 bg-orange-950/20 border border-orange-900/30 rounded-xl relative z-10", isCompact ? "p-2.5" : "p-3")}
        >
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className={cn("text-orange-300/80 leading-relaxed font-semibold", isCompact ? "text-[9px]" : "text-[10px]")}>
            AI is optimizing the execution plan. Just a moment...
          </p>
        </motion.div>
      )}
    </div>
  );
}
