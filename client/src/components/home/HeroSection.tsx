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
    <section className="relative bg-primary py-16 md:py-32">
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1632867590541-398c1e9d7792?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8bHV4dXJ5IFJWIGV4dGVyaW9yc3x8fHx8fDE3MDcxMDI2ODc&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080')] bg-cover bg-center" />
      </div>
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-wider leading-tight">Find Your Dream Luxury Coach</h1>
          <p className="text-lg md:text-xl mb-8 text-neutral-100 tracking-wide">
          </p>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <SearchForm onSearch={handleSearch} simplified={false} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
