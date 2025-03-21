
import { Shield, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';

interface InsuranceCardProps {
  title: string;
  description: string;
  premium: string;
  coverage: string;
  status: 'active' | 'expired' | 'pending';
  expiryDate: string;
}

const InsuranceCard = ({
  title,
  description,
  premium,
  coverage,
  status,
  expiryDate
}: InsuranceCardProps) => {
  const statusColors = {
    active: "bg-green-100 text-green-800 border-green-200",
    expired: "bg-red-100 text-red-800 border-red-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200"
  };
  
  const statusLabel = {
    active: "Active",
    expired: "Expired",
    pending: "Pending"
  };

  return (
    <GlassCard className="overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-shield-blue mr-2" />
            <h3 className="font-display font-medium text-lg">{title}</h3>
          </div>
          <Badge variant="outline" className={statusColors[status]}>
            {statusLabel[status]}
          </Badge>
        </div>
        
        <p className="text-shield-gray-dark mb-4 text-sm">
          {description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-shield-gray p-3 rounded-lg">
            <div className="flex items-center text-shield-gray-dark text-xs mb-1">
              <DollarSign className="h-3 w-3 mr-1" />
              <span>Premium</span>
            </div>
            <p className="font-medium">{premium}</p>
          </div>
          
          <div className="bg-shield-gray p-3 rounded-lg">
            <div className="flex items-center text-shield-gray-dark text-xs mb-1">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Expiry</span>
            </div>
            <p className="font-medium">{expiryDate}</p>
          </div>
        </div>
        
        <div className="bg-shield-blue/10 p-3 rounded-lg mb-6">
          <div className="flex items-center text-shield-blue mb-1 text-sm">
            <Shield className="h-4 w-4 mr-1" />
            <span>Coverage</span>
          </div>
          <p className="font-medium">{coverage}</p>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" size="sm">
            View Details
          </Button>
          <Button size="sm">
            File Claim <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};

export default InsuranceCard;
