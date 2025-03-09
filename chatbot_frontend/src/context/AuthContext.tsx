import { createContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { loginUser, refreshToken, logoutUser } from "@/api/auth";

interface AuthContextType {
  user: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  //const router = useRouter();

  // Ensure that the code is executed only on the client side
  useEffect(() => {
    setIsClient(true); // Indicate that we're on the client-side
  }, []);

  // Check for token on mount, only if client-side
  useEffect(() => {
    if (isClient) {
      const checkToken = async () => {
        try {
          const response = await refreshToken();
          if (response?.access_token) {
            localStorage.setItem("access_token", response.access_token);
            setUser(response.user);
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
      setUser(username);
      window.location.href = "/mychat";
    //  router.push("/mychat"); // Ensure this only runs client-side
    }
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    localStorage.removeItem("access_token");
    window.location.href = "/login"; 
   // router.push("/login"); // Ensure this only runs client-side
  };

  const refreshTokens = async () => {
    try {
      const response = await refreshToken();
      if (response?.access_token) {
        localStorage.setItem("access_token", response.access_token);
        setUser("user"); // Or store more user data
      }
    } catch (error) {
      console.error("Session expired or refresh failed.", error);
      logout(); // Logout if refreshing fails
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshTokens }}>
      {children}
    </AuthContext.Provider>
  );
};
