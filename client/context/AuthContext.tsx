"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: string;
    username: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initAuth = async () => {
            const token = Cookies.get('token');
            const userData = Cookies.get('user');

            if (token && userData) {
                setUser(JSON.parse(userData));
            } else {
                // Redirect to login if not on public page
                if (pathname !== '/login') {
                    router.push('/login');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, [pathname, router]);

    const login = (token: string, user: User) => {
        Cookies.set('token', token, { expires: 1 }); // 1 day
        Cookies.set('user', JSON.stringify(user), { expires: 1 });
        setUser(user);
        router.push('/');
    };

    const logout = () => {
        Cookies.remove('token');
        Cookies.remove('user');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
