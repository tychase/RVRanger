// client/src/components/home/HeroSection.tsx
import React from "react";
import { useLocation } from "wouter";
import SearchBar from "@/components/search/SearchBar";
import SearchForm from "@/components/search/SearchForm";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const HeroSection: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleSearch = (searchParams: any) => {
    const params = new URLSearchParams();
    if (searchParams.converter && searchParams.converter !== "all") {
      params.append("converter", searchParams.converter);
    }
    if (searchParams.chassisType && searchParams.chassisType !== "all") {
      params.append("chassisType", searchParams.chassisType);
    }
    if (searchParams.slides && searchParams.slides !== "all") {
      params.append("slides", searchParams.slides.toString());
    }
    if (searchParams.features?.length) {
      searchParams.features.forEach((f: string) => params.append("features", f));
    }
    // Add price range parameters
    if (searchParams.priceFrom) {
      params.append("priceFrom", searchParams.priceFrom.toString());
    }
    if (searchParams.priceTo) {
      params.append("priceTo", searchParams.priceTo.toString());
    }
    setLocation(`/browse?${params.toString()}`);
  };

  return (
    <section className="relative bg-black py-12 md:py-24">
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div
          className="w-full h-full bg-[url('https://images.unsplash.com/photo-1632867590541-398c1e9d7792?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8bHV4dXJ5IFJWIGV4dGVyaW9yc3x8fHx8fDE3MDcxMDI2ODc&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080')] bg-cover bg-center"
        />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-6xl text-white mb-4">
            Find Your Dream Luxury Coach
          </h1>
          <p className="text-lg md:text-xl mb-8 text-neutralLight">
            Browse thousands of premium coaches from top converters
          </p>
          <Accordion type="single" collapsible className="w-full max-w-xl mx-auto">
            <AccordionItem value="search">
              <AccordionTrigger className="w-full bg-neutralLight rounded-2xl border border-neutralLight/50 px-4 py-2 text-left text-primary">
                Search Coaches
              </AccordionTrigger>
              <AccordionContent className="p-4 bg-neutralLight rounded-2xl border border-neutralLight/50">
                <SearchForm onSearch={handleSearch} simplified={false} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
