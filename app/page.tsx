import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { LogoCloud } from "@/components/landing/logo-cloud";
import { Features } from "@/components/landing/features";
import { Metrics } from "@/components/landing/metrics";
import { Integrations } from "@/components/landing/integrations";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-foreground font-sans selection:bg-indigo-500/30">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Metrics />
        <Integrations />
      </main>
      <Footer />
    </div>
  );
}
