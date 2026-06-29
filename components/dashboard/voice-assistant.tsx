"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Keyboard, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useVoiceAssistant } from "@/hooks/use-voice-assistant";
import { motion, AnimatePresence } from "framer-motion";
import { AiLoadingExperience } from "./ai-loading-experience";

export function VoiceAssistant() {
  const pathname = usePathname();
  const { isListening, isProcessing, toggleListening, processCommand } = useVoiceAssistant();
  const [showInput, setShowInput] = useState(false);
  const [textInput, setTextInput] = useState("");

  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    
    const cmd = textInput;
    setTextInput("");
    setShowInput(false);
    await processCommand(cmd);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      {/* AI Processing Floating Loading Experience */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="mb-2"
          >
            <AiLoadingExperience 
              stageIndex={1}
              operationName="Voice Assistant"
              stages={["Listening to your command", "Understanding intent", "Executing background tasks", "Preparing response"]}
              messages={["Synthesizing your request...", "Mapping action to execution plan...", "Just a moment..."]}
              size="compact"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showInput && !isProcessing && (
        <form 
          onSubmit={handleSubmit} 
          className="bg-card/90 backdrop-blur-xl border border-border/50 p-2 rounded-2xl shadow-2xl flex items-center gap-2 transition-all"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a command..."
            className="bg-transparent border-none outline-none px-3 py-2 text-sm w-64 text-foreground placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" disabled={!textInput.trim() || isProcessing} className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}

      <div className="flex items-center gap-3">
        <Button
          id="voice-keyboard-btn"
          size="icon"
          variant="outline"
          onClick={() => setShowInput(!showInput)}
          className="w-12 h-12 rounded-full shadow-lg bg-[#11131e]/80 hover:bg-slate-800/80 border border-slate-800/85 text-slate-400 hover:text-white transition-all duration-300 backdrop-blur-md"
        >
          <Keyboard className="w-5 h-5" />
        </Button>

        <div className="relative flex items-center">
          {/* Tooltip Badge */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-20 top-1/2 -translate-y-1/2 bg-[#11131e]/90 backdrop-blur-md border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#60a5fa] whitespace-nowrap shadow-lg shadow-blue-500/10 select-none z-0"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                  Listening...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glowing/pinging background layers */}
          {isListening && (
            <>
              {/* Ring 1: Radar ping */}
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping pointer-events-none" />
              {/* Ring 2: Static breathing ring */}
              <div className="absolute inset-[-10px] bg-blue-600/30 rounded-full animate-pulse pointer-events-none" />
            </>
          )}

          {/* Floating Microphone Button */}
          <motion.button
            id="voice-assistant-btn"
            onClick={toggleListening}
            disabled={isProcessing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              backgroundColor: isListening 
                ? "#ef4444" 
                : isProcessing 
                  ? "#a855f7" 
                  : "#3b82f6",
              boxShadow: isListening 
                ? "0 0 25px rgba(239, 68, 68, 0.5)" 
                : isProcessing
                  ? "0 0 25px rgba(168, 85, 247, 0.5)"
                  : "0 0 20px rgba(59, 130, 246, 0.3)"
            }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 rounded-full flex items-center justify-center relative z-10 border-none cursor-pointer text-white focus:outline-none"
          >
            {isProcessing ? (
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </motion.div>
            ) : isListening ? (
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              >
                <Mic className="w-8 h-8 text-white" />
              </motion.div>
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
