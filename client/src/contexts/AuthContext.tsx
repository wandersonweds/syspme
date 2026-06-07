import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface LocalUser {
  id: number;
  username: string;
  nome: string;
  role: string;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  logout: () => void;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refetch: async () => {},
});

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const { data, isLoading, refetch } = trpc.localAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.localAuth.logout.useMutation({
    onSuccess: async () => {
      await utils.localAuth.me.invalidate();
      await refetch();
      navigate("/login");
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: data ?? null,
        loading: isLoading,
        logout: () => logoutMutation.mutate(),
        refetch: async () => {
          await utils.localAuth.me.invalidate();
          await refetch();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useLocalAuth() {
  return useContext(AuthContext);
}
