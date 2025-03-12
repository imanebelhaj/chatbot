"use client";

import { useState } from "react";
import { ChevronDown, User, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserProfileModal from "@/components/UserProfileModal";
import { useTheme } from "@/context/ThemeContext"; // Import from wherever you place the ThemeContext file

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme(); // Use the theme context
  const { logout } = useAuth();

  const handleViewProfile = () => {
    setIsModalOpen(true);
    setDropdownOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <>
      <nav className={`flex items-center justify-between ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-md px-6 py-3`}>
        <div className="relative">
          <button
            onClick={toggleTheme}
            className="gap-2 text-sm font-medium hover:text-gray-900 fixed right-20 top-3"
          >
            {isDarkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-gray-700" />}
          </button>
        </div>
                
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'bg-gray-800 ' : 'bg-white text-gray-900'} ${isDarkMode ? 'border-gray-700 ' : 'border-gray-200 text-gray-900'}`}
          >
            <User size={16} /> 
            <ChevronDown size={16} />
          </button>
          
          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className={`absolute right-0 mt-2 w-40 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-md border ${isDarkMode ? 'border-gray-700 ' : 'border-gray-200 text-white'} py-2 shadow-lg`}>
              <button
                onClick={handleViewProfile}
                className={`flex items-center w-full px-4 py-2 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
              >
                <User size={16} className="mr-2" />
                View Profile
              </button>
              <button
                onClick={logout}
                className={`flex items-center w-full px-4 py-2 text-red-500 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
      
      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}