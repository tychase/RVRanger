import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const CTASection = () => {
  return (
    <section className="bg-primary py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Find Your Dream Luxury RV?</h2>
        <p className="text-neutral-100 mb-8 max-w-3xl mx-auto">
          Browse our extensive collection of premium recreational vehicles from top manufacturers. Our platform connects serious buyers with quality sellers.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/browse">
            <Button variant="secondary" className="bg-white text-primary hover:bg-neutral-100">
              Browse Inventory
            </Button>
          </Link>
          <Link href="/sell">
            <Button>
              Sell Your RV
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
