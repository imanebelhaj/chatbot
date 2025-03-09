"use client";
import React from 'react';
import { AuthProvider } from "@/context/AuthContext";  

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html>
      <body>
        <AuthProvider>
              {children}
        </AuthProvider>
      </body>
    </html>
  );
}
