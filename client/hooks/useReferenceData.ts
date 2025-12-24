import { useState, useEffect } from 'react';

export interface EmployerCategory {
    id: string;
    code: string;
    nameZh: string;
    nameEn: string | null;
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

export interface IndustryCode {
    id: string;
    code: string;
    nameZh: string;
    nameEn: string | null;
    sortOrder: number;
    isActive: boolean;
}

export interface DomesticAgency {
    id: string;
    code: string;
    agencyNameZh: string;
    agencyNameEn: string | null;
    agencyNameShort: string | null;
    phone: string | null;
    email: string | null;
    sortOrder: number;
    isActive: boolean;
}

export function useEmployerCategories() {
    const [categories, setCategories] = useState<EmployerCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/reference/employer-categories', { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error(`Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setCategories(data);
                } else {
                    setCategories([]);
                    setError('Invalid data format');
                }
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setCategories([]);
                setLoading(false);
            });
    }, []);

    return { categories, loading, error };
}

export function useApplicationTypes() {
    const [types, setTypes] = useState<ApplicationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/reference/application-types', { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error(`Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setTypes(data);
                } else {
                    setTypes([]);
                    setError('Invalid data format');
                }
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setTypes([]);
                setLoading(false);
            });
    }, []);

    return { types, loading, error };
}

export function useIndustryCodes() {
    const [codes, setCodes] = useState<IndustryCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/reference/industry-codes', { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error(`Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setCodes(data);
                } else {
                    setCodes([]);
                    setError('Invalid data format');
                }
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setCodes([]);
                setLoading(false);
            });
    }, []);

    return { codes, loading, error };
}

export function useDomesticAgencies() {
    const [agencies, setAgencies] = useState<DomesticAgency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/reference/domestic-agencies', { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error(`Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setAgencies(data);
                } else {
                    setAgencies([]);
                    setError('Invalid data format');
                }
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setAgencies([]);
                setLoading(false);
            });
    }, []);

    return { agencies, loading, error };
}
