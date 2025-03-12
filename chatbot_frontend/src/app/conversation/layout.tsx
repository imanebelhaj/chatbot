
import { AuthProvider } from "@/context/AuthContext"; // Adjust the path accordingly
import ProtectedRoute from "@/components/ProtectedRoute";


export default function MainLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  return (
    <div>
    <AuthProvider>
      <ProtectedRoute>
          {children}
      </ProtectedRoute>
    </AuthProvider>
  </div>
    
   
  );
}
