// File: client/src/pages/StyleGuide.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import ListingCard from '@/components/ListingCard';

const StyleGuide = () => {
  return (
    <div className="p-8 bg-neutralLight min-h-screen">
      <h1 className="font-heading text-4xl text-primary mb-6">Style Guide</h1>

      {/* Color Palette */}
      <section className="mb-10">
        <h2 className="font-heading text-2xl mb-4">Color Palette</h2>
        <div className="flex gap-4">
          {[
            { name: 'Primary', color: 'bg-primary', hex: '#2C3E50' },
            { name: 'Secondary', color: 'bg-secondary', hex: '#A39887' },
            { name: 'Accent Gold', color: 'bg-accentGold', hex: '#C99A5E' },
            { name: 'Neutral Dark', color: 'bg-neutralDark', hex: '#1F1F1F' },
            { name: 'Neutral Light', color: 'bg-neutralLight', hex: '#F7F7F7' },
          ].map((col) => (
            <div key={col.name} className="flex flex-col items-center">
              <div className={`${col.color} h-16 w-16 rounded-lg border`} />
              <span className="mt-2 font-medium">{col.name}</span>
              <span className="text-sm text-gray-600">{col.hex}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-10">
        <h2 className="font-heading text-2xl mb-4">Typography</h2>
        <div className="space-y-4">
          <h1 className="font-heading text-5xl">Heading 1 - Playfair Display</h1>
          <h2 className="font-heading text-4xl">Heading 2 - Playfair Display</h2>
          <h3 className="font-heading text-3xl">Heading 3 - Playfair Display</h3>
          <p className="font-body text-lg">Body Text - Inter, 16px</p>
          <p className="font-body text-sm">Small Text - Inter, 14px</p>
        </div>
      </section>

      {/* Buttons */}
      <section className="mb-10">
        <h2 className="font-heading text-2xl mb-4">Buttons</h2>
        <div className="flex gap-4 items-center">
          <Button>Primary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      </section>

      {/* Form Elements */}
      <section className="mb-10">
        <h2 className="font-heading text-2xl mb-4">Form Inputs & Selects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="input-example">Text Input</Label>
            <Input id="input-example" placeholder="Enter text..." />
          </div>
          <div>
            <Label htmlFor="select-example">Select Input</Label>
            <Select>
              <SelectTrigger id="select-example">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one">Option One</SelectItem>
                <SelectItem value="two">Option Two</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Features Popover</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Select Features</Button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <Checkbox id="cb1" />
                    <Label htmlFor="cb1" className="ml-2">Sample Feature</Label>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>

      {/* Card Example */}
      <section>
        <h2 className="font-heading text-2xl mb-4">Listing Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map((i) => (
            <ListingCard
              key={i}
              data={{
                id: i,
                title: `200${i} Elegant Coach`,
                price: `$${(500 + i*100).toLocaleString()}`,
                image: `/images/rv_listings/rv_sample_${i}.jpg`,
                matchScore: i
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default StyleGuide;
