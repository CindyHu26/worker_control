"use client";

import { ReactNode } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface StandardPageLayoutProps {
    /**
     * Page title displayed prominently at the top
     */
    title: string;

    /**
     * Optional subtitle or description
     */
    subtitle?: string;

    /**
     * Alias for subtitle (for compatibility with PageContainer)
     */
    description?: string;

    /**
     * Breadcrumb navigation items
     */
    breadcrumbs?: BreadcrumbItem[];

    /**
     * Action buttons displayed on the right side of header
     */
    actions?: ReactNode;

    /**
     * Show back button (default: false)
     */
    showBack?: boolean;

    /**
     * Custom back handler, defaults to router.back()
     */
    onBack?: () => void;

    /**
     * Main content
     */
    children: ReactNode;
}

/**
 * StandardPageLayout - Universal layout shell for all administrative pages
 * 
 * Provides:
 * - Fixed header with title, breadcrumbs, and actions
 * - Scrollable content area (fixes viewport overflow bug)
 * - Consistent spacing and responsive design
 * - Back button support
 * 
 * This replaces PageContainer with proper scrolling behavior.
 */
export default function StandardPageLayout({
    title,
    subtitle,
    description,
    breadcrumbs,
    actions,
    showBack = false,
    onBack,
    children
}: StandardPageLayoutProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    // Use subtitle or description (for compatibility)
    const displaySubtitle = subtitle || description;

    return (
        <div className="flex flex-col h-full">
            {/* Header Section - Fixed */}
            <div className="flex-none border-b bg-white">
                <div className="px-4 py-4 md:px-6 md:py-6">
                    {/* Breadcrumbs */}
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            {breadcrumbs.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    {index > 0 && <ChevronRight className="h-4 w-4" />}
                                    {item.href ? (
                                        <a
                                            href={item.href}
                                            className="hover:text-gray-900 transition-colors"
                                        >
                                            {item.label}
                                        </a>
                                    ) : (
                                        <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}>
                                            {item.label}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </nav>
                    )}

                    {/* Title Row */}
                    <div className="flex items-start justify-between gap-4">
                        {/* Title Area */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            {showBack && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleBack}
                                    className="mt-0.5 flex-shrink-0"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                            <div className="min-w-0 flex-1">
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                    {title}
                                </h1>
                                {displaySubtitle && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {displaySubtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions Area */}
                        {actions && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="px-4 py-6 md:px-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * Standard Table Wrapper for consistent horizontal scrolling
 * Usage: <TableWrapper><Table>...</Table></TableWrapper>
 */
export function TableWrapper({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`w-full max-w-full overflow-x-auto border rounded-md bg-white ${className}`}>
            {children}
        </div>
    );
}
