import { api } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const loginUser = async (username: string, password: string) => {
  try {
    const response = await api.post('/login/', {
      username,
      password
    });
    return response.data;
  } catch (error) {
    console.error("Login API error:", error);
    throw error;
  }
};

export const refreshToken = async (refreshToken: string) => {
  try {
    const response = await api.post('/refresh/', {
      refresh_token: refreshToken
    });
    return response.data;
  } catch (error) {
    console.error("Refresh token API error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await api.post('/logout/');
  } catch (error) {
    console.error("Logout API error:", error);
    throw error;
  }
};