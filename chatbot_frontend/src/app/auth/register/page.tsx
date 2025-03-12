"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check system preference for dark mode
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDarkMode);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Account created successfully! Redirecting...");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row transition-all duration-500 ${
        isDarkMode
          ? "bg-gray-950 text-white"
          : "bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900"
      }`}
    >
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-8 order-2 md:order-1">
        <div
          className={`w-full max-w-md p-6 md:p-8 rounded-2xl backdrop-blur-lg border ${
            isDarkMode
              ? "bg-gray-900/50 border-gray-800 shadow-2xl shadow-gray-950/50"
              : "bg-white/50 border-gray-200 shadow-2xl shadow-gray-400/20"
          }`}
        >
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Register
            </h2>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-all"
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-center mb-4 font-medium">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-center mb-4 font-medium">{success}</p>
          )}

          <form onSubmit={handleRegister} className="flex flex-col space-y-4 md:space-y-6">
            <input
              type="text"
              placeholder="Username"
              className={`p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 focus:ring-blue-500 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              }`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className={`p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 focus:ring-blue-500 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className={`p-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 focus:ring-blue-500 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 active:scale-95"
            >
              Register
            </button>
          </form>

          <p className="mt-6 text-sm text-center">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className={`font-semibold hover:underline ${
                isDarkMode
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-500"
              }`}
            >
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-8 relative overflow-hidden order-1 md:order-2">
        <div className={`relative z-10 ${isDarkMode ? "opacity-90" : "opacity-95"}`}>
          {/* SVG Chatbot Illustration */}
          <svg className="w-full max-w-xs md:max-w-md" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            {/* Robot/Chatbot Head */}
            <rect x="120" y="80" width="160" height="140" rx="20" fill={isDarkMode ? "#3B82F6" : "#60A5FA"} />
            <rect x="140" y="220" width="120" height="30" rx="10" fill={isDarkMode ? "#3B82F6" : "#60A5FA"} />
            
            {/* Eyes */}
            <circle cx="160" cy="130" r="15" fill="white" />
            <circle cx="240" cy="130" r="15" fill="white" />
            <circle cx="160" cy="130" r="8" fill={isDarkMode ? "#1E3A8A" : "#1E40AF"} />
            <circle cx="240" cy="130" r="8" fill={isDarkMode ? "#1E3A8A" : "#1E40AF"} />
            
            {/* Mouth */}
            <rect x="150" y="170" width="100" height="10" rx="5" fill="white" />
            
            {/* Antennas */}
            <rect x="180" y="60" width="10" height="20" fill={isDarkMode ? "#3B82F6" : "#60A5FA"} />
            <circle cx="185" cy="50" r="10" fill={isDarkMode ? "#8B5CF6" : "#A78BFA"} />
            
            {/* Chat Bubbles */}
            <rect x="50" y="120" width="40" height="30" rx="10" fill={isDarkMode ? "#4B5563" : "#E5E7EB"} />
            <rect x="30" y="160" width="60" height="30" rx="10" fill={isDarkMode ? "#4B5563" : "#E5E7EB"} />
            <rect x="310" y="140" width="50" height="30" rx="10" fill={isDarkMode ? "#4B5563" : "#E5E7EB"} />
            <rect x="290" y="180" width="70" height="30" rx="10" fill={isDarkMode ? "#4B5563" : "#E5E7EB"} />
            
            {/* Decorative Elements */}
            <circle cx="60" cy="260" r="20" fill={isDarkMode ? "#8B5CF6" : "#A78BFA"} opacity="0.6" />
            <circle cx="330" cy="100" r="25" fill={isDarkMode ? "#EC4899" : "#F472B6"} opacity="0.6" />
            <circle cx="280" cy="270" r="15" fill={isDarkMode ? "#10B981" : "#34D399"} opacity="0.6" />
          </svg>
        </div>
        
        {/* Background pattern elements */}
        <div className="absolute inset-0 z-0">
          <div className={`absolute top-20 left-20 w-16 h-16 rounded-full ${isDarkMode ? "bg-blue-500" : "bg-blue-300"} opacity-20`}></div>
          <div className={`absolute bottom-40 right-20 w-24 h-24 rounded-full ${isDarkMode ? "bg-purple-500" : "bg-purple-300"} opacity-20`}></div>
          <div className={`absolute top-40 right-40 w-12 h-12 rounded-full ${isDarkMode ? "bg-pink-500" : "bg-pink-300"} opacity-20`}></div>
          <div className={`absolute bottom-20 left-40 w-20 h-20 rounded-full ${isDarkMode ? "bg-green-500" : "bg-green-300"} opacity-20`}></div>
        </div>
        
        {/* Additional text */}
        <div className={`absolute bottom-4 md:bottom-10 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">Join Our Community</h3>
          <p className="text-xs md:text-sm max-w-xs">Connect with our AI assistant and get your questions answered instantly</p>
        </div>
      </div>
    </div>
  );
}