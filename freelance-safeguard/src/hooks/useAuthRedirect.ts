import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivyAuth } from './usePrivyAuth';

/**
 * Custom hook to handle authentication redirects
 * Ensures users are automatically redirected to dashboard after authentication
 */
export const useAuthRedirect = () => {
  const { isAuthenticated, ready } = usePrivyAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only proceed if Privy is ready and we haven't already redirected
    if (ready && isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      
      // Redirect to dashboard with replace:true to prevent back button issues
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, ready, navigate, isRedirecting]);

  return {
    isAuthenticated,
    ready,
    isRedirecting
  };
};

export default useAuthRedirect;
