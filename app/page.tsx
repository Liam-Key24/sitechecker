import Hero from '@/app/landingpagecomponents /Hero';
import HowItWorksSection from '@/app/landingpagecomponents /HowItWorks';
import WhyItMattersSection from '@/app/landingpagecomponents /WhyItMatters';
import MissionSection from '@/app/landingpagecomponents /MissionSection';
import WhoItsForSection from '@/app/landingpagecomponents /WhoItsFor';
import EthicalNoteSection from '@/app/landingpagecomponents /EthicalNote';
import SearchFormSection from '@/app/landingpagecomponents /SearchFormSection';
export default function Home() {
  return (
    <main className="">
      <Hero />
      <SearchFormSection />
      <WhyItMattersSection />
      <MissionSection />
      <HowItWorksSection />
      <WhoItsForSection />
      <EthicalNoteSection />
    </main>
  );
}
