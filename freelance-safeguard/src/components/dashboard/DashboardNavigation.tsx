import React from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, 
  Shield, 
  FileText, 
  BarChart2, 
  Settings, 
  HelpCircle,
  Wallet,
  Coins,
  Users,
  BookOpen,
  Building,
  Scale,
  ArrowRight
} from 'lucide-react';

interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  delay?: number;
}

const NavigationCard: React.FC<NavigationCardProps> = ({ 
  title, 
  description, 
  icon, 
  path, 
  color,
  delay = 0
}) => {
  return (
    <GlassCard 
      className={cn(
        'p-6 flex flex-col h-full animate-fade-in-up',
        delay && `animation-delay-${delay}`
      )}
    >
      <div className="flex items-center mb-4">
        <div 
          className={cn(
            'p-3 rounded-lg mr-4',
            color === 'primary' && 'bg-primary/10 text-primary',
            color === 'secondary' && 'bg-blue-500/10 text-blue-500',
            color === 'info' && 'bg-cyan-500/10 text-cyan-500',
            color === 'warning' && 'bg-amber-500/10 text-amber-500',
            color === 'success' && 'bg-emerald-500/10 text-emerald-500',
            color === 'danger' && 'bg-rose-500/10 text-rose-500',
            color === 'purple' && 'bg-purple-500/10 text-purple-500'
          )}
        >
          {icon}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      
      <p className="text-muted-foreground mb-6 flex-grow">
        {description}
      </p>
      
      <Link 
        to={path} 
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          'bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full',
          color === 'primary' && 'bg-primary hover:bg-primary/90 text-white',
          color === 'secondary' && 'bg-blue-500 hover:bg-blue-500/90 text-white',
          color === 'info' && 'bg-cyan-500 hover:bg-cyan-500/90 text-white',
          color === 'warning' && 'bg-amber-500 hover:bg-amber-500/90 text-white',
          color === 'success' && 'bg-emerald-500 hover:bg-emerald-500/90 text-white',
          color === 'danger' && 'bg-rose-500 hover:bg-rose-500/90 text-white',
          color === 'purple' && 'bg-purple-500 hover:bg-purple-500/90 text-white'
        )}
      >
        <span>Explore</span>
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </GlassCard>
  );
};

const DashboardNavigation: React.FC = () => {
  const navigationItems = [
    {
      title: 'Dashboard',
      description: 'View your active policies, claims, and account overview',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/dashboard',
      color: 'primary',
      delay: 100
    },
    {
      title: 'Risk Pool',
      description: 'Explore the current risk pool status, liquidity, and performance metrics',
      icon: <Shield className="h-5 w-5" />,
      path: '/risk-pool',
      color: 'secondary',
      delay: 200
    },
    {
      title: 'Claims Management',
      description: 'Submit and track insurance claims for your policies',
      icon: <FileText className="h-5 w-5" />,
      path: '/claims',
      color: 'info',
      delay: 300
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and insights about your insurance activity',
      icon: <BarChart2 className="h-5 w-5" />,
      path: '/analytics',
      color: 'success',
      delay: 400
    },
    {
      title: 'Staking',
      description: 'Stake SOL to earn rewards and strengthen the risk pool',
      icon: <Coins className="h-5 w-5" />,
      path: '/staking',
      color: 'warning',
      delay: 500
    },
    {
      title: 'Regulatory Compliance',
      description: 'Manage compliance with jurisdictional requirements and KYC verification',
      icon: <Scale className="h-5 w-5" />,
      path: '/regulatory-compliance',
      color: 'purple',
      delay: 600
    },
  ];

  return (
    <div className="mt-8 mb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Explore FreelanceShield</h2>
          <p className="text-muted-foreground">
            Navigate through different sections of the application to manage your freelance insurance
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navigationItems.map((item, index) => (
          <NavigationCard
            key={index}
            title={item.title}
            description={item.description}
            icon={item.icon}
            path={item.path}
            color={item.color}
            delay={item.delay}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardNavigation;
