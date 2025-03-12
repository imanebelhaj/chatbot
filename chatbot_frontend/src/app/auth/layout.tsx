"use client";
import React from 'react';
import { AuthProvider } from "@/context/AuthContext";  

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <div>
        <AuthProvider>
              {children}
        </AuthProvider>
    </div>
  );
}
