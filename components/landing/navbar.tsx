"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Minimalist text logo FocusFlow AI */}
        <div className="flex items-center gap-2">
          {/* Extracted Logo */}
          <img src="/logo.png" alt="FocusFlow AI Logo" className="w-8 h-8 object-contain drop-shadow-md" />
          <span className="text-lg tracking-tight">
            <span className="font-semibold text-white">FocusFlow</span>
            <span className="font-medium text-zinc-500 ml-1">AI</span>
          </span>
        </div>

        {/* Center: Thin, professional navigation links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium tracking-wide">
          <Link href="#hero" className="hover:text-white transition-colors">Home</Link>
          <Link href="#platform" className="hover:text-white transition-colors">Architecture</Link>
          <Link href="#solutions" className="hover:text-white transition-colors">Solutions</Link>
          <Link href="#integrations" className="hover:text-white transition-colors">Integrations</Link>
        </div>

        {/* Right: Authentication Controls */}
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Log In
          </Link>
          <Link href="/signup">
            <Button className="rounded-lg px-4 py-2 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500 text-white font-medium transition-all h-9 text-sm shadow-sm border border-zinc-700">
              Sign Up — Free
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
