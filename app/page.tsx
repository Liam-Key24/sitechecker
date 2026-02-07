import SearchForm from '@/components/SearchForm';
import Hero from '@/app/landingpagecomponents /Hero';
export default function Home() {
  return (
    <div className="">
      <Hero />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          
          <SearchForm />
        </div>
      </div>
    </div>
  );
}
