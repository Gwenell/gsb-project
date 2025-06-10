import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../services/api';

// Interface User mise à jour avec tous les champs nécessaires
export interface User {
  id: string;
  nom: string;
  prenom: string;
  username?: string;
  adresse?: string;
  cp?: string;
  ville?: string;
  dateEmbauche?: string;
  type_utilisateur: 'visiteur' | 'delegue' | 'responsable' | 'directeur' | 'comptable' | 'admin' | 'administrateur';
  idRegion?: string;
  email?: string;
  login?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isVisiteur: () => boolean;
  isDirecteur: () => boolean;
  isComptable: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        try {
          // Verify token is valid by getting current user
          const response = await getCurrentUser();
          if (response.status === 'success') {
            setUser(response.data);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Error checking authentication:', err);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    
    checkUser();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiLogin(username, password);
      
      if (response.status === 'error') {
        setError(response.message || 'Erreur de connexion');
        return;
      }
      
      setUser(response.data);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiLogout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to check user roles
  const isVisiteur = () => {
    return user?.type_utilisateur === 'visiteur';
  };

  const isDirecteur = () => {
    return user?.type_utilisateur === 'directeur';
  };

  const isComptable = () => {
    return user?.type_utilisateur === 'comptable';
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    isVisiteur,
    isDirecteur,
    isComptable
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 