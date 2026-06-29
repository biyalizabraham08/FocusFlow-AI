"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, TrendingDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { auth } from "@/lib/firebase";

export function WelcomeCard() {
  const { tasks } = useStore();
  const [greeting, setGreeting] = useState("Good Day");
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.displayName) {
          // Extract first name: split by space and take the first token
          const firstName = user.displayName.trim().split(/\s+/)[0];
          setUserName(firstName);
        } else if (user.email) {
          const firstPart = user.email.split("@")[0];
          // Extract first name from email prefix (e.g., diya.liza -> Diya)
          const firstName = firstPart.split(/[._-]/)[0];
          const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1);
          setUserName(capitalized);
        }
      } else {
        setUserName("User");
      }
    });
    return () => unsubscribe();
  }, []);

  // Dynamically find the first pending task to display as today's focus
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const todayFocus = pendingTasks.length > 0 ? pendingTasks[0].title : "Plan your next goal";
  const estimatedTime = pendingTasks.length > 0 ? `${pendingTasks[0].durationMinutes || 60} mins` : "0 mins";

  return (
    <Card className="bg-[#11131e] border-slate-800/80 shadow-xl rounded-2xl relative overflow-visible shrink-0">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <CardContent className="p-6 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-6">
          {greeting}, {userName} <span className="animate-wave inline-block origin-[70%_70%]">👋</span>
        </h2>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm text-slate-500 mb-1">Today's Focus:</div>
            <div className="text-lg font-semibold text-white tracking-tight">{todayFocus}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Estimated Time</div>
                <div className="text-sm font-semibold text-white">{estimatedTime}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Risk Reduction</div>
                <div className="text-sm font-semibold text-green-400">18%</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
