import { Providers } from "../../providers";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from '@/context/ThemeContext';


export default function MainLayout2({ children }: Readonly<{children: React.ReactNode;}>) {
  return (
        <div>
          <AuthProvider>
            <ProtectedRoute>
            <ThemeProvider>
              <Providers>{children}</Providers>
              </ThemeProvider>
            </ProtectedRoute>
          </AuthProvider>
        </div>
      
    
  );
}
