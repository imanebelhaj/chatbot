"use client";

import { useState } from "react";
import { ChevronDown, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserProfileModal from "@/components/UserProfileModal";

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { logout, user } = useAuth();

  const handleViewProfile = () => {
    setIsModalOpen(true);
    setDropdownOpen(false);
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <nav className="flex items-center justify-between bg-white text-gray-900 shadow-md px-6 py-3">
        {/* Left - Logo */}
        <div className="flex items-center gap-2">
          {/* <Image src="/logo.svg" alt="Logo" width={32} height={32} /> */}
          <h1 className="text-xl font-semibold"></h1>
        </div>

        {/* Right - Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <User size={16} /> {/* Add the User icon here */}
            <ChevronDown size={16} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded-md border border-gray-200 py-2 shadow-lg">
              <button
                onClick={handleViewProfile}
                className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <User size={16} className="mr-2" />
                View Profile
              </button>
              <button
                onClick={logout}
                className="flex items-center w-full px-4 py-2 text-red-500 hover:bg-gray-100"
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
        // user={{
        //   username: username || "Unknown",
        //  // email: user?.email || "unknown@example.com",
        //   // conversationsCount: 5, // Replace with actual data
        //  // createdAt: user?.createdAt || new Date().toISOString(),
        // }}
      />
    </>
  );
}