import { createContext, useContext, useEffect, useState } from "react";

import { getProfile, loginUser, registerUser } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   */
  const login = async (credentials) => {
    const data = await loginUser(credentials);

    if (!data?.token || !data?.user) {
      throw new Error("Invalid login response.");
    }

    localStorage.setItem("supportai_token", data.token);

    setUser(data.user);

    return data;
  };

  /*
   * =========================================================
   * REGISTER
   * =========================================================
   */
  const register = async (userData) => {
    const data = await registerUser(userData);

    if (!data?.token || !data?.user) {
      throw new Error("Invalid registration response.");
    }

    localStorage.setItem("supportai_token", data.token);

    setUser(data.user);

    return data;
  };

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */
  const logout = () => {
    localStorage.removeItem("supportai_token");
    setUser(null);
  };

  /*
   * =========================================================
   * RESTORE USER
   * =========================================================
   */
  useEffect(() => {
    let mounted = true;

    const restoreUser = async () => {
      const token = localStorage.getItem("supportai_token");

      if (!token) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      try {
        const data = await getProfile();

        if (mounted) {
          setUser(data?.user || null);
        }
      } catch (error) {
        console.error(
          "Failed to restore user:",
          error?.response?.data || error.message,
        );

        localStorage.removeItem("supportai_token");

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    restoreUser();

    return () => {
      mounted = false;
    };
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

/*
 * =========================================================
 * USE AUTH
 * =========================================================
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
