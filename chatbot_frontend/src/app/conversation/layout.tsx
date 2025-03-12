import { AuthProvider } from "@/context/AuthContext"; // Adjust the path accordingly
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from '@/context/ThemeContext';


export default function MainLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  return (
    <div>
    <AuthProvider>
      <ProtectedRoute>
        <ThemeProvider>
          {children}
          </ThemeProvider>
      </ProtectedRoute>
    </AuthProvider>
  </div>
    
  );
}
