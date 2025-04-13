import HeroSection from "@/components/home/HeroSection";
import FeaturedListings from "@/components/home/FeaturedListings";
import Categories from "@/components/home/Categories";
import FeaturedManufacturers from "@/components/home/FeaturedManufacturers";
import FeaturedInterior from "@/components/home/FeaturedInterior";
import SellerSection from "@/components/home/SellerSection";
import TechnologySection from "@/components/home/TechnologySection";
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
      <Categories />
      <FeaturedManufacturers />
      <FeaturedInterior />
      <SellerSection />
      <TechnologySection />
      <CTASection />
    </div>
  );
};

export default Home;
