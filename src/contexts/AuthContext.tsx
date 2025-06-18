
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
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

// Credenciais e permissões por cargo
const USERS = {
  admin: {
    password: '#crm1221@',
    userData: {
      id: '1',
      email: 'admin@fortal.com',
      name: 'Administrador',
      role: 'admin' as const,
      permissions: ['dashboard', 'clientes', 'produtos', 'relatorios', 'orcamentos', 'agenda', 'logs']
    }
  },
  staff: {
    password: '#crm22f11@',
    userData: {
      id: '2',
      email: 'staff@fortal.com',
      name: 'Funcionário',
      role: 'staff' as const,
      permissions: ['dashboard', 'clientes', 'produtos', 'orcamentos', 'agenda']
    }
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simular delay de login
    return new Promise((resolve) => {
      setTimeout(() => {
        // Validar credenciais
        const userConfig = USERS[username as keyof typeof USERS];
        if (userConfig && password === userConfig.password) {
          setUser(userConfig.userData);
          localStorage.setItem('user', JSON.stringify(userConfig.userData));
          setIsLoading(false);
          resolve(true);
        } else {
          setIsLoading(false);
          resolve(false);
        }
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
