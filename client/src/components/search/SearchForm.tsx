// client/src/components/search/SearchForm.tsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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

const chassisOptions = ["H345", "X345", "XLII"];
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
  onSearch?: (params: any) => void;
  simplified?: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, simplified = false }) => {
  const [converter, setConverter] = React.useState("all");
  const [chassis, setChassis] = React.useState("all");
  const [slides, setSlides] = React.useState("all");
  const [features, setFeatures] = React.useState<string[]>([]);

  const toggleFeature = (feat: string) => {
    setFeatures(prev => (prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.({ converter, chassis, slides, features });
  };

  const featureLabel = features.length > 0 ? features.join(", ") : "Select Features";

  return (
    <form className="space-y-6 p-4 sm:p-6 bg-neutralLight rounded-2xl border border-neutralLight/50 shadow-lg" onSubmit={handleSubmit}>
      {/* Responsive grid layout for form fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Converter */}
        <div>
          <Label htmlFor="converter" className="text-sm sm:text-base">Converter</Label>
          <Select value={converter} onValueChange={setConverter}>
            <SelectTrigger id="converter" className="w-full mt-1 h-10 sm:h-11">
              <SelectValue placeholder="All Converters" />
            </SelectTrigger>
            <SelectContent className="min-w-[8rem] sm:min-w-[10rem]">
              <SelectItem value="all">All Converters</SelectItem>
              {converters.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chassis */}
        <div>
          <Label htmlFor="chassis" className="text-sm sm:text-base">Chassis</Label>
          <Select value={chassis} onValueChange={setChassis}>
            <SelectTrigger id="chassis" className="w-full mt-1 h-10 sm:h-11">
              <SelectValue placeholder="Any Chassis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Chassis</SelectItem>
              {chassisOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Slides */}
        <div>
          <Label htmlFor="slides" className="text-sm sm:text-base">Slides</Label>
          <Select value={slides} onValueChange={setSlides}>
            <SelectTrigger id="slides" className="w-full mt-1 h-10 sm:h-11">
              <SelectValue placeholder="Any Number of Slides" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Number of Slides</SelectItem>
              {slidesOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Features */}
        <div>
          <Label className="mb-1 block text-sm sm:text-base">Features</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full text-left mt-1 h-10 sm:h-11">
                {featureLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="bottom" 
              align="start" 
              className="w-full h-full rounded-none p-4 sm:rounded-xl sm:w-56 sm:h-auto"
            >
              <div className="flex flex-col space-y-3">
                {featureOptions.map((feat, idx) => (
                  <div key={idx} className="flex items-center">
                    <Checkbox
                      id={`feature-${idx}`}
                      checked={features.includes(feat)}
                      onCheckedChange={() => toggleFeature(feat)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={`feature-${idx}`} className="ml-3 text-base">
                      {feat}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Submit */}
      {onSearch && (
        <Button 
          type="submit" 
          className="w-full bg-primary text-white rounded-2xl px-6 py-3 text-base sm:text-lg shadow-md hover:bg-opacity-90 transition mt-2"
        >
          Search Coaches
        </Button>
      )}
    </form>
  );
};

export default SearchForm;


