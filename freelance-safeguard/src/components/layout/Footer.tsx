
import { Shield, Twitter, Github, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-shield-navy text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-shield-blue-light" />
              <span className="text-xl font-display font-bold">FreelanceShield</span>
            </Link>
            <p className="text-white/70 mb-6">
              Decentralized micro-insurance for crypto freelancers, powered by Solana.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-display font-medium text-lg mb-4">Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-white/70 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-white/70 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-white/70 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-white/70 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display font-medium text-lg mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-white/70 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-white/70 hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-white/70 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <a 
                  href="https://solana.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Solana
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display font-medium text-lg mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-white/70 hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/compliance" className="text-white/70 hover:text-white transition-colors">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 text-center md:flex md:justify-between md:text-left">
          <p className="text-white/60 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} FreelanceShield. All rights reserved.
          </p>
          <p className="text-white/60 text-sm">
            Built with ❤️ for the crypto freelance community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
