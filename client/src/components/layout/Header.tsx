import { useState, useContext } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { AuthContext } from "../../main";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, logout } = useContext(AuthContext);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Buy", path: "/browse" },
    { name: "Sell", path: "/sell" },
    { name: "Financing", path: "/financing" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between py-4">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/" className="flex items-center">
              <span className="text-primary font-bold text-2xl">LuxuryRV</span>
              <span className="text-accent-foreground ml-1 font-bold">Market</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 md:space-x-4">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.path}
                className={`py-2 px-3 ${
                  location === link.path
                    ? "text-primary font-medium"
                    : "text-neutral-700 hover:text-primary transition-colors"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="ml-2">
              {isAuthenticated ? (
                <Button 
                  variant="outline" 
                  onClick={() => logout()}
                  className="ml-2"
                >
                  Sign Out
                </Button>
              ) : (
                <Link href="/login">
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`py-2 ${
                        location === link.path
                          ? "text-primary font-medium"
                          : "text-neutral-700"
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className="mt-4">
                    {isAuthenticated ? (
                      <Button 
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="w-full"
                      >
                        Sign Out
                      </Button>
                    ) : (
                      <Link href="/login" className="w-full">
                        <Button 
                          className="w-full"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign In
                        </Button>
                      </Link>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
