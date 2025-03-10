"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    // Check system preference for dark mode
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDarkMode);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div
      className={`min-h-screen flex transition-all duration-500 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gradient-to-r from-indigo-200 to-blue-300 text-gray-900"
      }`}
    >
      {/* Left side - Form */}
      <div className="w-1/2 flex justify-center items-center p-8">
        <div
          className={`p-8 rounded-xl shadow-2xl w-full max-w-md space-y-6 transition-all duration-500 ${
            isDarkMode ? "bg-gray-800 shadow-gray-950/50" : "bg-white shadow-gray-400/20"
          }`}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">Log In</h2>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-all"
            >
              {isDarkMode ? "🌙" : "☀️"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition-all ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 focus:ring-indigo-500 text-white"
                  : "bg-white border-gray-300 focus:ring-indigo-500 text-gray-900"
              }`}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition-all ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 focus:ring-indigo-500 text-white"
                  : "bg-white border-gray-300 focus:ring-indigo-500 text-gray-900"
              }`}
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
            >
              Log In
            </button>
          </form>

          <div className="text-center">
            <p className="mt-4">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className={`font-semibold hover:underline ${
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                }`}
              >
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="w-1/2 flex justify-center items-center p-8 relative overflow-hidden">
        <div className={`relative z-10 ${isDarkMode ? "opacity-90" : "opacity-95"}`}>
          {/* Lock and Key Illustration */}
          <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            {/* Lock Body */}
            <rect x="140" y="170" width="120" height="140" rx="15" fill={isDarkMode ? "#4F46E5" : "#6366F1"} />
            
            {/* Lock Shackle */}
            <path d="M160 170 L160 130 Q160 90 200 90 Q240 90 240 130 L240 170" 
                  stroke={isDarkMode ? "#818CF8" : "#A5B4FC"} 
                  strokeWidth="20" 
                  fill="none" 
                  strokeLinecap="round" />
            
            {/* Keyhole */}
            <circle cx="200" cy="230" r="20" fill={isDarkMode ? "#1E1B4B" : "#312E81"} />
            <rect x="195" y="230" width="10" height="30" fill={isDarkMode ? "#1E1B4B" : "#312E81"} />
            
            {/* Key */}
            <g transform="translate(200, 200) rotate(45)">
              <rect x="60" y="-5" width="70" height="10" rx="5" fill={isDarkMode ? "#C7D2FE" : "#818CF8"} />
              <circle cx="140" cy="0" r="15" fill={isDarkMode ? "#C7D2FE" : "#818CF8"} />
              <rect x="140" y="-8" width="5" height="16" fill={isDarkMode ? "#1E1B4B" : "#312E81"} />
              <rect x="150" y="-8" width="5" height="16" fill={isDarkMode ? "#1E1B4B" : "#312E81"} />
            </g>
            
            {/* Visual Elements */}
            <circle cx="120" cy="100" r="15" fill={isDarkMode ? "#8B5CF6" : "#A78BFA"} opacity="0.6" />
            <circle cx="280" cy="120" r="20" fill={isDarkMode ? "#EC4899" : "#F472B6"} opacity="0.6" />
            <circle cx="100" cy="290" r="25" fill={isDarkMode ? "#10B981" : "#34D399"} opacity="0.6" />
            <circle cx="290" cy="280" r="18" fill={isDarkMode ? "#3B82F6" : "#60A5FA"} opacity="0.6" />
            
            {/* Shield Icon */}
            <path d="M320 180 L350 180 L350 210 L335 230 L320 210 Z" 
                  fill={isDarkMode ? "#6366F1" : "#818CF8"} 
                  stroke={isDarkMode ? "#C7D2FE" : "#E0E7FF"} 
                  strokeWidth="2" />
            <path d="M335 190 L335 205 L340 200 L335 195 L330 200 Z" 
                  fill={isDarkMode ? "#C7D2FE" : "#E0E7FF"} />
            
            {/* Check Icon */}
            <circle cx="80" cy="190" r="20" fill={isDarkMode ? "#10B981" : "#34D399"} />
            <path d="M70 190 L80 200 L90 180" 
                  stroke="white" 
                  strokeWidth="4" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" />
          </svg>
        </div>
        
        {/* Background pattern elements */}
        <div className="absolute inset-0 z-0">
          <div className={`absolute top-20 left-20 w-16 h-16 rounded-full ${isDarkMode ? "bg-indigo-500" : "bg-indigo-300"} opacity-20`}></div>
          <div className={`absolute bottom-40 right-20 w-24 h-24 rounded-full ${isDarkMode ? "bg-blue-500" : "bg-blue-300"} opacity-20`}></div>
          <div className={`absolute top-40 right-40 w-12 h-12 rounded-full ${isDarkMode ? "bg-violet-500" : "bg-violet-300"} opacity-20`}></div>
          <div className={`absolute bottom-20 left-40 w-20 h-20 rounded-full ${isDarkMode ? "bg-purple-500" : "bg-purple-300"} opacity-20`}></div>
        </div>
        
        {/* Additional text */}
        <div className={`absolute bottom-10 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          <h3 className="text-xl font-bold mb-2">Welcome Back</h3>
          <p className="text-sm max-w-xs">Securely access your account and continue your journey with us</p>
        </div>
      </div>
    </div>
  );
};

export default Login;