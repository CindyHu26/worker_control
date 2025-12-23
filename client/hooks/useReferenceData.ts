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
        fetch('/api/reference/employer-categories')
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
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
        fetch('/api/reference/application-types')
            .then(res => res.json())
            .then(data => {
                setTypes(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
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
        fetch('/api/reference/industry-codes')
            .then(res => res.json())
            .then(data => {
                setCodes(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
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
        fetch('/api/reference/domestic-agencies')
            .then(res => res.json())
            .then(data => {
                setAgencies(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return { agencies, loading, error };
}
