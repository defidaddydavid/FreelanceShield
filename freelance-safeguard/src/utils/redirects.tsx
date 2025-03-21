import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface RedirectProps {
  to: string;
}

/**
 * Component to handle direct redirects to specific routes
 * Useful for external links that need to navigate to a specific page
 */
export const Redirect: React.FC<RedirectProps> = ({ to }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);

  return null;
};
