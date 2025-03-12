"use client";
import React from 'react';
import { AuthProvider } from "@/context/AuthContext";  
import { ThemeProvider } from '@/context/ThemeContext';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <div>
        <AuthProvider>
          <ThemeProvider>
              {children}
          </ThemeProvider>
        </AuthProvider>
    </div>
  );
}
