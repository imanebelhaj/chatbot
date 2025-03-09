const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


export const loginUser = async (username: string, password: string) => {
  const res = await fetch(`${API_URL}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include", // Allow cookies for refresh token
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return await res.json();
};

export const refreshToken = async () => {
  const res = await fetch(`${API_URL}/refresh/`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Session expired");
  return await res.json();
};

export const logoutUser = async () => {
  await fetch(`${API_URL}/logout/`, {
    method: "POST",
    credentials: "include",
  });
};
