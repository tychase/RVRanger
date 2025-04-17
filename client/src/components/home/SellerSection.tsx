import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const SellerSection = () => {
  return (
    <section className="py-12 md:py-16 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 relative">
              <img 
                src="https://images.unsplash.com/photo-1621198777376-d776d0f523df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8bHV4dXJ5IFJWIGV4dGVyaW9yc3x8fHx8fDE3MDcxMDMwMjI&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080" 
                alt="Sell your luxury Coach" 
                className="w-full h-full object-cover md:absolute inset-0"
              />
            </div>
            <div className="md:w-1/2 p-6 md:p-8 md:ml-auto flex flex-col justify-center">
              <span className="text-accent-foreground font-semibold mb-2">FOR SELLERS</span>
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-4">Ready to Sell Your Luxury Coach?</h2>
              <p className="text-neutral-600 mb-6">
                Get your Coach in front of thousands of serious buyers. Our premium listing options help you showcase your vehicle's best features with high-quality photos and detailed descriptions.
              </p>
              
              <div className="mb-6 space-y-4">
                <div className="flex items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span>1</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-neutral-800">Create Your Account</h3>
                    <p className="text-sm text-neutral-600">Sign up and verify your seller profile</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span>2</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-neutral-800">List Your Coach</h3>
                    <p className="text-sm text-neutral-600">Upload photos and add detailed specifications</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span>3</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-neutral-800">Connect with Buyers</h3>
                    <p className="text-sm text-neutral-600">Respond to inquiries and manage offers</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sell">
                  <Button className="w-full">
                    List Your Coach Today
                  </Button>
                </Link>
                <Link href="/sell#packages">
                  <Button variant="outline" className="w-full">
                    Learn About Our Packages
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
