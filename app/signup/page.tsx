"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuthSuccess = async (user: any) => {
    try {
      const userDocRef = doc(db, "users", user.uid, "profile", "data");
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          name: user.displayName || "",
          createdAt: new Date().toISOString(),
          hasCompletedOnboarding: false
        });
        
        await setDoc(doc(db, "users", user.uid, "preferences", "settings"), {
          activeMode: "Coach",
          preferredVoiceURI: null
        });
        
        router.push('/onboarding');
      } else {
        const data = userDocSnap.data();
        if (data.hasCompletedOnboarding) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err) {
      console.error("Error setting up user profile", err);
      router.push('/dashboard');
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await handleAuthSuccess(userCredential.user);
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleAuthSuccess(result.user);
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 text-muted-foreground hover:text-white flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to home
      </Link>

      <div className="w-full max-w-md bg-[#13131a]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative z-10 shadow-2xl">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <img src="/logo.png" alt="FocusFlow AI Logo" className="w-8 h-8 object-contain drop-shadow-md" />
          <span className="text-xl font-bold tracking-tight text-white">FocusFlow AI</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2 text-center">Create an account</h2>
        <p className="text-muted-foreground text-center mb-6 text-sm">Start managing your tasks smarter with AI</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {/* Primary Section (Top) */}
        <Button 
          type="button" 
          disabled={loading}
          onClick={handleGoogleSignup} 
          className="w-full h-14 rounded-xl bg-white text-black hover:bg-zinc-100 font-bold text-base transition-all flex items-center justify-center gap-3 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        {/* The Divider */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider">or create with email</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        {/* Secondary Section (Bottom) */}
        <form className="space-y-4" onSubmit={handleEmailSignup}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              className="bg-black/40 border-white/10 text-white placeholder:text-white/30 h-12" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              className="bg-black/40 border-white/10 text-white placeholder:text-white/30 h-12" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              minLength={6}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full py-3 h-12 rounded-xl bg-purple-600 text-white hover:bg-purple-500 font-medium transition-all mt-6">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up with Email"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-white font-semibold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
