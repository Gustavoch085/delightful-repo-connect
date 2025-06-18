
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
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lista de usuários do sistema
const users = [
  {
    id: '1',
    username: 'admin',
    password: '#crm1221@',
    name: 'Administrador',
    role: 'admin' as const
  },
  {
    id: '2',
    username: 'funcionario',
    password: 'func123',
    name: 'Funcionário',
    role: 'funcionario' as const
  },
  {
    id: '3',
    username: 'jenifferleite',
    password: 'agencia3149',
    name: 'Jenniffer Leite',
    role: 'funcionario' as const
  },
  {
    id: '4',
    username: 'marcusvinicius',
    password: 'agencia3149',
    name: 'Marcus Vinicius',
    role: 'funcionario' as const
  },
  {
    id: '5',
    username: 'staff',
    password: '#crm22f11@',
    name: 'Staff',
    role: 'admin' as const
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
    
    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      const userSession = {
        id: foundUser.id,
        name: foundUser.name,
        role: foundUser.role
      };
      
      setUser(userSession);
      localStorage.setItem('user', JSON.stringify(userSession));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
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

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      hasPermission, 
      isLoading, 
      isAuthenticated 
    }}>
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
