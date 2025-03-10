"use client";
import React from "react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  // user: {
  //   username: string;
  //   email: string;
  //   conversationsCount: number;
  //   createdAt: string;
  // };
}

// const username =  localStorage.getItem("username");

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 max-w-full mx-4 border border-gray-200">
        {/* Modal Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            User Profile
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage your account details</p>
        </div>

        {/* User Information */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600"><strong>Username:</strong></p>
            {/* <p className="text-lg font-medium text-gray-900">{username}</p> */}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600"><strong>Email:</strong></p>
            <p className="text-lg font-medium text-gray-900"></p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600"><strong>Account Created:</strong></p>
            <p className="text-lg font-medium text-gray-900">
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2.5 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;