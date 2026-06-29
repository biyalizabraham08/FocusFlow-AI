"use client";

import { motion } from "framer-motion";
import { GitMerge, Layers, Crosshair, ActivitySquare } from "lucide-react";

const features = [
  {
    icon: <GitMerge className="w-5 h-5 text-zinc-100" />,
    title: "Goal Decomposition Agent",
    description: "Instantly breaks high-level, complex project descriptions down into actionable, structured task trees with precise effort estimations."
  },
  {
    icon: <Layers className="w-5 h-5 text-zinc-100" />,
    title: "Dynamic Matrix Ranking",
    description: "Continually re-orders your queue based on a live cross-analysis of task dependencies, approaching deadlines, and available time blocks."
  },
  {
    icon: <Crosshair className="w-5 h-5 text-zinc-100" />,
    title: "Context-Isolated Workspaces",
    description: "Suppresses non-critical distractions and surfaces your single high-impact action item through an un-cluttered execution layout."
  },
  {
    icon: <ActivitySquare className="w-5 h-5 text-zinc-100" />,
    title: "Predictive Risk Analytics",
    description: "Leverages structural performance tracking to simulate upcoming deadline success probability windows before bottlenecks occur."
  }
];

export function Features() {
  return (
    <section id="platform" className="py-24 px-6 bg-[#09090b] border-t border-zinc-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
          >
            The Task Intelligence Architecture.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg font-normal tracking-tight"
          >
            Four interconnected agents driving your daily focus loop.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-zinc-100 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
