import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { LangMarquee } from "@/components/LangMarquee";
import { NavBar } from "@/components/NavBar";

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <Hero />
        <LangMarquee />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
