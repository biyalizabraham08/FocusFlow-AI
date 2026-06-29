"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#1a1a24] to-[#0d0d12] border border-white/10 p-12 md:p-20 text-center flex flex-col items-center shadow-2xl"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 relative z-10 max-w-2xl">
            Upgrade Your Productivity with FocusFlow AI
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl relative z-10">
            Join thousands who've transformed their workflow with AI task management.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <Button className="h-14 px-8 text-base rounded-2xl bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-3">
              <span className="text-2xl">🍎</span>
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase font-bold leading-none">Download on the</span>
                <span className="text-lg font-bold leading-none">App Store</span>
              </div>
            </Button>
            <Button className="h-14 px-8 text-base rounded-2xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors flex items-center gap-3">
              <span className="text-2xl">▶️</span>
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase font-bold leading-none">Get it on</span>
                <span className="text-lg font-bold leading-none">Google Play</span>
              </div>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-muted-foreground relative z-10">
            <span className="flex items-center gap-1">✓ Free to download</span>
            <span className="flex items-center gap-1">✓ No credit card required</span>
            <span className="flex items-center gap-1">✓ Premium features available</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
