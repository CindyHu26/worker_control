import { useCallback } from 'react';

export interface EmployerCategory {
    id: string;
    code: string;
    nameZh: string;
    nameEn: string | null;
    type: 'BUSINESS' | 'INDIVIDUAL' | 'INSTITUTION';
    iconName: string | null;
    color: string | null;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
}

export interface ApplicationType {
    id: string;
    code: string;
    nameZh: string;
    nameEn: string | null;
    sortOrder: number;
    isActive: boolean;
}

export function useSystemConfig() {
    const getCategories = useCallback(async (): Promise<EmployerCategory[]> => {
        try {
            // Use relative URL - Next.js rewrites will proxy to backend
            const res = await fetch('/api/application-categories', {
                credentials: 'include'
            });
            if (!res.ok) {
                console.error('Failed to fetch categories:', res.status, res.statusText);
                return [];
            }
            const result = await res.json();
            // Handle both { data: [...] } and raw array formats
            const data = Array.isArray(result) ? result : (result.data || []);
            console.log('useSystemConfig: getCategories returned', data.length, 'items');
            return data;
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            return [];
        }
    }, []);

    const getApplicationTypes = useCallback(async (): Promise<ApplicationType[]> => {
        try {
            // Use relative URL - Next.js rewrites will proxy to backend
            const res = await fetch('/api/work-titles', {
                credentials: 'include'
            });
            if (!res.ok) {
                console.error('Failed to fetch work titles:', res.status, res.statusText);
                return [];
            }
            const result = await res.json();
            // Handle both { data: [...] } and raw array formats
            const rawData = Array.isArray(result) ? result : (result.data || []);

            // Work titles can serve as application types
            const data = rawData.map((wt: any) => ({
                id: wt.id,
                code: wt.code,
                nameZh: wt.nameZh,
                nameEn: wt.nameEn,
                sortOrder: wt.sortOrder || 0,
                isActive: wt.isActive !== false
            }));
            console.log('useSystemConfig: getApplicationTypes returned', data.length, 'items');
            return data;
        } catch (err) {
            console.error('Failed to fetch application types:', err);
            return [];
        }
    }, []);

    return { getCategories, getApplicationTypes };
}
