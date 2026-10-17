import { Footer } from "@/components/Footer";
import { HomeClient } from "@/components/HomeClient";
import { HowItWorks } from "@/components/HowItWorks";
import { LangMarquee } from "@/components/LangMarquee";

export default function Home() {
  return (
    <>
      <HomeClient>
        <LangMarquee />
        <HowItWorks />
      </HomeClient>
      <Footer />
    </>
  );
}
