"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-indigo-200 to-blue-300">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg w-80 space-y-6"
      >
        <h2 className="text-3xl font-semibold text-black">Log In</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-all"
        >
          Log In
        </button>

        <div className="text-center text-gray-500">
          <p className="mt-4">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-indigo-600 hover:text-indigo-700"
            >
              Register now
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
