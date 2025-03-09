import { ReactNode } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { SessionProvider } from 'next-auth/react';


export default function MainLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  return (
    <html>
      <body>
      
        {/* <SessionProvider> */}
        {children}
        {/* </SessionProvider> */}
     
      </body>
    </html>
    
  );
}
