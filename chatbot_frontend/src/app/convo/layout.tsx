
import { AuthProvider } from "@/context/AuthContext"; // Adjust the path accordingly


export default function MainLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  return (
        <div>
        <AuthProvider>
        {children}
        </AuthProvider>
        </div>
    
   
  );
}
