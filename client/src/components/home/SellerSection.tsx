import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const SellerSection = () => {
  return (
    <section className="py-16 md:py-24 bg-neutral-light">
      <div className="container mx-auto px-4 md:px-6">
        <div className="card-luxury overflow-hidden border border-accent-gold/20">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 relative">
              <div className="relative h-64 md:h-full w-full overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1621198777376-d776d0f523df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8bHV4dXJ5IFJWIGV4dGVyaW9yc3x8fHx8fDE3MDcxMDMwMjI&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080" 
                  alt="Sell your luxury Coach" 
                  className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent"></div>
              </div>
            </div>
            <div className="md:w-1/2 p-8 md:p-10 md:ml-auto flex flex-col justify-center">
              <span className="text-accent-gold font-semibold tracking-wider mb-3 uppercase text-sm">FOR SELLERS</span>
              <h2 className="text-2xl md:text-3xl font-bold font-serif text-neutral-dark mb-5 tracking-wider leading-tight">Ready to Sell Your Luxury Coach?</h2>
              <p className="text-neutral-dark/80 mb-8 tracking-wide">
                Get your Coach in front of thousands of serious buyers. Our premium listing options help you showcase your vehicle's best features with high-quality photos and detailed descriptions.
              </p>
              
              <div className="mb-8 space-y-6">
                <div className="flex items-start">
                  <div className="bg-accent-gold text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="font-serif">1</span>
                  </div>
                  <div className="ml-5">
                    <h3 className="font-semibold text-neutral-dark tracking-wide">Create Your Account</h3>
                    <p className="text-sm text-neutral-dark/70 tracking-wide">Sign up and verify your seller profile</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-accent-gold text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="font-serif">2</span>
                  </div>
                  <div className="ml-5">
                    <h3 className="font-semibold text-neutral-dark tracking-wide">List Your Coach</h3>
                    <p className="text-sm text-neutral-dark/70 tracking-wide">Upload photos and add detailed specifications</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-accent-gold text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="font-serif">3</span>
                  </div>
                  <div className="ml-5">
                    <h3 className="font-semibold text-neutral-dark tracking-wide">Connect with Buyers</h3>
                    <p className="text-sm text-neutral-dark/70 tracking-wide">Respond to inquiries and manage offers</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <Link href="/sell">
                  <Button className="w-full rounded-2xl px-8 py-3 shadow-md">
                    List Your Coach Today
                  </Button>
                </Link>
                <Link href="/sell#packages">
                  <Button variant="outline" className="w-full border-accent-gold text-primary hover:bg-accent-gold/10 rounded-2xl px-8 py-3 shadow-md">
                    View Listing Packages
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SellerSection;
