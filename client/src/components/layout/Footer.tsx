import { Link } from "wouter";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Mail
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <Link href="/" className="flex items-center">
                <span className="text-white font-bold text-2xl">LuxuryRV</span>
                <span className="text-accent-foreground ml-1 font-bold">Market</span>
              </Link>
            </div>
            <p className="text-neutral-400 mb-4">
              The premier marketplace for luxury recreational vehicles. Connecting buyers and sellers of high-end motorhomes and trailers since 2024.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-neutral-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/browse" className="text-neutral-400 hover:text-white transition-colors">Search RVs</Link></li>
              <li><Link href="/sell" className="text-neutral-400 hover:text-white transition-colors">Sell Your RV</Link></li>
              <li><Link href="/financing" className="text-neutral-400 hover:text-white transition-colors">Financing Options</Link></li>
              <li><Link href="/about" className="text-neutral-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-neutral-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">RV Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/browse?type=1" className="text-neutral-400 hover:text-white transition-colors">Class A Motorhomes</Link></li>
              <li><Link href="/browse?type=3" className="text-neutral-400 hover:text-white transition-colors">Class B Campervans</Link></li>
              <li><Link href="/browse" className="text-neutral-400 hover:text-white transition-colors">Class C Motorhomes</Link></li>
              <li><Link href="/browse?type=2" className="text-neutral-400 hover:text-white transition-colors">Fifth Wheels</Link></li>
              <li><Link href="/browse" className="text-neutral-400 hover:text-white transition-colors">Travel Trailers</Link></li>
              <li><Link href="/browse" className="text-neutral-400 hover:text-white transition-colors">Toy Haulers</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-neutral-400">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-accent-foreground flex-shrink-0 mt-0.5" />
                <span>123 Luxury Lane<br/>Suite 100<br/>Miami, FL 33101</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-accent-foreground flex-shrink-0" />
                <span>(800) 123-4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-accent-foreground flex-shrink-0" />
                <span>info@luxuryrv.market</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-neutral-700 text-neutral-500 text-sm flex flex-col md:flex-row justify-between items-center">
          <p>© 2024 LuxuryRV Market. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-neutral-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-neutral-400 transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
