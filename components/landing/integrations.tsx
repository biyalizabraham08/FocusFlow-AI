"use client";

import { motion } from "framer-motion";
import { Calendar, Mail, Mic } from "lucide-react";

export function Integrations() {
  return (
    <section id="integrations" className="py-24 px-6 bg-[#09090b] border-t border-zinc-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
          >
            Deep Workspace Connectivity.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg font-normal tracking-tight max-w-2xl mx-auto"
          >
            FocusFlow AI syncs intelligence natively across your core Google Developer stack.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Google Calendar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between group"
          >
            <div className="mb-8">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                <Calendar className="w-5 h-5 text-zinc-100" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 tracking-tight mb-3">Google Calendar API</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                Syncs chronological schedules, maps active time blocks, and isolates open delivery windows for immediate execution.
              </p>
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                Active Engine Sync
              </span>
            </div>
          </motion.div>

          {/* Card 2: Gmail */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between group"
          >
            <div className="mb-8">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                <Mail className="w-5 h-5 text-zinc-100" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 tracking-tight mb-3">Gmail Context Extraction</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                Parses incoming priority workspace traffic to capture project status flags and urgent deadline milestones automatically.
              </p>
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                Active Engine Sync
              </span>
            </div>
          </motion.div>

          {/* Card 3: VoiceFlow Assistant Engine */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between group"
          >
            <div className="mb-8">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                <Mic className="w-5 h-5 text-zinc-100" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 tracking-tight mb-3">VoiceFlow NLP Engine</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                Utilizes speech recognition and Gemini reasoning to let you build goals, clear calendars, and log task completion hands-free.
              </p>
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded border border-zinc-500/30 bg-zinc-500/10 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                Core Model Online
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
