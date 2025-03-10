import { ReactNode } from "react";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import { SessionProvider } from 'next-auth/react';
import { Providers } from "../../providers";
import { AuthProvider } from "@/context/AuthContext";


export default function MainLayout2({ children }: Readonly<{children: React.ReactNode;}>) {
  return (
  
        <div>
        <AuthProvider>
        <Providers>{children}</Providers>
        </AuthProvider>
        </div>
      
    
  );
}
