"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { useContext } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Add a refresh attempt tracker to prevent infinite loops
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("access_token");
      console.log("Access token:", accessToken);
      
      if (!accessToken) {
        // Attempt to refresh the token if access token is missing
        if (auth?.refreshTokens && !refreshAttempted) {
          console.log("Attempting to refresh token...");
          setRefreshAttempted(true);
          
          try {
            await auth.refreshTokens();
            setIsAuthorized(true);
          } catch (error) {
            // If refresh fails, redirect to login
            console.log("Token refresh failed, redirecting to login page...");
            router.push('/auth/login');
          } finally {
            setIsLoading(false);
          }
        } else {
          // Redirect to login page if refreshTokens function is not available or already attempted
          console.log("Redirecting to login page...");
          router.push('/auth/login');
          setIsLoading(false);
        }
      } else {
        // We have an access token, consider user authorized
        setIsAuthorized(true);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router, auth, refreshAttempted]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only render children when authorized
  return isAuthorized ? <>{children}</> : null;
};

export default ProtectedRoute;