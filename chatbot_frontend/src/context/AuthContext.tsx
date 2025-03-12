"use client";
import { useContext, createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
//import jwtDecode from "jwt-decode";
import { jwtDecode } from "jwt-decode";

// Create axios instance
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

interface AuthContextType {
  user: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
  isAuthenticated: boolean;
}

interface JwtPayload {
  exp: number;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook for requiring authentication
export const useRequireAuth = () => {
  const router = useRouter();
  const auth = useContext(AuthContext);
  
  useEffect(() => {
    if (!auth?.isAuthenticated) {
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
  const [refreshPromise, setRefreshPromise] = useState<Promise<boolean> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Setup axios interceptors
  useEffect(() => {
    // Request interceptor - adds token to requests
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        // Check if token is about to expire and refresh if needed
        const accessToken = localStorage.getItem("access_token");
        
        if (accessToken) {
          try {
            const payload = jwtDecode<JwtPayload>(accessToken);
            const tokenExpiration = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            
            // If token expires in less than 5 minutes, refresh it
            if (tokenExpiration - currentTime < 5 * 60 * 1000) {
              await refreshTokens();
            }
            
            // Get the latest token (might have been refreshed)
            const updatedToken = localStorage.getItem("access_token");
            config.headers.Authorization = `Bearer ${updatedToken}`;
          } catch (error) {
            console.error("Token validation error:", error);
            // If token is invalid, attempt to refresh
            await refreshTokens();
            const updatedToken = localStorage.getItem("access_token");
            if (updatedToken) {
              config.headers.Authorization = `Bearer ${updatedToken}`;
            }
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handles 401 errors
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If we get a 401 and haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const refreshSuccess = await refreshTokens();
            if (refreshSuccess) {
              // Update the authorization header with new token
              const newToken = localStorage.getItem("access_token");
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest); // Retry the original request
            }
          } catch (refreshError) {
            console.error("Token refresh failed in interceptor:", refreshError);
          }
          
          // If we reach here, refresh failed or returned false
          router.push('/auth/login');
        }
        
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors when component unmounts
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [router]);

  // Ensure that the code is executed only on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for token and username on mount, only if client-side
  useEffect(() => {
    if (isClient) {
      const storedUsername = localStorage.getItem("username");
      const accessToken = localStorage.getItem("access_token");
      
      if (storedUsername && accessToken) {
        try {
          // Validate token expiration
          const payload = jwtDecode<JwtPayload>(accessToken);
          const isTokenValid = payload.exp * 1000 > Date.now();
          
          if (isTokenValid) {
            setUser(storedUsername);
            setIsAuthenticated(true);
          } else {
            // Token expired, try to refresh
            refreshTokens().catch(() => {
              setUser(null);
              setIsAuthenticated(false);
              router.push('/auth/login');
            });
          }
        } catch (error) {
          console.error("Token validation error on mount:", error);
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("username");
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [isClient, router]);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/login/', { username, password });
      
      if (response.data?.access_token && response.data?.refresh_token) {
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);
        localStorage.setItem("username", username);
        setUser(username);
        setIsAuthenticated(true);
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
      await api.post('/logout/');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state, even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("username");
      localStorage.removeItem("selected_conversation_id");
      localStorage.removeItem("user");
      localStorage.removeItem("sidebar_collapsed");
      localStorage.removeItem("theme");
      localStorage.removeItem("dark_mode");

      document.cookie = "refresh_token=; ; path=/; SameSite=Lax; Priority=Meduim;";
      document.cookie.split(";").forEach((cookie) => {
        const cookieName = cookie.split("=")[0].trim();
        document.cookie = `${cookieName}=; path=/;`;
      });
      router.push("/auth/login");
    }
  };

  const refreshTokens = async (): Promise<boolean> => {
    // If already refreshing, return the existing promise
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }
    
    setIsRefreshing(true);
    
    // Create a new promise for this refresh operation
    const promise = new Promise<boolean>(async (resolve, reject) => {
      try {
        const refreshTokenValue = localStorage.getItem("refresh_token");
        if (!refreshTokenValue) {
          throw new Error("No refresh token available");
        }

        const response = await api.post('/refresh/', { 
          refresh_token: refreshTokenValue 
        });
        
        if (response.data?.access_token) {
          localStorage.setItem("access_token", response.data.access_token);
          // Store new refresh token if provided
          if (response.data.refresh_token) {
            localStorage.setItem("refresh_token", response.data.refresh_token);
          }
          
          const storedUsername = localStorage.getItem("username");
          setUser(storedUsername);
          setIsAuthenticated(true);
          resolve(true);
        } else {
          throw new Error("Token refresh failed - incomplete response");
        }
      } catch (error) {
        console.error("Session expired or refresh failed:", error);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("username");
        reject(error);
        return false;
      } finally {
        setIsRefreshing(false);
        setRefreshPromise(null);
      }
    });
    
    setRefreshPromise(promise);
    return promise;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshTokens, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the api instance for use in other components
export { api };