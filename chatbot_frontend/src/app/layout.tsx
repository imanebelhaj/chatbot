import type { Metadata } from "next";
import "./globals.css";
import React from 'react';


export const metadata: Metadata = {
  title: "Chatbot",
  description: "AI Chatbot : Next.js + Django :)",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  return (
    <html>
    <body>
        {children}
    </body>
    </html>
    
  );
}
