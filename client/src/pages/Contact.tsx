import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail } from "lucide-react";

// Create schema for form validation
const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  subject: z.string().min(1, { message: "Please select a subject" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  useEffect(() => {
    document.title = "Contact Us - LuxuryRV Market";
  }, []);
  
  // Initialize form with react-hook-form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });
  
  // Handle form submission
  const onSubmit = (values: ContactFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // Success toast
      toast({
        title: "Message sent successfully",
        description: "We'll get back to you as soon as possible",
      });
      
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  return (
    <div className="bg-neutral-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Have questions about buying or selling an RV? Our team is here to help. Reach out to us through any of the methods below.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-primary h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Our Location</h3>
            <p className="text-neutral-600">
              123 Luxury Lane<br/>
              Suite 100<br/>
              Miami, FL 33101
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="text-primary h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Phone Support</h3>
            <p className="text-neutral-600">
              Sales: (800) 123-4567<br/>
              Customer Service: (800) 987-6543<br/>
              Mon-Fri: 9am - 6pm EST
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-primary h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Email Us</h3>
            <p className="text-neutral-600">
              Sales: sales@luxuryrv.market<br/>
              Support: support@luxuryrv.market<br/>
              Info: info@luxuryrv.market
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
            
            {isSubmitted ? (
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                <h3 className="text-xl font-semibold text-green-800 mb-2">Thank You!</h3>
                <p className="text-green-700">
                  Your message has been sent successfully. A member of our team will get back to you as soon as possible.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => {
                    setIsSubmitted(false);
                    form.reset();
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="buying">Buying an RV</SelectItem>
                            <SelectItem value="selling">Selling an RV</SelectItem>
                            <SelectItem value="financing">Financing Options</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                          </SelectContent>
                        </Select>
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
                            placeholder="How can we help you today?" 
                            rows={6}
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Our Location</h2>
              <p className="text-neutral-600 mb-4">
                Visit our headquarters in Miami, where our team of RV experts can provide personalized assistance.
              </p>
            </div>
            {/* Embedded Google Map (placeholder) */}
            <div className="h-96 bg-neutral-200">
              <div className="w-full h-full flex items-center justify-center text-neutral-500">
                <p>Interactive Google Map would be embedded here</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 p-8 bg-primary text-white rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Join Our Network</h2>
          <p className="mb-6 max-w-3xl mx-auto">
            Subscribe to our newsletter to stay updated on the latest luxury RVs, exclusive deals, and industry insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="bg-white text-black border-transparent focus:border-transparent"
            />
            <Button variant="secondary" className="bg-white text-primary hover:bg-neutral-100">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
