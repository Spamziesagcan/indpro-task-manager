import * as React from "react";
import { AUTH_TOKEN_CHANGED_EVENT, getAuthToken, setAuthToken, clearAuthToken } from "@/lib/auth-token";

export type AuthState = {
  token: string | null;
  isAuthenticated: boolean;
};

export function useAuth() {
  const [auth, setAuth] = React.useState<AuthState>({
    token: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const syncAuthFromStorage = () => {
      const token = getAuthToken();
      setAuth({
        token: token ?? null,
        isAuthenticated: !!token,
      });
    };

    syncAuthFromStorage();
    setIsLoading(false);

    window.addEventListener("storage", syncAuthFromStorage);
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, syncAuthFromStorage);

    return () => {
      window.removeEventListener("storage", syncAuthFromStorage);
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, syncAuthFromStorage);
    };
  }, []);

  const login = (token: string) => {
    setAuthToken(token);
    setAuth({
      token,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    clearAuthToken();
    setAuth({
      token: null,
      isAuthenticated: false,
    });
  };

  return {
    ...auth,
    isLoading,
    login,
    logout,
  };
}
