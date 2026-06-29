"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Target, BrainCircuit, ShieldAlert, Mic, Bell, Volume2, Calendar } from "lucide-react";
import { useStore } from "@/lib/store";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/app-layout";

// Custom fluid toggle switch with a white pill gliding over a vibrant blue background
function CustomToggle({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 flex items-center ${
        checked ? "bg-[#3b82f6]" : "bg-slate-800"
      }`}
    >
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-4 h-4 rounded-full bg-white shadow-md"
        animate={{ x: checked ? 20 : 0 }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const { activeMode, setActiveMode, preferredVoiceURI, setPreferredVoiceURI, workingWindow, setWorkingWindow } = useStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const [customSlots, setCustomSlots] = useState<{ start: string; end: string }[]>([
    { start: "09:00", end: "12:00" }
  ]);

  // Sync custom slots state from store if working window is custom
  useEffect(() => {
    if (workingWindow?.label === "Custom" && workingWindow.start && workingWindow.end) {
      const starts = workingWindow.start.split(",");
      const ends = workingWindow.end.split(",");
      const slots = [];
      for (let i = 0; i < Math.max(starts.length, ends.length); i++) {
        slots.push({
          start: starts[i] || "09:00",
          end: ends[i] || "12:00"
        });
      }
      setCustomSlots(slots);
    }
  }, [workingWindow?.label]);

  const updateCustomSlots = (newSlots: typeof customSlots) => {
    setCustomSlots(newSlots);
    setWorkingWindow({
      label: "Custom",
      start: newSlots.map(s => s.start).join(","),
      end: newSlots.map(s => s.end).join(",")
    });
  };
  
  // Profile state with default fallbacks as requested ("default" and "default@gmail.com")
  const [userEmail, setUserEmail] = useState<string>("default@gmail.com");
  const [userName, setUserName] = useState<string>("default");

  // Toggle states
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState(true);
  const [voiceResponsesEnabled, setVoiceResponsesEnabled] = useState(true);
  const [riskAlertsEnabled, setRiskAlertsEnabled] = useState(true);
  const [dailyBriefingEnabled, setDailyBriefingEnabled] = useState(true);
  const [recoverySuggestionsEnabled, setRecoverySuggestionsEnabled] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email || "default@gmail.com");
        if (user.displayName) {
          setUserName(user.displayName);
        } else if (user.email) {
          const firstPart = user.email.split("@")[0];
          const capitalized = firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
          setUserName(capitalized);
        }
      } else {
        setUserEmail("default@gmail.com");
        setUserName("default");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices.filter(v => v.lang.startsWith("en")));
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleTestVoice = (uri: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("This is how I sound.");
      const selectedVoice = window.speechSynthesis.getVoices().find(v => v.voiceURI === uri);
      if (selectedVoice) utterance.voice = selectedVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings & Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your AI preferences and account details</p>
        </div>

        <div className="space-y-8">
          
          {/* Profile Section */}
          <Card className="bg-[#11131e] border-slate-800/70 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-[#3b82f6]" /> Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-400 font-medium">Name</Label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-black/40 border border-slate-800/80 focus:border-[#3b82f6]/50 focus:shadow-[0_0_12px_rgba(59,130,246,0.25)] px-4 py-3 rounded-xl text-white font-medium outline-none transition-all duration-300"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 font-medium">Email</Label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-black/40 border border-slate-800/80 focus:border-[#3b82f6]/50 focus:shadow-[0_0_12px_rgba(59,130,246,0.25)] px-4 py-3 rounded-xl text-white/85 font-medium outline-none transition-all duration-300"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Working Window Settings */}
          <Card className="bg-[#11131e] border-slate-800/70 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-[#3b82f6]" /> Working Window
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Your preferred hours for AI-scheduled tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Morning", start: "06:00", end: "12:00" },
                  { label: "Afternoon", start: "12:00", end: "17:00" },
                  { label: "Evening", start: "17:00", end: "22:00" },
                  { label: "Night", start: "20:00", end: "01:00" }
                ].map((w) => {
                  const isActive = workingWindow?.label === w.label;
                  return (
                    <div 
                      key={w.label}
                      onClick={() => setWorkingWindow(w)}
                      className={`h-20 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer select-none ${
                        isActive 
                          ? 'bg-[#11131e] border-[#3b82f6]/60 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-white font-bold' 
                          : 'bg-black/40 border-slate-800/50 opacity-45 hover:opacity-75 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-sm font-semibold">{w.label}</span>
                      <span className="text-xs mt-1 opacity-70">{w.start} - {w.end}</span>
                    </div>
                  );
                })}

                <div 
                  onClick={() => {
                    const defaultCustom = { 
                      label: "Custom", 
                      start: customSlots.map(s => s.start).join(","), 
                      end: customSlots.map(s => s.end).join(",") 
                    };
                    setWorkingWindow(defaultCustom);
                  }}
                  className={`h-20 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer select-none col-span-2 md:col-span-1 ${
                    workingWindow?.label === "Custom"
                      ? 'bg-[#11131e] border-[#3b82f6]/60 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-white font-bold' 
                      : 'bg-black/40 border-slate-800/50 opacity-45 hover:opacity-75 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-sm font-semibold">Custom</span>
                  <span className="text-xs mt-1 opacity-70">Configure slots</span>
                </div>
              </div>

              {/* Custom range input picker fields */}
              {workingWindow?.label === "Custom" && (
                <div className="space-y-4 pt-4 border-t border-slate-800/60">
                  <div className="text-xs font-bold text-slate-400">Custom Work Time Slots</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customSlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3 bg-black/35 p-3.5 rounded-xl border border-slate-800/80">
                        <div className="flex-1 flex flex-col gap-1.5">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Start Time</span>
                          <input 
                            type="time"
                            value={slot.start}
                            onChange={(e) => {
                              const newSlots = [...customSlots];
                              newSlots[index].start = e.target.value;
                              updateCustomSlots(newSlots);
                            }}
                            className="w-full h-10 bg-black/40 border border-slate-800 focus:border-[#3b82f6]/50 px-2 rounded-lg text-white text-xs outline-none [color-scheme:dark]"
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">End Time</span>
                          <input 
                            type="time"
                            value={slot.end}
                            onChange={(e) => {
                              const newSlots = [...customSlots];
                              newSlots[index].end = e.target.value;
                              updateCustomSlots(newSlots);
                            }}
                            className="w-full h-10 bg-black/40 border border-slate-800 focus:border-[#3b82f6]/50 px-2 rounded-lg text-white text-xs outline-none [color-scheme:dark]"
                          />
                        </div>
                        {customSlots.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => {
                              const newSlots = customSlots.filter((_, i) => i !== index);
                              updateCustomSlots(newSlots);
                            }}
                            className="self-end mb-1 w-8 h-8 rounded-lg bg-red-950/20 border border-red-900/35 text-red-400 hover:bg-red-900/25 flex items-center justify-center cursor-pointer transition-colors border-none"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Add Slot Button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const newSlots = [...customSlots, { start: "13:00", end: "17:00" }];
                        updateCustomSlots(newSlots);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/20 border border-blue-900/35 text-xs text-blue-400 hover:bg-blue-900/25 transition-colors cursor-pointer"
                    >
                      <span>+ Add Slot</span>
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Mode Selector */}
          <Card className="bg-[#11131e] border-slate-800/70 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#3b82f6]/5 to-transparent border-b border-slate-800/70">
              <CardTitle className="text-xl flex items-center gap-2 text-white">
                <BrainCircuit className="w-5 h-5 text-purple-400" /> AI Mode Selector
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Customize how FocusFlow AI interacts with you.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Focus Mode */}
                <div 
                  onClick={() => setActiveMode("Focus")}
                  className={`relative cursor-pointer border rounded-2xl p-6 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                    activeMode === "Focus" 
                      ? "bg-[#11131e] border-[#3b82f6]/60 shadow-[0_0_25px_rgba(59,130,246,0.15)] opacity-100" 
                      : "bg-black/40 border-slate-800/80 opacity-45 hover:opacity-75 hover:border-slate-700/80"
                  }`}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center mb-4">
                      <Target className="w-5 h-5 text-[#3b82f6]" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">Focus Mode</h3>
                    <ul className="text-sm text-slate-400 space-y-1.5">
                      <li>• Minimal notifications</li>
                      <li>• Only critical alerts</li>
                    </ul>
                  </div>
                </div>

                {/* Coach Mode */}
                <div 
                  onClick={() => setActiveMode("Coach")}
                  className={`relative cursor-pointer border rounded-2xl p-6 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                    activeMode === "Coach" 
                      ? "bg-[#11131e] border-[#a855f7] shadow-[0_0_35px_rgba(168,85,247,0.25)] opacity-100" 
                      : "bg-black/40 border-slate-800/80 opacity-45 hover:opacity-75 hover:border-slate-700/80"
                  }`}
                >
                  {/* Soft purple ambient background glow behind Coach Mode card */}
                  {activeMode === "Coach" && (
                    <div className="absolute inset-0 bg-[#a855f7]/5 rounded-2xl blur-xl pointer-events-none -z-10 animate-pulse" />
                  )}
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center mb-4">
                      <BrainCircuit className="w-5 h-5 text-[#a855f7]" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">Coach Mode</h3>
                    <ul className="text-sm text-slate-400 space-y-1.5">
                      <li>• Daily guidance</li>
                      <li>• Progress suggestions</li>
                    </ul>
                  </div>
                </div>

                {/* Accountability Mode */}
                <div 
                  onClick={() => setActiveMode("Accountability")}
                  className={`relative cursor-pointer border rounded-2xl p-6 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                    activeMode === "Accountability" 
                      ? "bg-[#11131e] border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.15)] opacity-100" 
                      : "bg-black/40 border-slate-800/80 opacity-45 hover:opacity-75 hover:border-slate-700/80"
                  }`}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">Accountability</h3>
                    <ul className="text-sm text-slate-400 space-y-1.5">
                      <li>• Active check-ins</li>
                      <li>• Deadline monitoring</li>
                    </ul>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Settings Grid: Voice & Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Voice Assistant */}
            <Card className="bg-[#11131e] border-slate-800/70 shadow-xl rounded-2xl h-full">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-white">
                  <Mic className="w-5 h-5 text-emerald-400" /> Voice Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base text-white">Voice Assistant</Label>
                    <p className="text-xs text-slate-500">Enable microphone access and AI processing</p>
                  </div>
                  <CustomToggle checked={voiceAssistantEnabled} onChange={setVoiceAssistantEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base text-white">Voice Responses</Label>
                    <p className="text-xs text-slate-500">Allow AI to speak responses aloud</p>
                  </div>
                  <CustomToggle checked={voiceResponsesEnabled} onChange={setVoiceResponsesEnabled} />
                </div>
                
                <div className="pt-4 border-t border-slate-800/70 space-y-3">
                  <Label className="text-base text-white">AI Voice</Label>
                  <p className="text-xs text-slate-500 mb-2">Select the voice for FocusFlow AI</p>
                  <div className="flex gap-3">
                    <select 
                      value={preferredVoiceURI || ""}
                      onChange={(e) => {
                        setPreferredVoiceURI(e.target.value);
                        handleTestVoice(e.target.value);
                      }}
                      className="flex-1 bg-black/40 border border-slate-800/80 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#3b82f6]/50"
                    >
                      <option value="">Default Browser Voice</option>
                      {voices.map(voice => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" className="border-slate-800 bg-black/40 hover:bg-slate-800 text-white rounded-xl" onClick={() => handleTestVoice(preferredVoiceURI || "")}>
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="bg-[#11131e] border-slate-800/70 shadow-xl rounded-2xl h-full">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-white">
                  <Bell className="w-5 h-5 text-amber-500" /> Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base text-white">Risk Alerts</Label>
                    <p className="text-xs text-slate-500">Notify when deadline risk increases</p>
                  </div>
                  <CustomToggle checked={riskAlertsEnabled} onChange={setRiskAlertsEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base text-white">Daily Briefing</Label>
                    <p className="text-xs text-slate-500">Receive daily AI execution summaries</p>
                  </div>
                  <CustomToggle checked={dailyBriefingEnabled} onChange={setDailyBriefingEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base text-white">Recovery Suggestions</Label>
                    <p className="text-xs text-slate-500">Get tips when falling behind</p>
                  </div>
                  <CustomToggle checked={recoverySuggestionsEnabled} onChange={setRecoverySuggestionsEnabled} />
                </div>
              </CardContent>
            </Card>

          </div>
          
        </div>
      </div>
    </AppLayout>
  );
}
