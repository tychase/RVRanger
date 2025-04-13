import { useState, useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "../../main";

// Create schema for form validation
const inquirySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

interface InquiryFormProps {
  rvId: number;
}

const InquiryForm = ({ rvId }: InquiryFormProps) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Initialize form with react-hook-form
  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
      email: user ? user.email : '',
      phone: user ? user.phone : '',
      message: '',
    },
  });
  
  // Create mutation for submitting inquiry
  const inquiryMutation = useMutation({
    mutationFn: async (values: InquiryFormValues) => {
      const payload = {
        rvId,
        userId: isAuthenticated ? user.id : undefined,
        ...values,
      };
      
      return await apiRequest('POST', '/api/inquiries', payload);
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent successfully",
        description: "The seller will get back to you soon",
      });
      setIsSubmitted(true);
    },
    onError: () => {
      toast({
        title: "Error sending inquiry",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: InquiryFormValues) => {
    inquiryMutation.mutate(values);
  };
  
  if (isSubmitted) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <h3 className="text-xl font-semibold text-green-800 mb-2">Thank You!</h3>
        <p className="text-green-700">
          Your inquiry has been sent to the seller. They will contact you shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Interested in this RV?</h3>
      <p className="text-neutral-600 mb-6">
        Fill out the form below and the seller will get back to you as soon as possible.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="(123) 456-7890" type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="I'm interested in this RV and would like more information..." 
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={inquiryMutation.isPending}
          >
            {inquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default InquiryForm;
