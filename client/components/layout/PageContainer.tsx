import { ReactNode } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageContainerProps {
    /**
     * Page title displayed prominently at the top
     */
    title: string;

    /**
     * Optional subtitle or description
     */
    subtitle?: string;

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
     * Maximum width constraint (default: none for landscape optimization)
     * Options: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
     */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

    /**
     * Main content
     */
    children: ReactNode;

    /**
     * Apply card styling to content (default: true)
     */
    card?: boolean;
}

const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'w-full'
};

/**
 * Universal page layout wrapper for admin system
 * Optimized for landscape screens with wide horizontal layout
 */
export default function PageContainer({
    title,
    subtitle,
    breadcrumbs,
    actions,
    showBack = false,
    onBack,
    maxWidth = 'full',
    children,
    card = true
}: PageContainerProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className={`mx-auto px-6 py-6 ${maxWidthClasses[maxWidth]}`}>
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
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

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        {showBack && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBack}
                                className="mt-1 flex-shrink-0"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        )}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-gray-600 mt-2 text-base">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {actions && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {actions}
                        </div>
                    )}
                </div>

                {/* Content */}
                {card ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {children}
                    </div>
                ) : (
                    <>{children}</>
                )}
            </div>
        </div>
    );
}
