"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";

export function Toaster() {
  const { notifications, removeNotification } = useStore();

  useEffect(() => {
    // Auto remove after 4s
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        removeNotification(notifications[0].id);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notifications, removeNotification]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="bg-black/80 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] p-4 rounded-xl flex items-start gap-3 w-80 pointer-events-auto"
          >
            <div className="bg-primary/20 p-2 rounded-full mt-0.5">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-white/90 font-medium flex-1 leading-relaxed">
              {n.message}
            </p>
            <button 
              onClick={() => removeNotification(n.id)}
              className="text-white/40 hover:text-white transition-colors mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
