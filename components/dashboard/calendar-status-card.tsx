"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";

export function CalendarStatusCard() {
  const { calendarStatus, setCalendarStatus } = useStore();
  const [isSyncing, setIsSyncing] = useState(false);
  console.log("CalendarStatusCard rendering. isSynced:", calendarStatus?.isSynced);

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate connection delay
    await new Promise((r) => setTimeout(r, 1200));
    await setCalendarStatus({
      isSynced: true,
      lastSyncTime: new Date().toISOString()
    });
    setIsSyncing(false);
  };

  const handleDisconnect = async () => {
    await setCalendarStatus({
      isSynced: false,
      lastSyncTime: null
    });
  };

  return (
    <Card className="bg-[#11131e] border-slate-800/80 shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${calendarStatus.isSynced ? 'bg-green-500/20' : 'bg-zinc-900'}`}>
              <Calendar className={`w-6 h-6 ${calendarStatus.isSynced ? 'text-green-500' : 'text-zinc-400'}`} />
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                Google Calendar
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {calendarStatus.isSynced ? (
                  <span className="flex items-center gap-1.5 text-green-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Synced
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <XCircle className="w-3.5 h-3.5" />
                    Not Synced
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {calendarStatus.isSynced && calendarStatus.lastSyncTime && (
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                Last Sync
              </div>
              <div className="text-xs text-white/90">
                {formatDistanceToNow(new Date(calendarStatus.lastSyncTime), { addSuffix: true })}
              </div>
            </div>
          )}
        </div>

        {/* Sync Controls */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-2">
          <div className="flex justify-end">
            {calendarStatus.isSynced ? (
              <button
                onClick={handleDisconnect}
                className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer transition-colors border-none bg-transparent"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/20 border border-blue-900/35 text-xs text-blue-400 hover:bg-blue-900/25 transition-all cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Syncing..." : "Sync Calendar"}
              </button>
            )}
          </div>

          {!calendarStatus.isSynced && (
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              * We are not able to sync directly to Google Calendar because it is currently in test mode. If it is in production level, we will be able to do that.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
