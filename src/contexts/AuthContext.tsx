
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'funcionario';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lista de usuários do sistema
const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin' as const
  },
  {
    id: '2',
    username: 'funcionario',
    password: 'func123',
    name: 'Funcionário',
    role: 'funcionario' as const
  }
];

// Mapeamento de permissões por role
const rolePermissions = {
  admin: [
    'dashboard',
    'clientes',
    'produtos',
    'relatorios',
    'orcamentos',
    'vendas',
    'agenda',
    'logs'
  ],
  funcionario: [
    'dashboard',
    'clientes',
    'produtos',
    'orcamentos',
    'vendas',
    'agenda'
  ]
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      const userSession = {
        id: foundUser.id,
        name: foundUser.name,
        role: foundUser.role
      };
      
      setUser(userSession);
      localStorage.setItem('user', JSON.stringify(userSession));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return rolePermissions[user.role].includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
