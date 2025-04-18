// client/src/components/home/HeroSection.tsx
import React from 'react';
import { useLocation } from "wouter";
import SearchForm from "@/components/search/SearchForm";

const HeroSection = () => {
  const [, setLocation] = useLocation();

  const handleSearch = (searchParams: any) => {
    const params = new URLSearchParams();
    if (searchParams.converter && searchParams.converter !== "all") {
      params.append("converter", searchParams.converter);
    }
    if (searchParams.chassis && searchParams.chassis !== "all") {
      params.append("chassis", searchParams.chassis);
    }
    if (searchParams.slides && searchParams.slides !== "all") {
      params.append("slides", searchParams.slides);
    }
    if (searchParams.features?.length) {
      searchParams.features.forEach((f: string) => params.append("features", f));
    }
    setLocation(`/browse?${params.toString()}`);
  };

  return (
    <section className="relative bg-black py-8 md:py-16 lg:py-24">
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div
          className="w-full h-full bg-[url('https://images.unsplash.com/photo-1632867590541-398c1e9d7792?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8bHV4dXJ5IFJWIGV4dGVyaW9yc3x8fHx8fDE3MDcxMDI2ODc&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080')] bg-cover bg-center"
        />
      </div>
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-3 md:mb-4">
            Find Your Dream Luxury Coach
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 text-neutralLight">
            Browse thousands of premium coaches from top converters
          </p>
          <div className="w-full sm:inline-block bg-neutralLight rounded-2xl border border-neutralLight/50 p-1">
            <SearchForm onSearch={handleSearch} simplified={false} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
