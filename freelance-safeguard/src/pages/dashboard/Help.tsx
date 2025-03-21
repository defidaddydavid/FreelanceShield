
import { useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Help = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mock FAQs
  const faqs = [
    {
      question: "How are insurance premiums calculated?",
      answer: "Premiums are calculated based on several factors including your reputation score, coverage amount, policy duration, and the specific risks covered. Our AI-powered system analyzes these factors along with platform-wide risk data to generate fair and personalized premium rates."
    },
    {
      question: "What happens after I submit a claim?",
      answer: "After submission, your claim undergoes an initial AI-powered verification process. This typically takes 24-48 hours. You'll receive updates on your claim status via your dashboard and email. For approved claims, payment is processed within 3-5 business days directly to your connected wallet."
    },
    {
      question: "Can I modify my coverage after purchasing a policy?",
      answer: "Yes, most policies can be modified during their term. You can increase or decrease coverage amounts, add additional risk categories, or extend the policy duration. Some changes may affect your premium, which will be recalculated and prorated for the remaining term."
    },
    {
      question: "How does the reputation score affect my premiums?",
      answer: "Your reputation score directly impacts your premium rates. Higher scores (indicating lower risk) qualify you for discounted rates. The score is calculated based on your claims history, policy payment consistency, project completion record, and client feedback across supported platforms."
    },
    {
      question: "Is my data secure and private?",
      answer: "We prioritize data security and privacy. Personal information is stored securely off-chain with industry-standard encryption. Policy and transaction data are recorded on the Solana blockchain, which is secure but transparent. We never share your personal data with third parties without consent."
    }
  ];

  // Mock resources
  const resources = [
    {
      title: "Insurance Policy Guide",
      description: "Comprehensive guide to understanding your insurance coverage.",
      type: "PDF Guide",
      url: "#"
    },
    {
      title: "Claims Process Tutorial",
      description: "Step-by-step tutorial on submitting and tracking claims.",
      type: "Video",
      url: "#"
    },
    {
      title: "Risk Management for Freelancers",
      description: "Learn how to reduce your freelance business risks.",
      type: "Article",
      url: "#"
    },
    {
      title: "Understanding Your Reputation Score",
      description: "Detailed explanation of how your reputation score works.",
      type: "Interactive Guide",
      url: "#"
    }
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold mb-2">Help Center</h1>
        <p className="text-shield-gray-dark">
          Find answers to common questions and get support.
        </p>
      </div>
      
      <div className="relative mb-8">
        <Input 
          placeholder="Search for help articles..." 
          className="pl-10"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-shield-gray-dark" />
      </div>
      
      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="faq">Frequently Asked Questions</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
        </TabsList>
        
        <TabsContent value="faq">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-shield-gray-dark">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="resources">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((resource, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <span className="bg-shield-blue/10 text-shield-blue text-xs px-2 py-1 rounded">
                    {resource.type}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.url}>View Resource</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Our Support Team</CardTitle>
              <CardDescription>
                We're here to help. Fill out the form below and our team will respond as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium">Name</label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium">Email</label>
                    <Input id="email" type="email" placeholder="Your email address" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-medium">Subject</label>
                  <Input id="subject" placeholder="How can we help you?" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium">Message</label>
                  <textarea 
                    id="message" 
                    rows={5}
                    className="w-full p-3 border rounded-md"
                    placeholder="Please describe your issue in detail..."
                  />
                </div>
                
                <div className="pt-2">
                  <Button type="submit" className="w-full sm:w-auto">Send Message</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Help;
