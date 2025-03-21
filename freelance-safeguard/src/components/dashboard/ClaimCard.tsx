
import { FileText, Calendar, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ClaimCardProps {
  title: string;
  description: string;
  amount: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  progressPercentage?: number;
}

const ClaimCard = ({
  title,
  description,
  amount,
  submittedDate,
  status,
  progressPercentage = 0
}: ClaimCardProps) => {
  const statusConfig = {
    pending: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      label: "Pending Review"
    },
    approved: {
      color: "bg-green-100 text-green-800 border-green-200",
      label: "Approved"
    },
    rejected: {
      color: "bg-red-100 text-red-800 border-red-200",
      label: "Rejected"
    },
    processing: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      label: "Processing"
    }
  };

  return (
    <GlassCard className="overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-shield-blue mr-2" />
            <h3 className="font-display font-medium text-lg">{title}</h3>
          </div>
          <Badge variant="outline" className={statusConfig[status].color}>
            {statusConfig[status].label}
          </Badge>
        </div>
        
        <p className="text-shield-gray-dark mb-4 text-sm">
          {description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-shield-gray p-3 rounded-lg">
            <div className="flex items-center text-shield-gray-dark text-xs mb-1">
              <DollarSign className="h-3 w-3 mr-1" />
              <span>Claim Amount</span>
            </div>
            <p className="font-medium">{amount}</p>
          </div>
          
          <div className="bg-shield-gray p-3 rounded-lg">
            <div className="flex items-center text-shield-gray-dark text-xs mb-1">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Submitted</span>
            </div>
            <p className="font-medium">{submittedDate}</p>
          </div>
        </div>
        
        {status === 'processing' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-shield-gray-dark text-xs">
                <Clock className="h-3 w-3 mr-1" />
                <span>Processing</span>
              </div>
              <span className="text-xs font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
        
        <div className="flex justify-end">
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};

export default ClaimCard;
