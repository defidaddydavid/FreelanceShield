import { ArrowRight, Shield, CheckCircle, Wallet, FileText, Calculator, Clock, Coins, Award, Code, Zap, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    y: -10,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

const MotionCard = motion(Card);

export default function PricingPage() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Color scheme based on theme
  const accentColor = isDark ? 'hsl(var(--primary))' : 'hsl(var(--primary))';
  const highlightColor = isDark ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--primary) / 0.1)';
  const freeTagColor = isDark ? 'hsl(var(--success))' : 'hsl(var(--success))';
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="container mx-auto py-12 px-4 md:py-24 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the perfect plan for your freelancing needs with our flexible pricing options.
            </p>
          </div>

          <Tabs defaultValue="monthly" className="w-full max-w-5xl mx-auto">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="annual">Annual (Save 20%)</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="monthly" className="space-y-8">
              <div className="grid gap-8 md:grid-cols-3">
                {/* Onboarding (Free) Plan */}
                <MotionCard 
                  ref={ref} 
                  variants={cardVariants} 
                  initial="hidden" 
                  animate={inView ? "visible" : "hidden"} 
                  whileHover="hover"
                  className="flex flex-col border-2 bg-gradient-to-b from-background to-muted/50 dark:from-background dark:to-muted/20"
                >
                  <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-sm font-medium rounded-br-lg rounded-tl-lg">
                    Free
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">Enterprise Onboarding</CardTitle>
                    <CardDescription>Start with no cost, scale as you grow</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Basic API access (100 calls/day)</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Documentation & integration guides</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Email support</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>1 policy for testing</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Sandbox environment</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline" asChild>
                      <Link to="/dashboard">Get Started</Link>
                    </Button>
                  </CardFooter>
                </MotionCard>

                {/* Basic Plan */}
                <MotionCard 
                  ref={ref} 
                  variants={cardVariants} 
                  initial="hidden" 
                  animate={inView ? "visible" : "hidden"} 
                  whileHover="hover"
                  className="flex flex-col border-2 dark:border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-2xl">Basic</CardTitle>
                    <CardDescription>Essential protection for beginners</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$19</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Up to $2,000 coverage per project</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Basic contract protection</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Email support</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>3 policies per month</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link to="/dashboard">Get Started</Link>
                    </Button>
                  </CardFooter>
                </MotionCard>

                {/* Pro Plan */}
                <MotionCard 
                  ref={ref} 
                  variants={cardVariants} 
                  initial="hidden" 
                  animate={inView ? "visible" : "hidden"} 
                  whileHover="hover"
                  className="flex flex-col relative border-2 border-primary dark:border-primary/80"
                >
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded-bl-lg rounded-tr-lg">
                    Popular
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">Pro</CardTitle>
                    <CardDescription>Comprehensive coverage for professionals</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$49</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Up to $10,000 coverage per project</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Advanced contract protection</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Priority email & chat support</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>10 policies per month</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Expedited claims processing</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Custom contract templates</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Risk analysis dashboard</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link to="/dashboard">Get Started</Link>
                    </Button>
                  </CardFooter>
                </MotionCard>
              </div>
            </TabsContent>

            <TabsContent value="annual" className="space-y-8">
              <div className="grid gap-8 md:grid-cols-3">
                {/* Onboarding (Free) Plan Annual */}
                <MotionCard 
                  ref={ref} 
                  variants={cardVariants} 
                  initial="hidden" 
                  animate={inView ? "visible" : "hidden"} 
                  whileHover="hover"
                  className="flex flex-col border-2 bg-gradient-to-b from-background to-muted/50 dark:from-background dark:to-muted/20"
                >
                  <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-sm font-medium rounded-br-lg rounded-tl-lg">
                    Free
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">Enterprise Onboarding</CardTitle>
                    <CardDescription>Start with no cost, scale as you grow</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-muted-foreground">/month</span>
                      <div className="text-sm text-green-500 font-medium mt-1">Billed annually ($0)</div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Basic API access (100 calls/day)</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Documentation & integration guides</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Email support</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>1 policy for testing</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Sandbox environment</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline" asChild>
                      <Link to="/dashboard">Get Started</Link>
                    </Button>
                  </CardFooter>
                </MotionCard>

                {/* Basic Plan Annual */}
                <MotionCard 
                  ref={ref} 
                  variants={cardVariants} 
                  initial="hidden" 
                  animate={inView ? "visible" : "hidden"} 
                  whileHover="hover"
                  className="flex flex-col border-2 dark:border-border"
                >
                  <CardHeader>
                    <CardTitle className="text-2xl">Basic</CardTitle>
                    <CardDescription>Essential protection for beginners</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$15</span>
                      <span className="text-muted-foreground">/month</span>
                      <div className="text-sm text-green-500 font-medium mt-1">Billed annually ($180)</div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Up to $2,000 coverage per project</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Basic contract protection</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Email support</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>3 policies per month</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link to="/dashboard">Get Started</Link>
                    </Button>
                  </CardFooter>
                </MotionCard>

                {/* Pro Plan Annual */}
                <MotionCard 
                  ref={ref} 
                  variants={cardVariants} 
                  initial="hidden" 
                  animate={inView ? "visible" : "hidden"} 
                  whileHover="hover"
                  className="flex flex-col relative border-2 border-primary dark:border-primary/80"
                >
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded-bl-lg rounded-tr-lg">
                    Popular
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">Pro</CardTitle>
                    <CardDescription>Comprehensive coverage for professionals</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">$39</span>
                      <span className="text-muted-foreground">/month</span>
                      <div className="text-sm text-green-500 font-medium mt-1">Billed annually ($468)</div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Up to $10,000 coverage per project</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Advanced contract protection</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Priority email & chat support</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>10 policies per month</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Expedited claims processing</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Custom contract templates</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Risk analysis dashboard</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link to="/dashboard">Get Started</Link>
                    </Button>
                  </CardFooter>
                </MotionCard>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <section className="bg-muted py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold"
              >
                Frequently Asked Questions
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                Find answers to common questions about our insurance plans and coverage options.
              </motion.p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto"
            >
              <motion.div variants={cardVariants}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle>How does the coverage work?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Our coverage works by verifying the non-payment through Solana blockchain transactions. Once verified, we process the claim and pay out the covered amount directly to your wallet.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariants}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle>What happens if a client doesn't pay?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      If a client fails to pay, submit a claim through your dashboard with evidence of completed work. Our AI will verify the claim and process payment within 48 hours.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariants}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle>How are premiums calculated?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Premiums are calculated based on coverage amount, period, job type risk, industry risk, your reputation score, and market conditions using our AI-powered risk model.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariants}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle>Can I cancel my policy?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Yes, you can cancel your policy at any time. For monthly plans, cancellation takes effect at the end of the billing cycle. For annual plans, we offer prorated refunds.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariants}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle>What is the Enterprise Onboarding tier?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      The Enterprise Onboarding tier is our free offering for businesses that want to test our platform before committing. It includes basic API access, documentation, and a sandbox environment to evaluate our services with no financial commitment.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariants}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle>How does API access work?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      All plans include API access with varying call limits. You'll receive API keys upon signup that allow you to integrate our insurance services directly into your platforms. Documentation and SDKs are provided to simplify integration.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold">Ready to Secure Your Freelance Work?</h2>
              <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your needs and start protecting your work today.
              </p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8"
              >
                <Button size="lg" asChild>
                  <Link to="/dashboard">Get Started Now</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
