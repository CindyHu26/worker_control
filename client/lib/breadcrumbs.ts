/**
 * Breadcrumb utility for generating breadcrumb paths
 */

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

/**
 * Generate breadcrumb trail for Worker pages
 */
export const getWorkerBreadcrumbs = (workerId?: string, workerName?: string): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
        { label: '首頁', href: '/' },
        { label: '外勞管理', href: '/workers' }
    ];

    if (workerId && workerName) {
        breadcrumbs.push({ label: workerName });
    } else if (workerId) {
        breadcrumbs.push({ label: '外勞詳情' });
    }

    return breadcrumbs;
};

/**
 * Generate breadcrumb trail for Employer pages
 */
export const getEmployerBreadcrumbs = (employerId?: string, employerName?: string): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
        { label: '首頁', href: '/' },
        { label: '雇主管理', href: '/employers' }
    ];

    if (employerId && employerName) {
        breadcrumbs.push({ label: employerName });
    } else if (employerId) {
        breadcrumbs.push({ label: '雇主詳情' });
    }

    return breadcrumbs;
};

/**
 * Generate breadcrumb trail for Lead pages
 */
export const getLeadBreadcrumbs = (leadId?: string, leadName?: string): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
        { label: '首頁', href: '/' },
        { label: 'CRM', href: '/crm' },
        { label: '潛在客戶', href: '/crm/leads' }
    ];

    if (leadId && leadName) {
        breadcrumbs.push({ label: leadName });
    } else if (leadId) {
        breadcrumbs.push({ label: '客戶詳情' });
    }

    return breadcrumbs;
};

/**
 * Generate breadcrumb trail for Deployment pages
 */
export const getDeploymentBreadcrumbs = (deploymentId?: string): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
        { label: '首頁', href: '/' },
        { label: '派遣管理', href: '/deployments' }
    ];

    if (deploymentId) {
        breadcrumbs.push({ label: '派遣詳情' });
    }

    return breadcrumbs;
};

/**
 * Generate breadcrumb trail for Dormitory pages
 */
export const getDormitoryBreadcrumbs = (dormitoryId?: string, dormitoryName?: string): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
        { label: '首頁', href: '/' },
        { label: '宿舍管理', href: '/dormitories' }
    ];

    if (dormitoryId && dormitoryName) {
        breadcrumbs.push({ label: dormitoryName });
    } else if (dormitoryId) {
        breadcrumbs.push({ label: '宿舍詳情' });
    }

    return breadcrumbs;
};
