"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { 
  LayoutDashboard, 
  Target, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon, 
  Search, 
  Bell,
  LogOut,
  HelpCircle
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [userInitial, setUserInitial] = useState("U");
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.displayName) {
          setUserInitial(user.displayName.charAt(0).toUpperCase());
          setUserName(user.displayName.split(" ")[0]);
        } else if (user.email) {
          setUserInitial(user.email.charAt(0).toUpperCase());
          const firstPart = user.email.split("@")[0].split(/[._-]/)[0];
          setUserName(firstPart.charAt(0).toUpperCase() + firstPart.slice(1));
        }
      } else {
        setUserInitial("U");
        setUserName("User");
      }
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Goals", href: "/goals", icon: Target },
    { label: "Calendar", href: "/calendar", icon: CalendarIcon },
    { label: "Settings", href: "/settings", icon: SettingsIcon },
    { label: "Help", href: "/help", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] flex select-none text-slate-300">
      {/* Decorative ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Left Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#11131e]/30 backdrop-blur-xl p-6 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#a855f7] flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-all">
              <span className="text-white font-black text-lg">F</span>
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-none tracking-tight">FocusFlow AI</h1>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 block">Execution Engine</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1.5 pt-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-[#3b82f6] border-[#3b82f6] text-white shadow-lg shadow-blue-500/20"
                      : "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40 hover:border-slate-800/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card with Logout */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800/50 bg-[#11131e]/50 hover:border-slate-800 transition-all duration-300">
          <Link href="/settings" className="flex items-center gap-3 overflow-hidden flex-1 select-none">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {userInitial}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider truncate">Settings</p>
            </div>
          </Link>
          <button 
            onClick={async () => {
              if (confirm("Are you sure you want to log out?")) {
                await auth.signOut();
                window.location.href = "/login";
              }
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer ml-1"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-850 bg-[#11131e]/10 backdrop-blur-xl px-6 md:px-8 flex items-center justify-between shrink-0">
          {/* Status info */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500/50 border border-blue-400/70 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Ready</span>
          </div>

          {/* Search bar placeholder */}
          <div className="w-80 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-[#090a0f]/40 flex items-center gap-2.5 text-slate-500 max-w-md shadow-inner hidden sm:flex">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs text-slate-500">Search or ask AI... (⌘K)</span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Mobile Nav Links */}
            <div className="flex md:hidden gap-1 mr-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2 rounded-lg ${isActive ? "text-[#3b82f6]" : "text-slate-500"}`}
                  >
                    <item.icon className="w-4 h-4" />
                  </Link>
                );
              })}
            </div>

            <button className="w-8 h-8 rounded-xl border border-slate-800 bg-[#090a0f]/40 flex items-center justify-center hover:bg-slate-900/60 hover:text-white transition-all text-slate-400">
              <Bell className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={async () => {
                if (confirm("Are you sure you want to log out?")) {
                  await auth.signOut();
                  window.location.href = "/login";
                }
              }}
              className="w-8 h-8 rounded-xl border border-slate-800 bg-[#090a0f]/40 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 hover:border-red-900/30 transition-all text-slate-400 cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            <Link href="/settings" className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[1px] shadow-lg shadow-blue-500/10">
              <div className="w-full h-full bg-[#11131e] rounded-[11px] flex items-center justify-center text-xs font-bold text-slate-300">
                {userInitial}
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
