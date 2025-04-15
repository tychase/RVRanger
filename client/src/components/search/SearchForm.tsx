import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface SearchFormProps {
  onSearch: (searchParams: any) => void;
  simplified?: boolean;
}

const SearchForm = ({ onSearch, simplified = true }: SearchFormProps) => {
  const [manufacturer, setManufacturer] = useState("all"); // This is now Converter
  const [chassis, setChassis] = useState("any");
  const [type, setType] = useState("any"); // Keep for compatibility but not displayed
  const [year, setYear] = useState("any");
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [minMileage, setMinMileage] = useState("");
  const [maxMileage, setMaxMileage] = useState("");
  const [minLength, setMinLength] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [bedType, setBedType] = useState("any");
  const [fuelType, setFuelType] = useState("any");
  const [slides, setSlides] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  
  // Keeping length for backward compatibility
  const [length, setLength] = useState("");

  // Define types for the API data
  interface Manufacturer {
    id: number;
    name: string;
    logoUrl: string;
    description: string;
  }
  
  interface RvType {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
  }

  // Fetch manufacturers (used as Converters now)
  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
    staleTime: Infinity, // Data doesn't change often
  });

  // Fetch RV types - not used anymore but keeping for API compatibility
  const { data: rvTypes = [] } = useQuery<RvType[]>({
    queryKey: ["/api/types"],
    staleTime: Infinity,
  });

  // Define static converters list
  const converters = [
    { id: "marathon", name: "Marathon" },
    { id: "liberty", name: "Liberty" },
    { id: "millennium", name: "Millennium" },
    { id: "emerald", name: "Emerald" },
    { id: "featherlite", name: "Featherlite" },
    { id: "loki", name: "Loki" },
    { id: "country_coach", name: "Country Coach" }
  ];

  // Define chassis options
  const chassisOptions = [
    { id: "h345", name: "H345" },
    { id: "x345", name: "X345" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      manufacturer, // converter
      chassis,
      year,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      minMileage: minMileage ? parseInt(minMileage) : undefined,
      maxMileage: maxMileage ? parseInt(maxMileage) : undefined,
      minLength: minLength ? parseFloat(minLength) : undefined,
      maxLength: maxLength ? parseFloat(maxLength) : undefined,
      bedType: bedType !== "any" ? bedType : undefined,
      fuelType: fuelType !== "any" ? fuelType : undefined,
      slides: slides ? parseInt(slides) : undefined,
      searchTerm,
      features,
    });
  };

  const handleFeatureToggle = (feature: string) => {
    setFeatures(
      features.includes(feature)
        ? features.filter((f) => f !== feature)
        : [...features, feature]
    );
  };

  if (simplified) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={manufacturer} onValueChange={setManufacturer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Converters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Converters</SelectItem>
                  {converters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={chassis} onValueChange={setChassis}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any Chassis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Chassis</SelectItem>
                  {chassisOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Year</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i} value={(new Date().getFullYear() - i).toString()}>
                      {new Date().getFullYear() - i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button type="submit" className="w-full">
                Search
              </Button>
            </div>
          </div>
          <div className="mt-3 text-right">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="link" className="text-primary font-medium text-sm p-0">
                  Advanced Search Options
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Advanced Search</SheetTitle>
                  <SheetDescription>Refine your search with more options</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <Label>Price Range (USD)</Label>
                    <Slider
                      defaultValue={priceRange}
                      min={0}
                      max={2000000}
                      step={10000}
                      onValueChange={setPriceRange}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${priceRange[0].toLocaleString()}</span>
                      <span>${priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minMileage">Min Mileage</Label>
                      <Input
                        id="minMileage"
                        type="number"
                        placeholder="0"
                        value={minMileage}
                        onChange={(e) => setMinMileage(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxMileage">Max Mileage</Label>
                      <Input
                        id="maxMileage"
                        type="number"
                        placeholder="Any"
                        value={maxMileage}
                        onChange={(e) => setMaxMileage(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minLength">Min Length (ft)</Label>
                      <Input
                        id="minLength"
                        type="number"
                        placeholder="0"
                        value={minLength}
                        onChange={(e) => setMinLength(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxLength">Max Length (ft)</Label>
                      <Input
                        id="maxLength"
                        type="number"
                        placeholder="Any"
                        value={maxLength}
                        onChange={(e) => setMaxLength(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="searchTerm">Keyword Search</Label>
                    <Input
                      id="searchTerm"
                      type="text"
                      placeholder="Search by keywords"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bedType">Bed Type</Label>
                      <Select value={bedType} onValueChange={setBedType}>
                        <SelectTrigger id="bedType">
                          <SelectValue placeholder="Any Bed Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Bed Type</SelectItem>
                          <SelectItem value="king">King</SelectItem>
                          <SelectItem value="queen">Queen</SelectItem>
                          <SelectItem value="twin">Twin</SelectItem>
                          <SelectItem value="bunk">Bunk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuelType">Fuel Type</Label>
                      <Select value={fuelType} onValueChange={setFuelType}>
                        <SelectTrigger id="fuelType">
                          <SelectValue placeholder="Any Fuel Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Fuel Type</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="gas">Gas</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slides">Number of Slides</Label>
                    <Select value={slides} onValueChange={setSlides}>
                      <SelectTrigger id="slides">
                        <SelectValue placeholder="Any Number of Slides" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Number of Slides</SelectItem>
                        <SelectItem value="1">1 Slide</SelectItem>
                        <SelectItem value="2">2 Slides</SelectItem>
                        <SelectItem value="3">3 Slides</SelectItem>
                        <SelectItem value="4">4 Slides</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Features</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="adaptive-cruise"
                          checked={features.includes("adaptiveCruise")}
                          onCheckedChange={() => handleFeatureToggle("adaptiveCruise")}
                        />
                        <label
                          htmlFor="adaptive-cruise"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Adaptive Cruise Control
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="lane-keep"
                          checked={features.includes("laneKeep")}
                          onCheckedChange={() => handleFeatureToggle("laneKeep")}
                        />
                        <label
                          htmlFor="lane-keep"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Lane Keep Assist
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="brake-assist"
                          checked={features.includes("brakeAssist")}
                          onCheckedChange={() => handleFeatureToggle("brakeAssist")}
                        />
                        <label
                          htmlFor="brake-assist"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Brake Assist
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cruise-control"
                          checked={features.includes("cruiseControl")}
                          onCheckedChange={() => handleFeatureToggle("cruiseControl")}
                        />
                        <label
                          htmlFor="cruise-control"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Cruise Control
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="kingBed"
                          checked={features.includes("kingBed")}
                          onCheckedChange={() => handleFeatureToggle("kingBed")}
                        />
                        <label
                          htmlFor="kingBed"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          King Bed
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="washer"
                          checked={features.includes("washer")}
                          onCheckedChange={() => handleFeatureToggle("washer")}
                        />
                        <label
                          htmlFor="washer"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Washer/Dryer
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={handleSubmit} className="w-full">Apply Filters</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </form>
      </div>
    );
  }

  // Extended version for full page
  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Converter</Label>
            <Select value={manufacturer} onValueChange={setManufacturer}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="All Converters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Converters</SelectItem>
                {converters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Chassis</Label>
            <Select value={chassis} onValueChange={setChassis}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Any Chassis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Chassis</SelectItem>
                {chassisOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Any Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Year</SelectItem>
                {Array.from({ length: 10 }, (_, i) => (
                  <SelectItem key={i} value={(new Date().getFullYear() - i).toString()}>
                    {new Date().getFullYear() - i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>&nbsp;</Label>
            <Button type="submit" className="w-full mt-1">
              Search
            </Button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Price Range (USD)</Label>
            <Slider
              defaultValue={priceRange}
              min={0}
              max={2000000}
              step={10000}
              onValueChange={setPriceRange}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${priceRange[0].toLocaleString()}</span>
              <span>${priceRange[1].toLocaleString()}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minMileage">Min Mileage</Label>
              <Input
                id="minMileage"
                type="number"
                placeholder="0"
                value={minMileage}
                onChange={(e) => setMinMileage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxMileage">Max Mileage</Label>
              <Input
                id="maxMileage"
                type="number"
                placeholder="Any"
                value={maxMileage}
                onChange={(e) => setMaxMileage(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slides-full-select">Number of Slides</Label>
            <Select value={slides} onValueChange={setSlides}>
              <SelectTrigger id="slides-full-select">
                <SelectValue placeholder="Any Number of Slides" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Number of Slides</SelectItem>
                <SelectItem value="1">1 Slide</SelectItem>
                <SelectItem value="2">2 Slides</SelectItem>
                <SelectItem value="3">3 Slides</SelectItem>
                <SelectItem value="4">4 Slides</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-4">
          <Label>Features</Label>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="adaptive-cruise-full"
                checked={features.includes("adaptiveCruise")}
                onCheckedChange={() => handleFeatureToggle("adaptiveCruise")}
              />
              <label
                htmlFor="adaptive-cruise-full"
                className="text-sm font-medium leading-none"
              >
                Adaptive Cruise Control
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lane-keep-full"
                checked={features.includes("laneKeep")}
                onCheckedChange={() => handleFeatureToggle("laneKeep")}
              />
              <label
                htmlFor="lane-keep-full"
                className="text-sm font-medium leading-none"
              >
                Lane Keep Assist
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="brake-assist-full"
                checked={features.includes("brakeAssist")}
                onCheckedChange={() => handleFeatureToggle("brakeAssist")}
              />
              <label
                htmlFor="brake-assist-full"
                className="text-sm font-medium leading-none"
              >
                Brake Assist
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cruise-control-full"
                checked={features.includes("cruiseControl")}
                onCheckedChange={() => handleFeatureToggle("cruiseControl")}
              />
              <label
                htmlFor="cruise-control-full"
                className="text-sm font-medium leading-none"
              >
                Cruise Control
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="kingBed-full"
                checked={features.includes("kingBed")}
                onCheckedChange={() => handleFeatureToggle("kingBed")}
              />
              <label
                htmlFor="kingBed-full"
                className="text-sm font-medium leading-none"
              >
                King Bed
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="washer-full"
                checked={features.includes("washer")}
                onCheckedChange={() => handleFeatureToggle("washer")}
              />
              <label
                htmlFor="washer-full"
                className="text-sm font-medium leading-none"
              >
                Washer/Dryer
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
