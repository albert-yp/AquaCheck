import { createContext, useEffect, useState } from 'react';
import { createAuthService } from '../services/authService.js';

// eslint-disable-next-line react-refresh/only-export-components -- Context dan provider berbagi modul ini.
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [service] = useState(() => createAuthService());

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadSessionUser() {
      try {
        const user = await service.getSessionUser();

        if (isActive) {
          setCurrentUser(user);
          setError(null);
        }
      } catch (cause) {
        if (isActive) {
          setCurrentUser(null);
          setError(cause.message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadSessionUser();

    return () => {
      isActive = false;
    };
  }, [service]);

  function login(username, password) {
    try {
      const user = service.login(username, password);

      setCurrentUser(user);
      setError(null);

      return user;
    } catch (cause) {
      setError(cause.message);
      throw cause;
    }
  }

  function logout() {
    try {
      service.logout();

      setCurrentUser(null);
      setError(null);
    } catch (cause) {
      setError(cause.message);
      throw cause;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
