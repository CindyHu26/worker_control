
import useSWR from 'swr';
import { apiGet } from '@/lib/api';

export interface Employee {
    id: string;
    code: string;
    fullName: string;
    departmentCode?: string;
    jobTitle?: string;
    isSales?: boolean;
    isCustomerService?: boolean;
    isAdmin?: boolean;
    isAccounting?: boolean;
}

export function useEmployees() {
    // Fetch all employees or filter by role?
    // For now, fetch all and filter in frontend to avoid multiple requests
    // Or backend support filtering?
    // Backend `getEmployees` takes search, pageSize. 
    // Let's just fetch first page with large size or search endpoint? 
    // Backend currently doesn't support filtering by role via query params easily without modifying it.
    // For dropdowns, we normally need "All Active Employees".
    // I'll assume page size 100 covers most for now, or use a specific "list" endpoint if exists (doesn't seem to).

    // Using existing endpoint with large page size
    const { data, error, isLoading } = useSWR<{ data: Employee[] }>('/api/employees?pageSize=100', apiGet);

    const employees = data?.data || [];

    return {
        employees,
        salesAgents: employees.filter(e => e.isSales),
        serviceStaff: employees.filter(e => e.isCustomerService),
        adminStaff: employees.filter(e => e.isAdmin),
        accountants: employees.filter(e => e.isAccounting),
        isLoading,
        error
    };
}
