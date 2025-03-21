
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export const PolicyHeader = () => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-6">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate("/dashboard/policies")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Policies
        </Button>
      </div>
      <h1 className="text-2xl font-display font-bold mb-2">Create New Policy</h1>
      <p className="text-shield-gray-dark">
        Set up coverage for your next project or ongoing freelance work.
      </p>
    </div>
  );
};
