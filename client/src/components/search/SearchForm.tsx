// Updated SearchForm.tsx with Popover-based multi-select Features dropdown
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

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
    setFeatures(prev =>
      prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.({ converter, chassis, slides, features });
  };

  const featureLabel = features.length > 0 ? features.join(", ") : "Select Features";

  return (
    <form className="space-y-6 p-6 bg-white/95 rounded-2xl shadow-lg" onSubmit={handleSubmit}>
      {/* Converter */}
      <div>
        <Label htmlFor="converter" className="font-medium text-neutral-dark mb-2 block">Converter</Label>
        <Select value={converter} onValueChange={setConverter}>
          <SelectTrigger id="converter" className="w-full search-input">
            <SelectValue placeholder="All Converters" />
          </SelectTrigger>
          <SelectContent className="border-neutral-dark/20 rounded-xl">
            <SelectItem value="all">All Converters</SelectItem>
            {converters.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chassis */}
      <div>
        <Label htmlFor="chassis" className="font-medium text-neutral-dark mb-2 block">Chassis</Label>
        <Select value={chassis} onValueChange={setChassis}>
          <SelectTrigger id="chassis" className="w-full search-input">
            <SelectValue placeholder="Any Chassis" />
          </SelectTrigger>
          <SelectContent className="border-neutral-dark/20 rounded-xl">
            <SelectItem value="all">Any Chassis</SelectItem>
            {chassisOptions.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Slides */}
      <div>
        <Label htmlFor="slides" className="font-medium text-neutral-dark mb-2 block">Slides</Label>
        <Select value={slides} onValueChange={setSlides}>
          <SelectTrigger id="slides" className="w-full search-input">
            <SelectValue placeholder="Any Number of Slides" />
          </SelectTrigger>
          <SelectContent className="border-neutral-dark/20 rounded-xl">
            <SelectItem value="all">Any Number of Slides</SelectItem>
            {slidesOptions.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Features as Popover Multi-Select */}
      <div>
        <Label className="font-medium text-neutral-dark mb-2 block">Features</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full text-left search-input">
              {featureLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-64 border-neutral-dark/20 rounded-xl">
            <div className="flex flex-col space-y-3 py-2">
              {featureOptions.map((feat, idx) => (
                <div key={idx} className="flex items-center">
                  <Checkbox
                    id={`feature-${idx}`}
                    checked={features.includes(feat)}
                    onCheckedChange={() => toggleFeature(feat)}
                    className="text-accent-gold focus:ring-accent-gold"
                  />
                  <Label htmlFor={`feature-${idx}`} className="ml-3 text-neutral-dark">
                    {feat}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Submit */}
      {onSearch && (
        <Button type="submit" className="w-full bg-primary text-white rounded-2xl px-6 py-3 shadow-md hover:bg-opacity-90 transition mt-8">
          Search Coaches
        </Button>
      )}
    </form>
  );
};

export default SearchForm;

