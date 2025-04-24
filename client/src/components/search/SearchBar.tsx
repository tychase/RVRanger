// client/src/components/search/SearchBar.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import qs from "query-string";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchParams } from "@shared/apiSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";

// Define the schema for the quick search form
const quickSearchSchema = z.object({
  query: z.string().optional(),
  yearFrom: z.string().optional(),
  yearTo: z.string().optional(),
});

// Clean function to remove empty values from params
const clean = (obj: any) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null && v !== "")
  );
};

type QuickSearchParams = z.infer<typeof quickSearchSchema>;

const SearchBar: React.FC = () => {
  const [, navigate] = useLocation();

  // Initialize the form with react-hook-form
  const form = useForm<QuickSearchParams>({
    resolver: zodResolver(quickSearchSchema),
    defaultValues: {
      query: "",
      yearFrom: "",
      yearTo: "",
    },
  });

  // Handler for form submission
  const onSubmit = (data: QuickSearchParams) => {
    // Navigate to the /browse page with the search parameters in the query string
    navigate(`/browse?${qs.stringify(clean(data))}`);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <div className="flex flex-col md:flex-row gap-2">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder="Search luxury coaches..."
                    className="h-12 rounded-lg"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="yearFrom"
              render={({ field }) => (
                <FormItem className="w-24">
                  <FormControl>
                    <Input
                      placeholder="Year from"
                      className="h-12 rounded-lg"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="yearTo"
              render={({ field }) => (
                <FormItem className="w-24">
                  <FormControl>
                    <Input
                      placeholder="Year to"
                      className="h-12 rounded-lg"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="h-12 bg-primary text-white px-6 rounded-lg"
            >
              Search
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default SearchBar;