import { createContext, useContext, useEffect, useState } from "react";

import { getProfile, loginUser, registerUser } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    const data = await loginUser(credentials);

    localStorage.setItem("supportai_token", data.token);

    setUser(data.user);

    return data;
  };

  const register = async (userData) => {
    const data = await registerUser(userData);

    localStorage.setItem("supportai_token", data.token);

    setUser(data.user);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("supportai_token");
    setUser(null);
  };

  useEffect(() => {
    const restoreUser = async () => {
      const token = localStorage.getItem("supportai_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getProfile();

        setUser(data.user);
      } catch (error) {
        console.error("Failed to restore user:", error);

        localStorage.removeItem("supportai_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
