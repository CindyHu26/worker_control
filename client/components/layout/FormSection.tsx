import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
    /**
     * Section title
     */
    title: string;

    /**
     * Optional description
     */
    description?: string;

    /**
     * Number of columns for fields (optimized for landscape)
     * Default: 3 (good for landscape screens)
     */
    columns?: 1 | 2 | 3 | 4;

    /**
     * Form fields
     */
    children: ReactNode;

    /**
     * Optional className for customization
     */
    className?: string;

    /**
     * Show divider below section (default: true)
     */
    divider?: boolean;
}

const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
};

/**
 * Form section component for organizing fields horizontally
 * Optimized for landscape screens to minimize scrolling and tab switching
 */
export default function FormSection({
    title,
    description,
    columns = 3,
    children,
    className,
    divider = true
}: FormSectionProps) {
    return (
        <div className={cn('space-y-4', divider && 'pb-6 mb-6 border-b border-gray-200', className)}>
            {/* Section Header */}
            <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-gray-600">
                        {description}
                    </p>
                )}
            </div>

            {/* Fields Grid - Optimized for Landscape */}
            <div className={cn('grid gap-4', columnClasses[columns])}>
                {children}
            </div>
        </div>
    );
}
