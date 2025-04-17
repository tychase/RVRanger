import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const CTASection = () => {
  return (
    <section className="bg-primary py-20">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 tracking-wider">Ready to Find Your Dream Luxury Coach?</h2>
          <p className="text-neutral-100 mb-10 max-w-3xl mx-auto tracking-wide">
            Our platform connects serious buyers with quality sellers.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/browse">
              <Button variant="secondary" className="bg-white text-primary hover:bg-neutral-100 rounded-2xl px-8 py-3 shadow-md">
                Browse Inventory
              </Button>
            </Link>
            <Link href="/sell">
              <Button className="rounded-2xl px-8 py-3 shadow-md border-accent-gold hover:bg-accent-gold/20">
                Sell Your Coach
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary rounded-2xl px-8 py-3 shadow-md">
                Contact Us
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 border-t border-white/20 pt-8">
            <p className="text-white/70 text-sm">Bringing luxury coach buyers and sellers together since 2023</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
