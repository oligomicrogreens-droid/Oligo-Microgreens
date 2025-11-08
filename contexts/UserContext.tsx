import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import type { User } from '../types';

interface UserContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'microgreen-app-currentUser';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = sessionStorage.getItem(USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      return null;
    }
  });

  const login = useCallback((user: User) => {
    try {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to save user to session storage", error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(USER_STORAGE_KEY);
      setCurrentUser(null);
    } catch (error) {
      console.error("Failed to remove user from session storage", error);
    }
  }, []);

  const value = useMemo(() => ({ currentUser, login, logout }), [currentUser, login, logout]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
