import Hero from '@/app/landing/Hero';
import HowItWorksSection from '@/app/landing/HowItWorks';
import WhyItMattersSection from '@/app/landing/WhyItMatters';
import MissionSection from '@/app/landing/MissionSection';
import WhoItsForSection from '@/app/landing/WhoItsFor';
import EthicalNoteSection from '@/app/landing/EthicalNote';

export default function Home() {
  return (
    <main className="">
      <Hero />
      <WhyItMattersSection />
      <MissionSection />
      <HowItWorksSection />
      <WhoItsForSection />
      <EthicalNoteSection />
    </main>
  );
}
