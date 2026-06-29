"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initializeSync, uid } = useStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (uid !== user.uid) {
          initializeSync(user.uid);
        }
      } else {
        // Not logged in
        if (pathname !== "/login" && pathname !== "/signup" && pathname !== "/") {
          router.push("/login");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [initializeSync, uid, router, pathname]);

  if (loading) {
    return <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center text-white">Loading...</div>;
  }

  return <>{children}</>;
}
