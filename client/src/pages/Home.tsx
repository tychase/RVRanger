import HeroSection from "@/components/home/HeroSection";
import FeaturedListings from "@/components/home/FeaturedListings";
import FeaturedInterior from "@/components/home/FeaturedInterior";
import SellerSection from "@/components/home/SellerSection";
import CTASection from "@/components/home/CTASection";
import { useEffect } from "react";

const Home = () => {
  useEffect(() => {
    document.title = "LuxuryRV Market - Premium RV Marketplace";
  }, []);

  return (
    <div>
      <HeroSection />
      <FeaturedListings />
      <FeaturedInterior />
      <SellerSection />
      <CTASection />
    </div>
  );
};

export default Home;
