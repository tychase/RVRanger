import { useState } from "react";
import { useLocation } from "wouter";
import SearchForm from "@/components/search/SearchForm";

const HeroSection = () => {
  const [_, setLocation] = useLocation();

  const handleSearch = (searchParams: any) => {
    // Build query string from search params
    const params = new URLSearchParams();
    
    if (searchParams.manufacturer && searchParams.manufacturer !== "all") {
      params.append("manufacturer", searchParams.manufacturer);
    }
    
    if (searchParams.chassis && searchParams.chassis !== "all") {
      params.append("chassis", searchParams.chassis);
    }
    
    if (searchParams.slides && searchParams.slides !== "all") {
      params.append("slides", searchParams.slides);
    }
    
    if (searchParams.features && searchParams.features.length > 0) {
      params.append("features", searchParams.features.join(','));
    }
    
    // Navigate to browse page with search params
    setLocation(`/browse?${params.toString()}`);
  };

  return (
    <section className="relative bg-primary py-12 md:py-24">
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1632867590541-398c1e9d7792?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8bHV4dXJ5IFJWIGV4dGVyaW9yc3x8fHx8fDE3MDcxMDI2ODc&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080')] bg-cover bg-center" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Dream Luxury RV</h1>
          <p className="text-lg md:text-xl mb-8 text-neutral-100">
            Browse thousands of premium recreational vehicles from top manufacturers
          </p>
          <SearchForm onSearch={handleSearch} simplified={false} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
