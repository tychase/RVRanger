import { useState, useEffect, useContext } from "react";
import { useLocation } from "wouter";
import { AuthContext } from "../main";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ListingForm from "@/components/sell/ListingForm";
import { useToast } from "@/hooks/use-toast";

const Sell = () => {
  const [_, navigate] = useLocation();
  const { isAuthenticated } = useContext(AuthContext);
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  
  useEffect(() => {
    document.title = "Sell Your RV - LuxuryRV Market";
  }, []);
  
  // Check if user is logged in
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to list your RV for sale",
      });
      navigate("/login?redirect=/sell");
    }
  }, [isAuthenticated, navigate, toast]);

  const packages = [
    {
      id: "basic",
      name: "Basic",
      price: 49,
      features: [
        "30-day listing",
        "Up to 5 photos",
        "Basic search placement",
        "Email support"
      ]
    },
    {
      id: "premium",
      name: "Premium",
      price: 99,
      features: [
        "60-day listing",
        "Up to 15 photos",
        "Enhanced search placement",
        "Featured on homepage (7 days)",
        "Email & phone support"
      ],
      recommended: true
    },
    {
      id: "platinum",
      name: "Platinum",
      price: 199,
      features: [
        "90-day listing",
        "Unlimited photos",
        "Top search placement",
        "Featured on homepage (30 days)",
        "Priority email & phone support",
        "Social media promotion",
        "Virtual tour option"
      ]
    }
  ];

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login page via useEffect
  }

  return (
    <div className="bg-neutral-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">Sell Your RV</h1>
        <p className="text-neutral-600 mb-8">
          Get your luxury RV in front of thousands of potential buyers.
        </p>
        
        <Tabs defaultValue="package" className="bg-white rounded-lg shadow-md p-6">
          <TabsList className="mb-8">
            <TabsTrigger value="package">Choose Package</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedPackage}>
              RV Details
            </TabsTrigger>
            <TabsTrigger value="photos" disabled={!selectedPackage}>
              Upload Photos
            </TabsTrigger>
            <TabsTrigger value="review" disabled={!selectedPackage}>
              Review & Publish
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="package" id="packages">
            <h2 className="text-2xl font-bold mb-6">Select a Listing Package</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`relative overflow-hidden transition-all ${
                    selectedPackage === pkg.id ? 'ring-2 ring-primary' : ''
                  } ${pkg.recommended ? 'shadow-lg' : ''}`}
                >
                  {pkg.recommended && (
                    <div className="absolute top-0 right-0 bg-accent-foreground text-white text-xs font-semibold px-3 py-1 rounded-bl">
                      RECOMMENDED
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${pkg.price}</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-green-500 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full"
                      onClick={() => handlePackageSelect(pkg.id)}
                      variant={selectedPackage === pkg.id ? "default" : "outline"}
                    >
                      {selectedPackage === pkg.id ? "Selected" : "Select Package"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {selectedPackage && (
              <div className="mt-8 text-center">
                <Button onClick={() => document.querySelector('button[value="details"]')?.click()}>
                  Continue to RV Details
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details">
            <h2 className="text-2xl font-bold mb-6">Enter Your RV Details</h2>
            <ListingForm packageType={selectedPackage || "basic"} />
          </TabsContent>
          
          <TabsContent value="photos">
            <h2 className="text-2xl font-bold mb-6">Upload Photos</h2>
            <p className="text-neutral-600 mb-8">
              High-quality photos significantly increase interest in your listing. Upload clear images of the exterior, interior, and any special features.
            </p>
            
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-neutral-400 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-neutral-600 mb-2">
                Drag and drop your photos here, or click to browse
              </p>
              <p className="text-neutral-500 text-sm mb-4">
                Maximum file size: 10MB - Accepted formats: JPG, PNG
              </p>
              <Button>Upload Photos</Button>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline"
                onClick={() => document.querySelector('button[value="details"]')?.click()}
              >
                Back
              </Button>
              <Button onClick={() => document.querySelector('button[value="review"]')?.click()}>
                Continue to Review
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="review">
            <h2 className="text-2xl font-bold mb-6">Review & Publish</h2>
            <p className="text-neutral-600 mb-8">
              Please review your listing details before publishing. Once published, you can still edit your listing from your dashboard.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-lg mb-4">Listing Preview</h3>
                <div className="bg-neutral-50 p-6 rounded-lg">
                  <h4 className="font-bold text-xl mb-2">2023 Luxurious Class A Motorhome</h4>
                  <p className="text-accent-foreground font-bold mb-2">$285,000</p>
                  <p className="text-neutral-500 text-sm mb-4">Miami, FL</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-neutral-200 text-neutral-800 px-2 py-1 rounded text-xs">40 ft</span>
                    <span className="bg-neutral-200 text-neutral-800 px-2 py-1 rounded text-xs">Diesel</span>
                    <span className="bg-neutral-200 text-neutral-800 px-2 py-1 rounded text-xs">King Bed</span>
                    <span className="bg-neutral-200 text-neutral-800 px-2 py-1 rounded text-xs">3 Slides</span>
                  </div>
                  <p className="text-neutral-600 text-sm line-clamp-3">
                    This beautiful motorhome features a spacious living area with premium furnishings, a gourmet kitchen with residential appliances, and a luxurious master suite.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-4">Package Selected</h3>
                <div className="bg-neutral-50 p-6 rounded-lg">
                  <h4 className="font-bold mb-2">
                    {packages.find(p => p.id === selectedPackage)?.name} Package
                  </h4>
                  <p className="text-xl font-bold mb-4">
                    ${packages.find(p => p.id === selectedPackage)?.price}
                  </p>
                  <Button>Change Package</Button>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4">Payment Method</h3>
              <div className="bg-neutral-50 p-6 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-neutral-400 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">Add Payment Method</p>
                    <p className="text-neutral-500 text-sm">Secure payment processing</p>
                  </div>
                </div>
                <Button variant="outline">Add</Button>
              </div>
            </div>
            
            <div className="border-t border-neutral-200 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-neutral-600 mb-4 md:mb-0">
                By publishing, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a>.
              </p>
              <Button size="lg">Publish Listing</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Sell;
