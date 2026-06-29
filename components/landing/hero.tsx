"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section id="hero" className="pt-32 pb-20 px-6 relative overflow-hidden bg-[#09090b] min-h-screen flex flex-col items-center">
      {/* Subtle, elegant grid lines background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
          maskImage: 'linear-gradient(to bottom, white, transparent)'
        }}
      />
      
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10 w-full mt-10">
        
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-300 text-xs font-semibold tracking-wide flex items-center gap-2 shadow-sm"
        >
          Next-Gen Task Intelligence Engine via Gemini 2.5
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 flex flex-col gap-2"
        >
          <span className="text-white">Stop Planning.</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
            Start Finishing.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed font-normal tracking-tight"
        >
          The intelligent execution engine that maps your workflows, quantifies deadline risks, and automates daily schedule recovery.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-20"
        >
          <Link href="/signup">
            <Button className="h-12 px-6 rounded-md bg-zinc-100 text-zinc-900 hover:bg-white transition-colors font-semibold shadow-lg text-sm tracking-wide">
              Launch Simulation Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full max-w-5xl mx-auto"
        >
          {/* App Wrapper */}
          <div className="w-full bg-[#0b0f19] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Browser/App Header */}
            <div className="h-10 bg-[#09090b] border-b border-zinc-800 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="mx-auto w-64 h-5 bg-zinc-800/50 rounded flex items-center justify-center">
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider">focusflow.ai/workspace</span>
              </div>
            </div>

            {/* App Body */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-left bg-[#0b0f19]">
              
              {/* Left Column: Google Workspace Streams */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Detected Google Workspace Streams</h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 bg-zinc-900 px-2 py-1 rounded">Live Sync</span>
                </div>
                
                <div className="flex flex-col gap-3 mt-1">
                  {/* Row 1 */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 flex justify-between items-center group hover:border-zinc-700 transition-colors">
                    <div>
                      <div className="text-xs text-white font-medium mb-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" /> Gmail Flag: Next.js Milestone Review
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Priority: High</div>
                      <div className="text-[10px] text-zinc-500">Deadline: 6 Hours</div>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 flex justify-between items-center group hover:border-zinc-700 transition-colors">
                    <div>
                      <div className="text-xs text-white font-medium mb-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> Calendar Event: Team Sync
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Blocks</div>
                      <div className="text-[10px] text-zinc-500">2:00 PM - 3:30 PM</div>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 flex justify-between items-center group hover:border-zinc-700 transition-colors">
                    <div>
                      <div className="text-xs text-white font-medium mb-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" /> External Task: Finalize Pitch Deck
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Est. Time</div>
                      <div className="text-[10px] text-zinc-500">4 Hours</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Execution Metrics */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">The AI Execution Matrix</h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">System Alert</span>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 flex flex-col gap-5 mt-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full pointer-events-none" />
                  
                  <div className="flex justify-between items-end relative z-10">
                    <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Current Success Probability</span>
                    <span className="text-xl font-bold text-red-500 flex items-center gap-2 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-red-500" /> 42% Risk Level
                    </span>
                  </div>
                  
                  {/* Linear Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative z-10">
                    <div className="h-full bg-gradient-to-r from-red-600 to-red-400 w-[42%] rounded-full" />
                  </div>
                  
                  <div className="text-[12px] font-medium text-red-300/80 leading-relaxed bg-red-500/10 p-3 rounded-md border border-red-500/20 relative z-10">
                    <span className="font-bold text-red-400 uppercase tracking-wider text-[10px] block mb-1">Warning</span>
                    Total task volume (10.5 hrs) exceeds available calendar blocks before deadline.
                  </div>

                  <Button className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide rounded-md border border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all relative z-10">
                    ⚡ Execute Schedule Recovery Matrix
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
