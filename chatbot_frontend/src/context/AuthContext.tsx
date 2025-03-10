"use client";
import { createContext, useState, useEffect, ReactNode } from "react";
import { loginUser, refreshToken, logoutUser } from "@/api/auth";

interface AuthContextType {
  user: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  isSessionExpired: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Ensure that the code is executed only on the client side
  useEffect(() => {
    setIsClient(true); // Indicate that we're on the client-side
  }, []);

  // Check for token and username on mount, only if client-side
  useEffect(() => {
    if (isClient) {
      const checkToken = async () => {
        try {
          const response = await refreshToken();
          if (response?.access_token) {
            localStorage.setItem("access_token", response.access_token);
            const storedUsername = localStorage.getItem("username");
            setUser(storedUsername);
          }
        } catch {
          setUser(null);
        }
      };
      checkToken();
    }
  }, [isClient]);

  const login = async (username: string, password: string) => {
    const response = await loginUser(username, password);
    if (response?.access_token) {
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("username", username);
      setUser(username);
      window.location.href = "/conversation/";
    }
  };

  const logout = async () => {
    await logoutUser(); // Call your API to log out
    setUser(null); // Reset user state
    localStorage.removeItem("access_token"); // Clear the token from localStorage
    localStorage.removeItem("username"); // Clear the username from localStorage
    window.location.href = "/auth/login";
  };

  const refreshTokens = async () => {
    try {
      const response = await refreshToken();
      if (response?.access_token) {
        localStorage.setItem("access_token", response.access_token);
        const storedUsername = localStorage.getItem("username");
        setUser(storedUsername);
      }
    } catch (error) {
      console.error("Session expired or refresh failed.", error);
      setIsSessionExpired(true); // Show session expired popup
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshTokens, isSessionExpired }}>
      {children}
      {isSessionExpired && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-semibold mb-4">Session Expired</h2>
            <p className="mb-4">Please log in again.</p>
            <button
              onClick={logout}
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};