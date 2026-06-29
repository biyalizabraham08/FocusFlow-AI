"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Clock, TrendingUp, Zap } from "lucide-react";

export function Metrics() {
  return (
    <section id="solutions" className="py-24 px-6 bg-[#09090b]">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4"
          >
            Engineered for High-Impact Execution.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg md:text-xl font-normal tracking-tight max-w-2xl mx-auto"
          >
            Quantifiable metrics from workspaces utilizing autonomous schedule recovery.
          </motion.p>
        </div>
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-8 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col justify-between group hover:border-zinc-700 transition-colors"
          >
            <div className="mb-16">
               <div className="flex items-center gap-3 mb-4">
                 <BrainCircuit className="w-5 h-5 text-amber-500" />
                 <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">Mitigate Cognitive Load</h3>
               </div>
               <p className="text-zinc-400 text-sm leading-relaxed">
                 Let the multi-agent system manage dynamic scheduling conflicts while you focus entirely on task execution.
               </p>
            </div>
            <div>
              <span className="text-5xl font-bold text-amber-500 tracking-tighter">-60% Burnout Risk</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col justify-between group hover:border-zinc-700 transition-colors"
          >
            <div className="mb-16">
               <div className="flex items-center gap-3 mb-4">
                 <Clock className="w-5 h-5 text-purple-500" />
                 <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">Reclaim Trapped Calendar Hours</h3>
               </div>
               <p className="text-zinc-400 text-sm leading-relaxed">
                 Automatically eliminate manual tracking overhead and structural calendar fragmentation.
               </p>
            </div>
            <div>
              <span className="text-5xl font-bold text-purple-500 tracking-tighter">3.2h Saved/Daily</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col justify-between group hover:border-zinc-700 transition-colors"
          >
            <div className="mb-16">
               <div className="flex items-center gap-3 mb-4">
                 <TrendingUp className="w-5 h-5 text-blue-500" />
                 <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">Maximize Project Velocity</h3>
               </div>
               <p className="text-zinc-400 text-sm leading-relaxed">
                 Keep critical deadlines intact with algorithmic risk monitoring and real-time adjustment loops.
               </p>
            </div>
            <div>
              <span className="text-5xl font-bold text-blue-500 tracking-tighter">95% Delivery Rate</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col justify-between group hover:border-zinc-700 transition-colors"
          >
            <div className="mb-16">
               <div className="flex items-center gap-3 mb-4">
                 <Zap className="w-5 h-5 text-emerald-500" />
                 <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">Optimize Daily Output</h3>
               </div>
               <p className="text-zinc-400 text-sm leading-relaxed">
                 Scale your deep-work capacity using adaptive, priority-aligned context isolation.
               </p>
            </div>
            <div>
              <span className="text-5xl font-bold text-emerald-500 tracking-tighter">2.4x Throughput</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
