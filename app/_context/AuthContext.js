
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from "next/navigation";

// Crie o contexto com um objeto padrão
const AuthContext = createContext({
  user: null,
  token: null,
  role: null,
  permissions: null,
  loginUser: async () => {},
  logoutUser: () => {},
});

// Provider que envolverá toda a aplicação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const router = useRouter();

  // Ao iniciar, carrega as informações armazenadas (ex.: no localStorage)
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user_infos');
    const storedRole = localStorage.getItem('role');
    const storedPermissions = localStorage.getItem('permissions');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
      setPermissions(storedPermissions ? JSON.parse(storedPermissions) : null);
    }
  }, []);

  // Função para efetuar login e armazenar os dados
  const loginUser = async (loginData) => {
    localStorage.setItem('token', loginData.token);
    localStorage.setItem('user_infos', JSON.stringify(loginData.user_infos));
    localStorage.setItem('role', loginData.role);
    localStorage.setItem('permissions', JSON.stringify(loginData.permissions));
    setToken(loginData.token);
    setUser(loginData.user_infos);
    setRole(loginData.role);
    setPermissions(loginData.permissions);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_infos');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
    setToken(null);
    setUser(null);
    setRole(null);
    setPermissions(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, role, permissions, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para acessar os dados de autenticação em qualquer componente
export const useAuth = () => useContext(AuthContext);
