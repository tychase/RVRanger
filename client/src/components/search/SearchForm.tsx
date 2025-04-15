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
  const [manufacturer, setManufacturer] = useState("all");
  const [type, setType] = useState("any");
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

  // Fetch manufacturers
  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
    staleTime: Infinity, // Data doesn't change often
  });

  // Fetch RV types
  const { data: rvTypes = [] } = useQuery<RvType[]>({
    queryKey: ["/api/types"],
    staleTime: Infinity,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      manufacturer,
      type,
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
                  <SelectValue placeholder="All Manufacturers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Manufacturers</SelectItem>
                  {manufacturers.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Type</SelectItem>
                  {rvTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
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
                    <Input
                      id="slides"
                      type="number"
                      min="0"
                      max="10"
                      placeholder="Any"
                      value={slides}
                      onChange={(e) => setSlides(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Features</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="slides"
                          checked={features.includes("slides")}
                          onCheckedChange={() => handleFeatureToggle("slides")}
                        />
                        <label
                          htmlFor="slides"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Slides
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
                          id="diesel"
                          checked={features.includes("diesel")}
                          onCheckedChange={() => handleFeatureToggle("diesel")}
                        />
                        <label
                          htmlFor="diesel"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Diesel
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
            <Label>Manufacturer</Label>
            <Select value={manufacturer} onValueChange={setManufacturer}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="All Manufacturers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {manufacturers.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Any Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Type</SelectItem>
                {rvTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
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
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        
        <div className="mt-4">
          <Label>Features</Label>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="slides-full"
                checked={features.includes("slides")}
                onCheckedChange={() => handleFeatureToggle("slides")}
              />
              <label
                htmlFor="slides-full"
                className="text-sm font-medium leading-none"
              >
                Slides
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
                id="diesel-full"
                checked={features.includes("diesel")}
                onCheckedChange={() => handleFeatureToggle("diesel")}
              />
              <label
                htmlFor="diesel-full"
                className="text-sm font-medium leading-none"
              >
                Diesel
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
