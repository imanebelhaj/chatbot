"use client";
import { useContext, createContext, useState, useEffect, ReactNode } from "react";
import { loginUser, refreshToken, logoutUser } from "@/api/auth";
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook for requiring authentication
export const useRequireAuth = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  
  useEffect(() => {
    if (!auth?.user) {
      router.push('/auth/login');
    }
  }, [auth, router]);
  
  return auth;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Ensure that the code is executed only on the client side
  useEffect(() => {
    setIsClient(true); // Indicate that we're on the client-side
  }, []);

  // Check for token and username on mount, only if client-side
  useEffect(() => {
    if (isClient) {
      const storedUsername = localStorage.getItem("username");
      const accessToken = localStorage.getItem("access_token");
      
      // Set user state based on localStorage
      if (storedUsername && accessToken) {
        setUser(storedUsername);
      } else {
        setUser(null);
      }
      
    }
  }, [isClient]);

  const login = async (username: string, password: string) => {
    try {
      const response = await loginUser(username, password);
      if (response?.access_token && response?.refresh_token) {
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
        console.log(`Using refresh token: ${response.refresh_token}`);
        console.log(`Using refresh token: ${localStorage.refresh_token}`);
        localStorage.setItem("username", username);
        setUser(username);
        router.push("/conversation/");
        return;
      }
      throw new Error("Login failed");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser(); // Call your API to log out
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state, even if API call fails
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("username");
      router.push("/auth/login");
    }
  };

  const refreshTokens = async () => {
    // Prevent multiple simultaneous refresh requests
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        // Check again in 100ms if still refreshing
        const checkRefreshState = setInterval(() => {
          if (!isRefreshing) {
            clearInterval(checkRefreshState);
            resolve();
          }
        }, 100);
      });
    }
  
    setIsRefreshing(true);
    
    try {
      const refreshTokenValue = localStorage.getItem("refresh_token");
      if (!refreshTokenValue) {
        throw new Error("No refresh token available");
      }
      console.log(`Using refresh token: ${refreshTokenValue}`);
  
      const response = await refreshToken(refreshTokenValue); // Pass the refresh token to the API
      if (response?.access_token) {
        localStorage.setItem("access_token", response.access_token);
        const storedUsername = localStorage.getItem("username");
        setUser(storedUsername);
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("Session expired or refresh failed.", error);
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("username");
      router.push("/auth/login");
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshTokens }}>
      {children}
    </AuthContext.Provider>
  );
};