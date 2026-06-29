"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";

export default function CreateGoalPage() {
  const router = useRouter();
  const { addGoal } = useStore();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [hours, setHours] = useState("");
  const [category, setCategory] = useState("hackathon");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;

    const newGoalId = `g-${Date.now()}`;
    const deadlineDate = new Date(deadline);

    // Add placeholder goal to trigger skeleton + loading timeline
    await addGoal({
      id: newGoalId,
      title,
      description: description || "Created via goal workspace creator",
      deadline: deadlineDate,
      progress: 0,
      successProbability: 78,
      riskLevel: "Low",
      createdAt: new Date(),
      isGenerating: true, // Mark goal as loading/generating
      estimatedTotalHours: parseInt(hours) || 12
    });

    // Immediately route to the details page
    router.push(`/goals/${newGoalId}`);
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/goals" className="text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Goal</h1>
        </div>

        <div className="bg-[#13131a]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white text-base">Goal Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Build Vibe2Ship Hackathon Project" required className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/30 text-lg" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white text-base">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Create an AI productivity platform with Gemini integration and deploy it." required className="min-h-[100px] bg-black/40 border-white/10 text-white placeholder:text-white/30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-white text-base">Deadline</Label>
                <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required className="h-12 bg-black/40 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours" className="text-white text-base">Available Hours</Label>
                <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g., 4 hours/day" required className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/30" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-white text-base">Goal Category</Label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-12 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <option value="hackathon">Hackathon</option>
                <option value="academics">Academics</option>
                <option value="career">Career & Jobs</option>
                <option value="personal">Personal Project</option>
              </select>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Plan
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Gemini will analyze your goal and automatically break it into an execution schedule.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
