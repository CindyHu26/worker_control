"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LayoutContextType {
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
    // Initialize from localStorage if available, default to false
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const storedState = localStorage.getItem('sidebar_collapsed');
        if (storedState) {
            setIsSidebarCollapsed(JSON.parse(storedState));
        }
    }, []);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
            return newState;
        });
    };

    const setSidebarCollapsed = (collapsed: boolean) => {
        setIsSidebarCollapsed(collapsed);
        localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
    };

    return (
        <LayoutContext.Provider value={{ isSidebarCollapsed, toggleSidebar, setSidebarCollapsed }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}
