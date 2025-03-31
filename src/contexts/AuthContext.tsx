import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout } from '../services/api';

// Interface User mise à jour avec tous les champs nécessaires
export interface User {
  id: string;
  nom: string;
  prenom: string;
  login: string;
  email: string;
  adresse: string;
  cp: string;
  ville: string;
  dateEmbauche: string;
  type_utilisateur: 'admin' | 'administrateur' | 'visiteur';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté au chargement initial
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('user');
      }
    }
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
      
      // Utilisateur connecté avec succès
      const userData: User = {
        id: response.data.id,
        nom: response.data.nom,
        prenom: response.data.prenom,
        login: response.data.login || username,
        email: response.data.email || '',
        adresse: response.data.adresse || '',
        cp: response.data.cp || '',
        ville: response.data.ville || '',
        dateEmbauche: response.data.dateEmbauche || '',
        type_utilisateur: response.data.type_utilisateur || 'visiteur'
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion');
      throw err; // Propager l'erreur pour que le composant Login puisse la gérer
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiLogout();
      setUser(null);
      localStorage.removeItem('user');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 