// Fully patched SearchForm.tsx with stable "all" defaults and proper placeholder rendering
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const converters = [
  { id: "marathon", name: "Marathon" },
  { id: "liberty", name: "Liberty" },
  { id: "millennium", name: "Millennium" },
  { id: "emerald", name: "Emerald" },
  { id: "featherlite", name: "Featherlite" },
  { id: "loki", name: "Loki" },
  { id: "country_coach", name: "Country Coach" },
];

const chassisOptions = ["H345", "X345"];
const slidesOptions = ["1", "2", "3", "4"];
const featureOptions = [
  "Adaptive cruise control",
  "Lane keep assist",
  "Brake assist",
  "Cruise control",
  "Outdoor TV",
  "Underbay storage",
];

interface SearchFormProps {
  onSearch?: (searchParams: any) => void;
  simplified?: boolean;
  theme?: 'light' | 'dark';
}

const SearchForm: React.FC<SearchFormProps> = ({ 
  onSearch, 
  simplified = false,
  theme = 'light' 
}) => {
  const [manufacturer, setManufacturer] = React.useState("all");
  const [chassis, setChassis] = React.useState("all");
  const [slides, setSlides] = React.useState("all");
  const [features, setFeatures] = React.useState<string[]>([]);

  // Helper function to get manufacturer/converter name
  const getManufacturerName = (id: string) => {
    if (id === "all") return "All Converters";
    const converter = converters.find(c => c.id === id);
    return converter ? converter.name : id;
  };

  // Helper function to get chassis display text
  const getChassisDisplay = (value: string) => {
    if (value === "all") return "Any Chassis";
    return value;
  };

  // Helper function to get slides display text
  const getSlidesDisplay = (value: string) => {
    if (value === "all") return "Any Number of Slides";
    return `${value} Slides`;
  };

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        manufacturer,
        chassis,
        slides,
        features,
      });
    }
  };

  // Determine text color class based on theme
  const textColorClass = theme === 'dark' ? 'text-white' : 'text-foreground';
  
  return (
    <form className={`space-y-6 p-6 ${theme === 'dark' ? 'text-white' : ''}`} onSubmit={handleSubmit}>
      {/* Converter Dropdown */}
      <div>
        <Label htmlFor="converter" className={textColorClass}>Converter</Label>
        <Select value={manufacturer} onValueChange={setManufacturer}>
          <SelectTrigger id="converter" className={`relative ${textColorClass}`}>
            <span>{getManufacturerName(manufacturer)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Converters</SelectItem>
            {converters.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chassis Dropdown */}
      <div>
        <Label htmlFor="chassis" className={textColorClass}>Chassis</Label>
        <Select value={chassis} onValueChange={setChassis}>
          <SelectTrigger id="chassis" className={`relative ${textColorClass}`}>
            <span>{getChassisDisplay(chassis)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Chassis</SelectItem>
            {chassisOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Slides Dropdown */}
      <div>
        <Label htmlFor="slides" className={textColorClass}>Slides</Label>
        <Select value={slides} onValueChange={setSlides}>
          <SelectTrigger id="slides" className={`relative ${textColorClass}`}>
            <span>{getSlidesDisplay(slides)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Number of Slides</SelectItem>
            {slidesOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Features Section */}
      <div>
        <Label className={`mb-2 block ${textColorClass}`}>Features</Label>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {features.map((feature, index) => (
              <Badge 
                key={index} 
                variant={theme === 'dark' ? 'secondary' : 'outline'}
                className="flex items-center gap-1 pl-2 pr-1 py-1"
              >
                {feature}
                <button 
                  type="button" 
                  onClick={() => toggleFeature(feature)}
                  className="rounded-full hover:bg-muted p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {featureOptions.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                id={`feature-${index}`}
                checked={features.includes(feature)}
                onCheckedChange={() => toggleFeature(feature)}
              />
              <Label htmlFor={`feature-${index}`} className={`text-sm ${textColorClass}`}>
                {feature}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      {onSearch && (
        <div className="pt-2">
          <Button type="submit" className="w-full">
            Search RVs
          </Button>
        </div>
      )}
    </form>
  );
};

export default SearchForm;
