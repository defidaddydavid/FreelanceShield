import { Twitter, Github, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Logo size={32} withText={true} textSize="text-xl" />
            </Link>
            <p className="text-white/70 mb-6">
              Decentralized micro-insurance for crypto freelancers, powered by Solana.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/70 hover:text-deep-purple transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-deep-purple transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-deep-purple transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-brick font-medium text-lg mb-4 text-electric-blue">Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-white/70 hover:text-deep-purple transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-white/70 hover:text-deep-purple transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-white/70 hover:text-deep-purple transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-white/70 hover:text-deep-purple transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-brick font-medium text-lg mb-4 text-electric-blue">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-white/70 hover:text-deep-purple transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-white/70 hover:text-deep-purple transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-white/70 hover:text-deep-purple transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <a 
                  href="https://solana.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white/70 hover:text-deep-purple transition-colors"
                >
                  Solana
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-brick font-medium text-lg mb-4 text-electric-blue">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-white/70 hover:text-deep-purple transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/70 hover:text-deep-purple transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/compliance" className="text-white/70 hover:text-deep-purple transition-colors">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 text-center text-white/50 text-sm">
          <p> {new Date().getFullYear()} FreelanceShield. All rights reserved.</p>
          <p className="mt-2">Built on Solana Blockchain</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
