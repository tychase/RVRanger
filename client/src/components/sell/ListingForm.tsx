import { useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { AuthContext } from "../../main";

interface ListingFormProps {
  packageType: string;
}

// Create schema for form validation based on the RV listing schema
const listingSchema = z.object({
  title: z.string().min(10, { message: "Title must be at least 10 characters" }),
  description: z.string().min(50, { message: "Description must be at least 50 characters" }),
  year: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 1900 && Number(val) <= new Date().getFullYear(), {
    message: "Please enter a valid year"
  }),
  price: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Please enter a valid price"
  }),
  manufacturerId: z.string(),
  typeId: z.string(),
  length: z.string().optional(),
  mileage: z.string().refine(val => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Please enter a valid mileage"
  }),
  location: z.string().min(3, { message: "Location must be at least 3 characters" }),
  fuelType: z.string().optional(),
  bedType: z.string().optional(),
  slides: z.string().optional(),
  featuredImage: z.string().url({ message: "Please enter a valid image URL" }),
  isFeatured: z.boolean().default(false),
});

type ListingFormValues = z.infer<typeof listingSchema>;

const ListingForm = ({ packageType }: ListingFormProps) => {
  const { user } = useContext(AuthContext);
  
  // Fetch manufacturers for select dropdown
  const { data: manufacturers = [] } = useQuery({
    queryKey: ["/api/manufacturers"],
  });
  
  // Fetch RV types for select dropdown
  const { data: rvTypes = [] } = useQuery({
    queryKey: ["/api/types"],
  });
  
  // Initialize form with react-hook-form
  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      description: "",
      year: new Date().getFullYear().toString(),
      price: "",
      manufacturerId: "",
      typeId: "",
      length: "",
      mileage: "0",
      location: "",
      fuelType: "",
      bedType: "",
      slides: "",
      featuredImage: "",
      isFeatured: packageType === "premium" || packageType === "platinum",
    },
  });
  
  // Create mutation for submitting the listing
  const listingMutation = useMutation({
    mutationFn: async (values: ListingFormValues) => {
      const formattedValues = {
        ...values,
        year: parseInt(values.year),
        price: parseFloat(values.price),
        manufacturerId: parseInt(values.manufacturerId),
        typeId: parseInt(values.typeId),
        length: values.length ? parseFloat(values.length) : undefined,
        mileage: parseInt(values.mileage),
        slides: values.slides ? parseInt(values.slides) : undefined,
        sellerId: user.id,
      };
      
      return await apiRequest('POST', '/api/listings', formattedValues);
    },
    onSuccess: () => {
      // Move to next tab (photos)
      document.querySelector('button[value="photos"]')?.click();
    },
  });
  
  // Handle form submission
  const onSubmit = (values: ListingFormValues) => {
    listingMutation.mutate(values);
  };

  const fuelTypes = ["Diesel", "Gasoline", "Hybrid", "Electric"];
  const bedTypes = ["King", "Queen", "Twin", "Bunk", "Convertible"];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2023 Prevost Liberty Elegant Lady" {...field} />
                  </FormControl>
                  <FormDescription>
                    Include year, make and model for best results
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1900" max={new Date().getFullYear()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD) *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="e.g., 275000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="manufacturerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manufacturer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {manufacturers.map((m: any) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="typeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RV Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select RV type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rvTypes.map((type: any) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Miami, FL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (ft)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.1" placeholder="e.g., 45" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="e.g., 25000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fuelTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bedType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bed type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bedTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="slides"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Slides</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="6" placeholder="e.g., 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="featuredImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Image URL *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a URL for your main listing image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {(packageType === "premium" || packageType === "platinum") && (
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Feature this listing</FormLabel>
                      <FormDescription>
                        Your listing will be highlighted in featured sections
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed description of your RV including special features, upgrades, and condition..."
                  rows={8}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Be thorough and highlight key selling points
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-between">
          <Button 
            variant="outline"
            type="button"
            onClick={() => document.querySelector('button[value="package"]')?.click()}
          >
            Back
          </Button>
          <Button 
            type="submit"
            disabled={listingMutation.isPending}
          >
            {listingMutation.isPending ? "Saving..." : "Save and Continue"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ListingForm;
