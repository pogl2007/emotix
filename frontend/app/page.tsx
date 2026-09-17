import EmotionCatalog from "@/components/landing/EmotionCatalog";
import HowItWorks from "@/components/landing/HowItWorks";
import Manifesto from "@/components/landing/Manifesto";
import ShowcaseHero from "@/components/landing/ShowcaseHero";

export default function LandingPage() {
  return (
    <>
      <ShowcaseHero />
      <EmotionCatalog />
      <HowItWorks />
      <Manifesto />

      <footer className="px-4 pb-6 sm:px-6">
        <div className="mono flex flex-col items-center justify-between gap-2 border border-line bg-surface/70 px-7 py-5 text-[10px] uppercase tracking-[0.16em] text-dim sm:flex-row">
          <span className="text-accent">◈ EMOTIX</span>
          <span>PyTorch · FastAPI · Next.js</span>
          <span>2026</span>
        </div>
      </footer>
    </>
  );
}
