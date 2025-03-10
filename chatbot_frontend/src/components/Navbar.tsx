"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, User, LogOut } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between bg-gray-900 text-gray-100 shadow-md px-6 py-3">
      {/* Left - Logo */}
      <div className="flex items-center gap-2">
        {/* <Image src="/logo.svg" alt="Logo" width={32} height={32} /> */}
        <h1 className="text-xl font-semibold">Chatbot</h1>
      </div>

      {/* Right - Profile Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
        >
          {/* <Image
            src="/profile.png"
            alt="Profile"
            width={32}
            height={32}
            className="rounded-full"
          /> */}
          <ChevronDown size={16} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-gray-800 text-gray-100 rounded-md border py-2">
            <button className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700">
              <User size={16} className="mr-2" />
              View Profile
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center w-full px-4 py-2 text-red-500 hover:bg-gray-700"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
