"use client";

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext'; // Adjust path based on your project structure

const useSessionCheck = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");

    console.log("Access token:", accessToken);

    if (!accessToken ) { //|| !auth?.use
      // Attempt to refresh the token if access token is missing or user is not authenticated
      if (auth?.refreshTokens) {
        console.log("Attempting to refresh token...");
        auth.refreshTokens().catch(() => {
          // If refresh fails, redirect to login
          console.log("Token refresh failed, redirecting to login page...");
          router.push('/auth/login');
        });
      } else {
        // Redirect to login page if refreshTokens function is not available
        console.log("Redirecting to login page...");
        router.push('/auth/login');
      }
    }
  }, [router, auth]);

  return auth;
};

export default useSessionCheck;