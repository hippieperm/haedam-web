"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    email: string;
    name: string;
    nickname: string;
    role: string;
    is_verified?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setUser(null);
            localStorage.removeItem("user");
            router.push("/");
        }
    };

    const checkAuth = async () => {
        try {
            const response = await fetch("/api/auth/me");
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
            } else {
                setUser(null);
                localStorage.removeItem("user");
            }
        } catch (error) {
            console.error("Auth check error:", error);
            setUser(null);
            localStorage.removeItem("user");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 클라이언트 사이드에서만 실행
        if (typeof window !== "undefined") {
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
