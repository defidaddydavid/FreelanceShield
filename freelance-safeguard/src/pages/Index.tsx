import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import { cn } from '@/lib/utils';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import CallToAction from '@/components/home/CallToAction';
import GridBackground from '@/components/ui/GridBackground';

const Index = () => {
  const { isDark } = useSolanaTheme();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <Layout>
      <GridBackground 
        className={cn("w-full min-h-screen", isDark ? "text-white" : "text-foreground")}
        withTopAccent
        withBottomAccent
        withLaserAnimation
      >
        <Hero />
        <Features />
        <HowItWorks />
        <CallToAction />
      </GridBackground>
    </Layout>
  );
};

export default Index;
