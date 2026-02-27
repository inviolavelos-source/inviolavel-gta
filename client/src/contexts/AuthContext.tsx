import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

export type FuncionarioSession = {
  id: number;
  nome: string;
  email: string;
  perfil: "ADMIN" | "FUNCIONARIO";
} | null;

type AuthContextType = {
  funcionario: FuncionarioSession;
  loading: boolean;
  isAdmin: boolean;
  isFuncionario: boolean;
  isAuthenticated: boolean;
  refetch: () => void;
};

const AuthContext = createContext<AuthContextType>({
  funcionario: null,
  loading: true,
  isAdmin: false,
  isFuncionario: false,
  isAuthenticated: false,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = trpc.inviolavel.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const funcionario = data ?? null;
  const isAuthenticated = !!funcionario;
  const isAdmin = funcionario?.perfil === "ADMIN";
  const isFuncionario = funcionario?.perfil === "FUNCIONARIO";

  return (
    <AuthContext.Provider value={{ funcionario, loading: isLoading, isAdmin, isFuncionario, isAuthenticated, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
