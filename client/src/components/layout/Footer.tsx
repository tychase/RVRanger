import { Link } from "wouter";

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-neutral-dark text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center mb-4">
              <span className="text-white font-bold text-xl font-heading">Prevost</span>
              <span className="text-accent-gold ml-1 font-bold">Go</span>
            </Link>
            <p className="text-gray-300 mb-4 text-sm">
              Your premier destination for luxury coaches and motorhomes.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4 text-accent-gold">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/browse" className="text-gray-300 hover:text-white transition-colors">Browse Listings</Link></li>
              <li><Link href="/browse?new=true" className="text-gray-300 hover:text-white transition-colors">New Coaches</Link></li>
              <li><Link href="/browse?used=true" className="text-gray-300 hover:text-white transition-colors">Pre-Owned</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4 text-accent-gold">Sell</h3>
            <ul className="space-y-2">
              <li><Link href="/sell" className="text-gray-300 hover:text-white transition-colors">List Your Coach</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Dealer Inquiries</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4 text-accent-gold">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/financing" className="text-gray-300 hover:text-white transition-colors">Financing</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between">
          <p className="text-gray-400 text-sm">
            &copy; {year} PrevostGo. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;