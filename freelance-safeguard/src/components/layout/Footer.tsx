import { Twitter, Github, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';

// Inline SVG for Solana logo
const SolanaLogo = ({ className }: { className?: string }) => {
  const { isDark } = useSolanaTheme();
  return (
    <svg 
      width="28" 
      height="28" 
      viewBox="0 0 397 311" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h320.3c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="#9945FF"/>
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h320.3c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="#03E1FF"/>
      <path d="M332.4 120.9c-2.4-2.4-5.7-3.8-9.2-3.8H2.9c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h320.3c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#7C5CFF"/>
    </svg>
  );
};

const Footer = () => {
  const { isDark } = useSolanaTheme();
  
  return (
    <footer className={cn(
      "bg-muted text-foreground pt-16 pb-8",
      isDark ? "border-t border-shield-purple/10" : "border-t border-shield-purple/10"
    )}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Logo size={90} withText={false} />
              <span className="font-['NT_Brick_Sans'] text-2xl tracking-wide text-shield-purple">
                FreelanceShield
              </span>
            </Link>
            <p className="text-muted-foreground mb-6">
              Decentralized micro-insurance for Web3 freelancers, powered by Solana.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-shield-purple transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-shield-purple transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-shield-purple transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className={`font-brick font-medium text-lg mb-4 text-shield-purple`}>Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-shield-purple transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-shield-purple transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-shield-purple transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-shield-purple transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className={`font-brick font-medium text-lg mb-4 text-shield-purple`}>Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-shield-purple transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-muted-foreground hover:text-shield-purple transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-shield-purple transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <a 
                  href="https://solana.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-shield-purple transition-colors"
                >
                  Solana
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className={`font-brick font-medium text-lg mb-4 text-shield-purple`}>Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-shield-purple transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-shield-purple transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/compliance" className="text-muted-foreground hover:text-shield-purple transition-colors">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 text-center text-muted-foreground text-sm">
          <p> {new Date().getFullYear()} FreelanceShield. All rights reserved.</p>
          <p className="mt-2 flex items-center justify-center space-x-2">
            <span>Built on</span>
            <SolanaLogo className="mx-1" />
            <span>Solana Blockchain</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
