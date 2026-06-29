"use client";

import { motion } from "framer-motion";

const logos = [
  "Vortex", "Lumina", "Spectrum", "Velocity", "Vortex", "Synergy", "Synergy"
];

export function LogoCloud() {
  return (
    <section className="py-16 border-y border-white/5 bg-[#0d0d12]/50">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-sm md:text-base font-medium text-muted-foreground mb-8">
          Trusted by 1000+ businesses across the world
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-500 to-gray-700" />
              <span className="text-xl font-bold tracking-tight text-white">{logo}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
