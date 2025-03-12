"use client";

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { jwtDecode } from "jwt-decode";
interface JwtPayload {
  exp: number;
}

const useSessionCheck = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);

  useEffect(() => {
    const checkSession = async () => {
      const accessToken = localStorage.getItem("access_token");
      
      if (!accessToken) {
        // No token - check for refresh token
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken && auth?.refreshTokens) {
          try {
            console.log("No access token found. Attempting to refresh...");
            const success = await auth.refreshTokens();
            if (!success) {
              auth.logout();
              router.push('/auth/login');
            }
          } catch (error) {
            console.error("Token refresh failed:", error);
            auth.logout();
            router.push('/auth/login');
          }
        } else {
          console.log("No tokens available. Redirecting to login...");
          auth?.logout();
          router.push('/auth/login');
        }
        return;
      }
      
      // Validate token expiration
      try {
        const payload = jwtDecode<JwtPayload>(accessToken);
        const currentTime = Date.now() / 1000;
        
        // If token is expired or about to expire in the next 5 minutes
        if (payload.exp - currentTime < 300) { // 300 seconds = 5 minutes
          console.log("Token is about to expire. Attempting refresh...");
          if (auth?.refreshTokens) {
            try {
              const success = await auth.refreshTokens();
              if (!success) {
                auth.logout();
                router.push('/auth/login');
              }
            } catch (error) {
              console.error("Proactive refresh failed:", error);
              auth.logout();
              router.push('/auth/login');
            }
          }
        }
      } catch (error) {
        console.error("Invalid token format:", error);
        if (auth?.refreshTokens) {
          try {
            const success = await auth.refreshTokens();
            if (!success) {
              auth.logout();
              router.push('/auth/login');
            }
          } catch (refreshError) {
            console.error("Token refresh failed after validation error:", refreshError);
            auth.logout();
            router.push('/auth/login');
          }
        } else {
          auth?.logout();
          router.push('/auth/login');
        }
      }
    };
    
    checkSession();
  }, [router, auth]);

  return auth;
};

export default useSessionCheck;