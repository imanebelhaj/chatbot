"use client";
import React, { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/";

interface UserProfile {
  username: string;
  email: string;
  date_joined: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the JWT token from localStorage
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const userData = await response.json();
      setProfile(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching your profile");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Format the date in a more readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
  };

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
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchUserProfile} 
              className="mt-2 text-blue-500 underline"
            >
              Try again
            </button>
          </div>
        ) : profile ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600"><strong>Username:</strong></p>
              <p className="text-lg font-medium text-gray-900">{profile.username}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600"><strong>Email:</strong></p>
              <p className="text-lg font-medium text-gray-900">{profile.email}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600"><strong>Account Created:</strong></p>
              <p className="text-lg font-medium text-gray-900">
                {formatDate(profile.date_joined)}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-gray-500">
            No profile data available
          </div>
        )}

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